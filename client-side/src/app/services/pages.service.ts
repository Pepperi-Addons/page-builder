import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepScreenSizeType, PepSessionService, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
import { PepRemoteLoaderOptions } from "@pepperi-addons/ngx-remote-loader";
import { InstalledAddon, Page, PageBlock, NgComponentRelation, PageSection, PageSizeType, SplitType, PageSectionColumn, DataViewScreenSize, ResourceType, PageFilter } from "@pepperi-addons/papi-sdk";
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter } from 'rxjs/operators';
import { NavigationService } from "./navigation.service";

export type PageRowStatusType = 'draft' | 'published';
export interface IPageRowModel {
    Key: string,
    Name: string,
    Description: string,
    CreationDate: string,
    ModificationDate: string,
    Status: PageRowStatusType,
}

interface IPageBuilderDataForEditMode {
    page: Page, 
    availableBlocks: IAvailableBlockDataForEditMode[]
}

interface IAvailableBlockDataForEditMode {
    relation: NgComponentRelation, 
    addon: InstalledAddon 
}

export type EditorType = 'page-builder' | 'section' | 'block';
export interface IEditor {
    id: string,
    title: string,
    type: EditorType,
    remoteModuleOptions?: PepRemoteLoaderOptions,
    hostObject?: any
}

export interface IPageEditor {
    id: string,
    pageName: string,
    pageDescription: string,
    maxWidth: number,
    horizontalSpacing?: PageSizeType,
    verticalSpacing?: PageSizeType,
    sectionsGap?: PageSizeType,
    columnsGap?: PageSizeType,
    roundedCorners?: PageSizeType,
}

export interface ISectionEditor {
    id: string,
    sectionName: string,
    split: SplitType,
    height: number,
}

export interface IBlockEditor {
    id: string,
    configuration?: any,
}

export interface IAvailableBlock {
    options: PepRemoteLoaderOptions,
    relation: NgComponentRelation
}

export interface IBlockProgress {
    block: PageBlock;
    loaded: boolean;
    openEditorOnLoaded: boolean,
    priority: number;
}

export interface IBlockFilterData {
    FieldType: string;
    ApiName: string
    Operation: string
    Values: string[]
}

export interface IBlockFilter {
    key: string;
    resource: ResourceType;
    filter: IBlockFilterData;
}

interface IMappingResource {
    ResourceApiNames: string[];
    SearchIn: string[]
}

@Injectable({
    providedIn: 'root',
})
export class PagesService {
    private readonly CONSUMERS_PRIORITY = 1;
    private readonly PRODUCERS_AND_CONSUMERS_PRIORITY = 2;
    private readonly PRODUCERS_PRIORITY = 3;

    private _editorsBreadCrumb = Array<IEditor>();

    // This subject is for the screen size change events.
    private _screenSizeSubject: BehaviorSubject<PepScreenSizeType> = new BehaviorSubject<PepScreenSizeType>(PepScreenSizeType.XL);
    get onScreenSizeChange$(): Observable<PepScreenSizeType> {
        return this._screenSizeSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for demostrate the container size (Usage only in edit mode).
    private _screenWidthSubject: BehaviorSubject<string> = new BehaviorSubject<string>('100%');
    get onScreenWidthChange$(): Observable<string> {
        return this._screenWidthSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load the current editor (Usage only in edit mode).
    private _editorSubject: BehaviorSubject<IEditor> = new BehaviorSubject<IEditor>(null);
    get onEditorChange$(): Observable<IEditor> {
        return this._editorSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load available blocks on the main editor (Usage only in edit mode).
    private _availableBlocksSubject: BehaviorSubject<IAvailableBlock[]> = new BehaviorSubject<IAvailableBlock[]>([]);
    get availableBlocksLoadedSubject$(): Observable<IAvailableBlock[]> {
        return this._availableBlocksSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This is the sections subject (a pare from the page object)
    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get onSectionsChange$(): Observable<PageSection[]> {
        return this._sectionsSubject.asObservable();
    }
    
    // This subjects is for load the page blocks into map for better performance and order them by priorities.
    private _pageBlockProgressMap = new Map<string, IBlockProgress>();
    get pageBlockProgressMap(): ReadonlyMap<string, IBlockProgress> {
        return this._pageBlockProgressMap;
    }
    private _pageBlockProgressMapSubject$ = new BehaviorSubject<ReadonlyMap<string, IBlockProgress>>(this.pageBlockProgressMap);
    get pageBlockProgressMapChange$(): Observable<ReadonlyMap<string, IBlockProgress>> {
        return this._pageBlockProgressMapSubject$.asObservable();
    }

    // This is for the current stage of the priority to know what to load in each step.
    private _currentBlocksPriority: number = this.CONSUMERS_PRIORITY;
    get currentBlocksPriority() {
        return this._currentBlocksPriority;
    }
    
    // This subject is for page block change.
    private _pageBlockSubject: BehaviorSubject<PageBlock> = new BehaviorSubject<PageBlock>(null);
    get onPageBlockChange$(): Observable<PageBlock> {
        return this._pageBlockSubject.asObservable();
    }

    // This subject is for page change.
    private pageSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
    get pageLoad$(): Observable<Page> {
        return this.pageSubject.asObservable().pipe(distinctUntilChanged((prevPage, nextPage) => prevPage?.Key === nextPage?.Key));
    }
    get pageDataChange$(): Observable<Page> {
        return this.pageSubject.asObservable().pipe(filter(page => !!page));
    }

    // This map is for producers filters.
    private _pageProducersFiltersMap = new Map<string, IBlockFilter[]>();
    
    // This subject is for consumers filters change.
    private _pageConsumersFiltersMapSubject = new BehaviorSubject<Map<string, any>>(null);
    get pageConsumersFiltersMapChange$(): Observable<ReadonlyMap<string, any>> {
        return this._pageConsumersFiltersMapSubject.asObservable().pipe(distinctUntilChanged());
    }

    private _mappingsResourcesFields = new Map<string, IMappingResource>();

    constructor(
        private utilitiesService: PepUtilitiesService,
        private translate: TranslateService,
        private sessionService: PepSessionService,
        private httpService: PepHttpService,
        private navigationService: NavigationService
    ) {
        this.pageLoad$.subscribe((page: Page) => {
            this.loadDefaultEditor(page);
            this._sectionsSubject.next(page?.Layout.Sections ?? []);
            this.loadBlocks(page);
        });

        this.pageBlockProgressMapChange$.subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
            let needToRebuildFilters = false;

            // Check that all pageProducersFiltersMap blocks keys exist in blocksProgress (if some block is removed we need to clear his filter).
            this._pageProducersFiltersMap.forEach((value: IBlockFilter[], key: string) => {
                if (!blocksProgress.has(key)) {
                    this._pageProducersFiltersMap.delete(key);
                    needToRebuildFilters = true;
                }
            });

            if (needToRebuildFilters) {
                this.buildConsumersFilters();
            }
        });

        // Set the mappings resources.
        this.createMappingsResourcesMap();
    }

    private createMappingsResourcesMap(): void {
        this._mappingsResourcesFields.set('accounts', {
            ResourceApiNames: ['Account', 'OriginAccount'],
            SearchIn: ['activities', 'transactions', 'transaction_lines']
        });

        this._mappingsResourcesFields.set('transactions', {
            ResourceApiNames: ['Transaction'],
            SearchIn: ['transaction_lines']
        });

        this._mappingsResourcesFields.set('items', {
            ResourceApiNames: ['Item'],
            SearchIn: ['transaction_lines']
        });
    }

    private loadBlocks(page: Page) {
        if (page) {
            // Some logic to load the blocks by priority (first none or Produce only, second Consume & Produce, third Consume only).
            if (page.Blocks) {
                page.Blocks.forEach(block => {
                    const bp = this.addBlockProgress(block);
                    
                    // If the currentBlocksPriority is smaller then bp.priority set the bp.priority as the current.
                    if (this.currentBlocksPriority < bp.priority) {
                        // Set the current priority to start load all blocks by the current priority.
                        this._currentBlocksPriority = bp.priority;
                    }
                });
                
                this.notifyBlockProgressMapChange();
            }
        } else {
            this.removeAllBlocks();
        }
    }
    
    private getBlockPriority(block: PageBlock): number {
        // first none or Produce only, second Consume & Produce, third Consume only
        let priority = this.PRODUCERS_PRIORITY;

        if (block.PageConfiguration) {
            if (block.PageConfiguration.Consume && block.PageConfiguration.Produce) {
                priority = this.PRODUCERS_AND_CONSUMERS_PRIORITY;
            } else if (block.PageConfiguration.Consume) {
                priority = this.CONSUMERS_PRIORITY;
            }
        }

        return priority;
    }
    
    private setBlockAsLoadedAndCalculateCurrentPriority(blockKey: string) {
        const bpToUpdate = this._pageBlockProgressMap.get(blockKey);

        if (bpToUpdate && !bpToUpdate.loaded) {
            // Load editor only for the first time if openEditorOnLoaded is true.
            if (bpToUpdate.openEditorOnLoaded) {
                // setTimeout 0 for navigate on the UI thread.
                setTimeout(() => {
                    this.navigateToEditor('block', bpToUpdate.block.Key);
                }, 0);
            }

            bpToUpdate.loaded = true;

            let allBlocksWithSamePriorityLoaded = true;

            this._pageBlockProgressMap.forEach(bp => {
                if (bp.priority === this.currentBlocksPriority && !bp.loaded) {
                    allBlocksWithSamePriorityLoaded = false;
                }
            });

            // Only if all blocks from the same priority are loaded then move on to the next priority.
            if (allBlocksWithSamePriorityLoaded) {
                // Start from the lowest priority and change to the higest priority if exist
                let nextPriority = this.CONSUMERS_PRIORITY;

                // Find the next priority to load.
                this._pageBlockProgressMap.forEach(bp => {
                    if (!bp.loaded && bp.priority > nextPriority) {
                        nextPriority = bp.priority;
                    }
                });

                // Set the next priority.
                if (this._currentBlocksPriority != nextPriority) {
                    this._currentBlocksPriority = nextPriority;
    
                    // If we move to the consumers priority
                    if (this._currentBlocksPriority === this.CONSUMERS_PRIORITY) {
                        this.buildConsumersFilters();
                    }
                }
            }

            this.notifyBlockProgressMapChange();
        }
    }

    private addBlockProgress(block: PageBlock, openEditorOnLoaded: boolean = false): IBlockProgress {
        const priority = this.getBlockPriority(block);

        // Create block progress and add it to the map.
        const initialProgress: IBlockProgress = { 
            loaded: false,
            openEditorOnLoaded,
            priority,
            block
        };

        this._pageBlockProgressMap.set(block.Key, initialProgress);

        return initialProgress;
    }

    private addPageBlock(block: PageBlock, openEditorOnLoaded: boolean) {
        // Add the block to the page blocks.
        this.pageSubject.value.Blocks.push(block);

        // Add the block progress.
        this.addBlockProgress(block, openEditorOnLoaded);
        this.notifyBlockProgressMapChange();
    }

    private removePageBlock(blockId: string) {
        const index = this.pageSubject.value.Blocks.findIndex(block => block.Key === blockId);
        if (index > -1) {
            this.pageSubject.value.Blocks.splice(index, 1);
        }
    }

    private removeBlocks(blockIds: string[]) {
        if (blockIds.length > 0) {
            blockIds.forEach(blockId => {
                // Remove the block from the page blocks.
                this.removePageBlock(blockId)

                // Remove the block progress from the map.
                this._pageBlockProgressMap.delete(blockId);
            });
            
            this.notifyBlockProgressMapChange();
        }
    }

    private removeAllBlocks() {
        if (this.pageSubject.value) {
            this.pageSubject.value.Blocks = [];
        }

        this._pageBlockProgressMap.clear();
        this.notifyBlockProgressMapChange();
    }
    
    private notifyBlockProgressMapChange() {
        this._pageBlockProgressMapSubject$.next(this.pageBlockProgressMap);
    }

    private getProducerFiltersByConsumerFilter(producerFilters: IBlockFilter[], consumerFilter: PageFilter): IBlockFilter[] {
        // Get the match filters by the resource and fields.
        let consumerFilters = [];

        producerFilters.forEach(producerFilter => {
            // Search for exact match
            if (producerFilter.resource === consumerFilter.Resource && consumerFilter.Fields.some((apiName) => apiName === producerFilter.filter.ApiName)) {
                consumerFilters.push(producerFilter);
            } else {
                // Check if there is a match by the mapping.
                if (this._mappingsResourcesFields.has(producerFilter.resource)) {
                    let mappingResource = this._mappingsResourcesFields.get(producerFilter.resource);
                    
                    // If the consumer resource is in the mappingResource.SearchIn then look for match.
                    if (mappingResource.SearchIn.some((resourceToSearch) => resourceToSearch === consumerFilter.Resource)) {
                        // Go for all the resources.
                        for (let index = 0; index < mappingResource.ResourceApiNames.length; index++) {
                            // Declare the complex api name
                            const complexApiName = `${mappingResource.ResourceApiNames[index]}.${producerFilter.filter.ApiName}`;
                            
                            // If the complex api name exist in the consumerFilter.Fields (even a part of it).
                            if (consumerFilter.Fields.some((apiName) => apiName.indexOf(complexApiName) >= 0)) {
                                consumerFilters.push(producerFilter);
                            }
                        }
                    }
                }
            }
        });

        return consumerFilters;
    }

    private getHostObjectFilter(blockFilters: IBlockFilter[]): any {
        let res = {};

        if (blockFilters.length === 1) {
            const blockFilter = blockFilters.pop();
            res = blockFilter.filter;
        } else if (blockFilters.length >= 2) {
            const rightFilter = blockFilters.pop();
            
            res['Operation'] = 'AND';
            res['RightNode'] = rightFilter.filter;

            // After pop (when we have exaclly 2 filters)
            if (blockFilters.length == 1) {
                const leftFilter = blockFilters.pop();
                res['LeftNode'] = leftFilter.filter;
            } else {
                res['LeftNode'] = this.getHostObjectFilter(blockFilters);
            }
        } 

        return res;
    }

    private canProducerRaiseFilter(produceFilters: PageFilter[], blockFilter: IBlockFilter): boolean {
        let res = false;

        // Get the match filters that blockFilter.resource is equals produceFilters Resource.
        const matchProduceFilters = produceFilters.filter(filter => filter.Resource === blockFilter.resource);
        
        if (matchProduceFilters && matchProduceFilters.length > 0) {
            // Check if the blockFilter.ApiName exist in the matchProduceFilters.Fields.
            for (let index = 0; index < matchProduceFilters.length; index++) {
                const filter = matchProduceFilters[index];
                
                if (filter.Fields.some(field => field === blockFilter.filter.ApiName)) {
                    res = true;
                    break;
                }
            }
        }

        return res;
    }

    private buildConsumersFilters() {
        // Build consumers filters
        let consumersFilters = new Map<string, any>();

        // Run on all consumers.
        this.pageBlockProgressMap.forEach((value: IBlockProgress, key: string) => {
            const consume = value.block.PageConfiguration?.Consume || null;
            if (consume && consume.Filter) {
                let consumerFilters: IBlockFilter[] = [];

                // Check if resource exist in the producers filters.
                this._pageProducersFiltersMap.forEach((value: IBlockFilter[], key: string) => {
                    let filtersByConsumerResource = this.getProducerFiltersByConsumerFilter(value, consume.Filter);
                    
                    if (filtersByConsumerResource) {
                        consumerFilters.push(...filtersByConsumerResource);
                    }
                });

                // Build host object filter from consumerFilters ("Operation": "AND", "RightNode": { etc..)
                let hostObjectFilter = consumerFilters.length > 0 ? this.getHostObjectFilter(consumerFilters) : null;
                consumersFilters.set(value.block.Key, hostObjectFilter);
            }
        });

        this._pageConsumersFiltersMapSubject.next(consumersFilters);
    }

    private loadDefaultEditor(page: Page) {
        this._editorsBreadCrumb = new Array<IEditor>();

        if (page) {
            const pageEditor: IPageEditor = {
                id: page?.Key,
                pageName: page?.Name,
                pageDescription: page?.Description,
                maxWidth: page?.Layout.MaxWidth,
                verticalSpacing: page?.Layout.VerticalSpacing,
                horizontalSpacing: page?.Layout.HorizontalSpacing,
                sectionsGap: page?.Layout.SectionsGap,
                columnsGap: page?.Layout.ColumnsGap,
                // roundedCorners: page?.Layout.
            };

            this._editorsBreadCrumb.push({
                id: 'main',
                type : 'page-builder',
                title: page?.Name,
                hostObject: pageEditor
            });

            this._editorSubject.next(this._editorsBreadCrumb[0]);
        } else {
            this._editorSubject.next(null);
        }
    }

    private changeCurrentEditor() {
        if (this._editorsBreadCrumb.length > 0) {
            this._editorSubject.next(this._editorsBreadCrumb[this._editorsBreadCrumb.length - 1]);
        }
    }

    private getEditor(editorType: EditorType, id: string): IEditor {
        // Build editor object.
        let editor: IEditor = null;

        if (editorType === 'section') {
            editor = this.getSectionEditor(id);
        } else if (editorType === 'block') {
            editor = this.getBlockEditor(id);
        }

        return editor;
    }

    private getEditorHostObject(block: PageBlock): any {
        let hostObject = {
            configuration: block.Configuration
        };

        // Add pageConfiguration if exist.
        if (block.PageConfiguration) {
            hostObject['pageConfiguration'] = block.PageConfiguration;
        }
        
        // Add pageType if exist.
        if (this.pageSubject?.value.Type) {
            hostObject['pageType'] = this.pageSubject?.value.Type;
        }

        return hostObject;
    }

    private getBlockEditor(blockId: string): IEditor {
        // Get the current block.
        let block: PageBlock = this.pageSubject?.value?.Blocks.find(block => block.Key === blockId);
        
        if (block) {
            // Change the RemoteLoaderOptions of the block for loading the block editor.
            let editorRelationOptions: PepRemoteLoaderOptions = JSON.parse(JSON.stringify(block.Relation.Options));
            editorRelationOptions.exposedModule = './' + block.Relation.EditorModuleName;
            editorRelationOptions.componentName = block.Relation.EditorComponentName;

            const hostObject = this.getEditorHostObject(block);

            return {
                id: blockId,
                type: 'block',
                title: block.Relation.Description,
                remoteModuleOptions: editorRelationOptions,
                hostObject: hostObject
            }
        } else {
            return null;
        }
    }

    private getSectionEditorTitle(section: PageSection, sectionIndex: number): string {
        return section.Name || `${this.translate.instant('PAGE_MANAGER.SECTION')} ${sectionIndex + 1}`;
    }

    private getSectionEditor(sectionId: string): IEditor {
        // Get the current block.
        const sectionIndex = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        
        if (sectionIndex >= 0) {
            let section = this._sectionsSubject.value[sectionIndex];
            const sectionEditor: ISectionEditor = {
                id: section.Key,
                sectionName: section.Name || '',
                split: section.Split || undefined,
                height: section.Height || 0,
            }

            return {
                id: sectionId,
                type: 'section',
                title: this.getSectionEditorTitle(section, sectionIndex),
                hostObject: sectionEditor
            }
        } else {
            return null;
        }
    }

    private getSectionColumnById(sectionColumnId: string): PageSectionColumn {
        let currentColumn = null;

        // Get the section and column array by the pattern of the section column key.
        const sectionColumnPatternSeparator = this.getSectionColumnKey();
        const sectionColumnArr = sectionColumnId.split(sectionColumnPatternSeparator);

        if (sectionColumnArr.length === 2) {
            // Get the section id to get the section index.
            const sectionId = sectionColumnArr[0];
            const sectionIndex = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
            // Get the column index.
            const columnIndex = sectionColumnArr[1];
            currentColumn = this._sectionsSubject.value[sectionIndex].Columns[columnIndex];
        } 
        
        return currentColumn;
    }

    private getRemoteEntryByType(relation: NgComponentRelation, remoteBasePath: string, remoteName: string) {
        switch (relation.Type){
            case "NgComponent":
                // For devBlocks gets the remote entry from the query params.
                const devBlocks = this.navigationService.devBlocks;
                if (devBlocks.has(relation?.ComponentName)) {
                    return devBlocks.get(relation?.ComponentName);
                } else {
                    return `${remoteBasePath}${remoteName}.js`;
                }
            default:
                return relation?.AddonRelativeURL;
        }
    }

    private getRemoteLoaderOptions(relation: NgComponentRelation, remoteBasePath: string) {
        return {
            addonId: relation?.AddonUUID,
            remoteEntry: this.getRemoteEntryByType(relation, remoteBasePath, relation.AddonRelativeURL),
            remoteName: relation.AddonRelativeURL,
            exposedModule: './' + relation?.ModuleName,
            componentName: relation?.ComponentName,
        }
    }

    private getBaseUrl(addonUUID: string): string {
        // For devServer run server on localhost.
        if(this.navigationService.devServer) {
            return `http://localhost:4500/api`;
        } else {
            const baseUrl = this.sessionService.getPapiBaseUrl();
            return `${baseUrl}/addons/api/${addonUUID}/api`;
        }
    }

    getBlockHostObject(block: PageBlock, screenType: DataViewScreenSize): any {
        
        let hostObject = this.getEditorHostObject(block);
        
        // Add filter.
        hostObject['filter'] = this._pageConsumersFiltersMapSubject.value?.get(block.Key) || null;
        
        // TODO: Add context.


        hostObject['screenType'] = screenType;

        return hostObject;
    }

    getScreenType(size: PepScreenSizeType): DataViewScreenSize {
        const screenType: DataViewScreenSize =
            size < PepScreenSizeType.MD ? 'Landscape' :
            (size === PepScreenSizeType.MD || size === PepScreenSizeType.SM ? 'Tablet' : 'Phablet');

        return screenType;
    }
    
    getSectionColumnKey(sectionKey: string = '', index: string = '') {
        return `${sectionKey}_column_${index}`;
    }

    navigateToEditor(editorType: EditorType, id: string): boolean {
        let success = false;

        // Cannot navigate into 'page-builder' because this is first and const in the editorsBreadCrumbs.
        if (editorType !== 'page-builder' && id?.length > 0) {
            // Check which editor we have now
            const currentEditor = this._editorsBreadCrumb[this._editorsBreadCrumb.length - 1];

            // Only if it's another editor.
            if(currentEditor.id !== id) {
                if (currentEditor.type !== 'page-builder') {
                    // Always pop the last and insert the current.
                    this._editorsBreadCrumb.pop();
                }

                let editor = this.getEditor(editorType, id);
                this._editorsBreadCrumb.push(editor);
                this.changeCurrentEditor();
                success = true;
            }
        }
        
        return success;
    }

    navigateBackFromEditor() {
        // Keep the page builder editor.
        if (this._editorsBreadCrumb.length > 1) {
            // Maybe we want to compare the last editor for validation ?
            const lastEditor = this._editorsBreadCrumb.pop();
            this.changeCurrentEditor();
        }
    }

    updatePageFromEditor(pageData: IPageEditor) {
        // Update editor title 
        const currentEditor = this._editorSubject.value;
        if (currentEditor.type === 'page-builder' && currentEditor.id === 'main') {
            currentEditor.title = pageData.pageName;
        }

        const currentPage = this.pageSubject.value;

        if (currentPage) {
            currentPage.Name = pageData.pageName;
            currentPage.Description = pageData.pageDescription;
            currentPage.Layout.MaxWidth = pageData.maxWidth;
            currentPage.Layout.HorizontalSpacing = pageData.horizontalSpacing;
            currentPage.Layout.VerticalSpacing = pageData.verticalSpacing;
            currentPage.Layout.SectionsGap = pageData.sectionsGap;
            currentPage.Layout.ColumnsGap = pageData.columnsGap;
            // currentPage.Layout.RoundedCorners = pageData.roundedCorners;

            this.pageSubject.next(currentPage);
        }
    }

    updateSectionFromEditor(sectionData: ISectionEditor) {
        const sectionIndex = this._sectionsSubject.value.findIndex(section => section.Key === sectionData.id);
        
        // Update section details.
        if (sectionIndex >= 0) {
            const currentSection = this._sectionsSubject.value[sectionIndex];
            currentSection.Name = sectionData.sectionName;
            currentSection.Split = sectionData.split;
            currentSection.Height = sectionData.height;

            // Get the new columns number from currentSection.Split, if its undefined put a default 1.
            const newColumnsLength = currentSection.Split?.split(' ').length || 1;
            if (newColumnsLength > currentSection.Columns.length) {
                while (newColumnsLength > currentSection.Columns.length) {
                    currentSection.Columns.push({});
                }
            } else if (newColumnsLength < currentSection.Columns.length) {
                const blocksIdsToRemove = [];
                while (newColumnsLength < currentSection.Columns.length) {
                    const colunm = currentSection.Columns.pop();
                    // If there is block in this column delete it.
                    if (colunm.Block) {
                        blocksIdsToRemove.push(colunm.Block.BlockKey);
                    }
                }
                
                this.removeBlocks(blocksIdsToRemove);
            }
        
            // Update editor title 
            const currentEditor = this._editorSubject.value;
            if (currentEditor.type === 'section' && currentEditor.id === currentSection.Key) {
                currentEditor.title = this.getSectionEditorTitle(currentSection, sectionIndex);
            }

            // Update sections change.
            this._sectionsSubject.next(this._sectionsSubject.value);
        }
    }

    addSection(section: PageSection = null) {
        // Create new section
        if (!section) {
            section = {
                Key: PepGuid.newGuid(),
                Columns: [{}], // Add empty section column
                Hide: []
            }
        }
        
        // Add the new section to page layout.
        this.pageSubject.value.Layout.Sections.push(section);
        this._sectionsSubject.next(this.pageSubject.value.Layout.Sections);
    }

    removeSection(sectionId: string) {
        const index = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            // Get the blocks id's to remove.
            const blocksIds = this._sectionsSubject.value[index].Columns.map(column => column?.Block?.BlockKey);
            
            // Remove the blocks by ids.
            this.removeBlocks(blocksIds)

            // Remove section.
            this._sectionsSubject.value.splice(index, 1);
        }
    }

    hideSection(sectionId: string, hideIn: DataViewScreenSize[]) {
        const index = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            this._sectionsSubject.value[index].Hide = hideIn;
        }
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        moveItemInArray(this._sectionsSubject.value, event.previousIndex, event.currentIndex);
    }

    onRemoveBlock(sectionId: string, blockId: string) {
        const index = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = this._sectionsSubject.value[index].Columns.findIndex(column => column.Block?.BlockKey === blockId);
            if (columnIndex > -1) {
                // Remove the block.
                this.removeBlocks([blockId]);

                // Remove the block from section column.
                delete this._sectionsSubject.value[index].Columns[columnIndex].Block;
            }
        }
    }

    hideBlock(sectionId: string, blockId: string, hideIn: DataViewScreenSize[]) {
        const index = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = this._sectionsSubject.value[index].Columns.findIndex(column => column.Block?.BlockKey === blockId);
            if (columnIndex > -1) {
                this._sectionsSubject.value[index].Columns[columnIndex].Block.Hide = hideIn;
            }
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>, sectionId: string) {
        if (event.previousContainer.id == 'availableBlocks') {
            // Create new block from the relation (previousContainer.data is AvailableBlock object).
            const relation = event.previousContainer.data[event.previousIndex].relation;
            relation["Options"] = event.previousContainer.data[event.previousIndex].options;
            
            let block: PageBlock = {
                Key: PepGuid.newGuid(),
                Relation: relation
            }

            // Get the column.
            const currentColumn = this.getSectionColumnById(event.container.id);
            
            // Set the block key in the section block only if there is a blank column.
            if (currentColumn && !currentColumn.Block) {
                currentColumn.Block = { 
                    BlockKey: block.Key
                };
                
                // Add the block to the page blocks and navigate to block editor when the block will loaded.
                this.addPageBlock(block, true);
            }
        } else {
            // If the block moved between columns the same section or between different sections but not in the same column.
            if (event.container.id !== event.previousContainer.id) {
                // Get the column.
                const currentColumn = this.getSectionColumnById(event.container.id);
                // Get the previous column.
                const previuosColumn = this.getSectionColumnById(event.previousContainer.id);

                currentColumn.Block = previuosColumn.Block;
                delete previuosColumn.Block;
            }
        }
    }
    
    updateBlockLoaded(blockKey: string) {
        this.setBlockAsLoadedAndCalculateCurrentPriority(blockKey);
    }
    
    updateBlockConfiguration(blockKey: string, configuration: any) {
        const pageBlock = this.pageBlockProgressMap.get(blockKey);
        
        if (pageBlock) {
            pageBlock.block.Configuration = configuration;
            this._pageBlockSubject.next(pageBlock.block);
        }
    }
    
    updateBlockPageConfiguration(blockKey: string, pageConfiguration: any) {
        const pageBlock = this.pageBlockProgressMap.get(blockKey);
        
        if (pageBlock) {
            pageBlock.block.PageConfiguration = pageConfiguration;
            this._pageBlockSubject.next(pageBlock.block);

            // Calculate all filters by the updated page configuration.
            this.buildConsumersFilters();
        }
    }
    
    updateBlockFilters(blockKey: string, blockFilters: IBlockFilter[]) {
        const pageBlock = this.pageBlockProgressMap.get(blockKey);

        // Only if this block is declared as produce.
        if (pageBlock?.block?.PageConfiguration?.Produce) {
            // Check if this block can raise those filters.
            const produceFilters = pageBlock.block.PageConfiguration.Produce.Filters;
            let canRasieFilters = true;

            for (let index = 0; index < blockFilters.length; index++) {
                const blockFilter = blockFilters[index];
                canRasieFilters = this.canProducerRaiseFilter(produceFilters, blockFilter);

                if (!canRasieFilters) {
                    // Write error to the console "You cannot raise this filter (not declared)."
                    console.error('One or more from the raised filters are not declared in PageConfiguration object.');
                    break;
                }
            }

            if (canRasieFilters) {
                this._pageProducersFiltersMap.set(blockKey, blockFilters);
    
                // Raise the filters change only if this block has loaded AND the currentBlocksPriority is CONSUMERS_PRIORITY (consumers stage)
                // because in case that the block isn't loaded we will raise the event once when all the blocks are ready.
                if (pageBlock.loaded && this.currentBlocksPriority === this.CONSUMERS_PRIORITY) {
                    this.buildConsumersFilters();
                }
            }
        }
    }

    changeCursorOnDragStart() {
        document.body.classList.add('inheritCursors');
        document.body.style.cursor = 'grabbing';
    }

    changeCursorOnDragEnd() {
        document.body.classList.remove('inheritCursors');
        document.body.style.cursor = 'unset';
    }

    doesColumnContainBlock(sectionId: string, columnIndex: number): boolean {
        let res = false;
        const section = this._sectionsSubject.value.find(section => section.Key === sectionId);

        if (section && columnIndex >= 0 && section.Columns.length > columnIndex) {
            res = !!section.Columns[columnIndex].Block;
        }

        return res;
    }

    setScreenWidth(value: string) {
        let width = this.utilitiesService.coerceNumberProperty(value, 0);
        if (width === 0) {
            this._screenWidthSubject.next('100%');
            this._screenSizeSubject.next(PepScreenSizeType.XL);
        } else {
            this._screenWidthSubject.next(`${width}px`);

            // Change the size according the width.
            if (width >= 1920) {
                this._screenSizeSubject.next(PepScreenSizeType.XL);
            } else if (width >= 1280 && width < 1920) {
                this._screenSizeSubject.next(PepScreenSizeType.LG);
            } else if (width >= 960 && width < 1280) {
                this._screenSizeSubject.next(PepScreenSizeType.MD);
            } else if (width >= 600 && width < 960) {
                this._screenSizeSubject.next(PepScreenSizeType.SM);
            } else if (width < 600) {
                this._screenSizeSubject.next(PepScreenSizeType.XS);
            }
        }
    }
    
    //**************************************************************************
    // CPI & Server side calls.
    //**************************************************************************
    
    // Get the pages (distinct with the drafts)
    getPages(addonUUID: string, options: any): Observable<IPageRowModel[]> {
        // Get the pages from the server.
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/get_pages_data?${options}`);
    }

    createNewPage(addonUUID: string, templateId: any): Observable<Page> {
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/create_page?templateId=${templateId}`);
    }

    // Delete the page
    deletePage(addonUUID: string, pageKey: string): Observable<any> {
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/remove_page?key=${pageKey}`);
    }

    loadPageBuilder(addonUUID: string, pageKey: string, editable: boolean): void {
        //  If is't not edit mode get the page from the CPI side.
        const baseUrl = this.getBaseUrl(addonUUID);
        if (!editable) {
            // TODO: Get from CPI side.
            // Get the page (sections and the blocks data) from the server.
            this.httpService.getHttpCall(`${baseUrl}/get_page?key=${pageKey}`)
                .subscribe((res: Page) => {
                    if (res) {
                        // Load the page.
                        this.pageSubject.next(res);
                    }
            });

        } else { // If is't edit mode get the data of the page and the relations from the Server side.
            // Get the page (sections and the blocks data) from the server.
            this.httpService.getHttpCall(`${baseUrl}/get_page_builder_data?key=${pageKey}`)
                .subscribe((res: IPageBuilderDataForEditMode) => {
                    if (res && res.page && res.availableBlocks) {
                        // Load the available blocks.
                        const availableBlocks: IAvailableBlock[] = [];
                        res.availableBlocks.forEach(data => {
                            const relation: NgComponentRelation = data?.relation;
                            const addon: InstalledAddon = data?.addon;
                            
                            if (relation && addon) {
                                availableBlocks.push({
                                    relation: relation,
                                    options: this.getRemoteLoaderOptions(relation, addon?.PublicBaseURL)
                                });
                            }
                        });
                            
                        this._availableBlocksSubject.next(availableBlocks);

                        // Update the relation options of the save blocks.
                        // if exist in the available blocks take the relation options, 
                        // else take it from the save data (if there is devBlocks parameter handled in getRemoteLoaderOptions function).
                        res.page.Blocks?.forEach(block => {
                            const availableBlock = availableBlocks.find(ab => ab.relation.AddonUUID === block.Relation.AddonUUID && ab.relation.Name === block.Relation.Name);

                            if (availableBlock) {
                                block.Relation.Options = availableBlock.options;
                            } else {
                                const remoteBasePath = block.Relation.Options.remoteEntry.replace(`${block.Relation.Options.remoteName}.js`, '');
                                block.Relation.Options = this.getRemoteLoaderOptions(block.Relation, remoteBasePath);
                            }
                        });
                        
                        // Load the page.
                        this.pageSubject.next(res.page);
                    }
            });
        }
    }

    unloadPageBuilder() {
        this.pageSubject.next(null);
    }

    // Restore the page to tha last publish
    restoreToLastPublish(addonUUID: string, pageKey: string): Observable<boolean> {
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/restore_to_last_publish?key=${pageKey}`)
    }

    // Save the current page in drafts.
    saveCurrentPage(addonUUID: string): Observable<Page> {
        const page: Page = this.pageSubject.value;
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.postHttpCall(`${baseUrl}/save_page`, body);
    }

    // Publish the current page.
    publishCurrentPage(addonUUID: string): Observable<Page> {
        const page: Page = this.pageSubject.value;
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.postHttpCall(`${baseUrl}/publish_page`, body);
    }
}
