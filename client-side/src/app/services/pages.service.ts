import { CdkDragDrop, CdkDragEnd, CdkDragStart, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepScreenSizeType, PepSessionService, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
import { PepRemoteLoaderOptions } from "@pepperi-addons/ngx-remote-loader";
import { InstalledAddon, Page, PageBlock, NgComponentRelation, PageSection, PageSizeType, SplitType, PageSectionColumn, DataViewScreenSize, ResourceType, PageConfigurationParameterFilter, PageConfiguration, PageConfigurationParameterBase, PageConfigurationParameterString } from "@pepperi-addons/papi-sdk";
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter } from 'rxjs/operators';
import { NavigationService } from "./navigation.service";
import { UtilitiesService } from "./utilities.service";

export type UiPageSizeType = PageSizeType | 'none';

export type PageRowStatusType = 'draft' | 'published';
export interface IPageRowModel {
    Key: string,
    Name: string,
    Description: string,
    CreationDate: string,
    ModificationDate: string,
    Status: PageRowStatusType,
}

interface IPageBuilderData {
    page: Page, 
    availableBlocks: IAvailableBlockData[]
}

interface IAvailableBlockData {
    relation: NgComponentRelation, 
    addonPublicBaseURL: string
    // addon: InstalledAddon 
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

export interface IBlockProgress {
    block: PageBlock;
    loaded: boolean;
    openEditorOnLoaded: boolean,
    priority: number;
}

interface IProducerFilterData {
    FieldType: string;
    ApiName: string
    Operation: string
    Values: string[]
}

interface IProducerFilter {
    // key: string;
    resource: ResourceType;
    filter: IProducerFilterData;
}

interface IProducerParameters {
    // key is the block key, value is string | IProduceFilter[]
    producerParametersMap: Map<string, string | IProducerFilter[]>;
}

export interface IPageBlockHostObject {
    configuration: any;
    pageConfiguration?: PageConfiguration;
    parameters?: any;
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
    private _availableBlocksSubject: BehaviorSubject<NgComponentRelation[]> = new BehaviorSubject<NgComponentRelation[]>([]);
    get availableBlocksLoadedSubject$(): Observable<NgComponentRelation[]> {
        return this._availableBlocksSubject.asObservable().pipe(distinctUntilChanged());
    }

    // For load the blocks
    private _blocksRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();
    // For load the blocks editors
    private _blocksEditorsRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();
    
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

    // This map is for producers parameters by parameter key.
    private _producerParameterKeysMap = new Map<string, IProducerParameters>();
    
    // This subject is for consumers parameters change.
    private _consumerParametersMapSubject = new BehaviorSubject<Map<string, any>>(null);
    get consumerParametersMapChange$(): Observable<ReadonlyMap<string, any>> {
        return this._consumerParametersMapSubject.asObservable().pipe(distinctUntilChanged());
    }
    
    private _mappingsResourcesFields = new Map<string, IMappingResource>();

    // This subject is for edit mode when block is dragging now or not.
    private _draggingBlockKey: BehaviorSubject<string> = new BehaviorSubject('');
    get draggingBlockKey(): Observable<string> {
        return this._draggingBlockKey.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for edit mode when section is dragging now or not.
    private _draggingSectionKey: BehaviorSubject<string> = new BehaviorSubject('');
    get draggingSectionKey(): Observable<string> {
        return this._draggingSectionKey.asObservable().pipe(distinctUntilChanged());
    }

    constructor(
        private utilitiesService: UtilitiesService,
        private pepUtilitiesService: PepUtilitiesService,
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
            this._producerParameterKeysMap.forEach((value: IProducerParameters, parameterKey: string) => {
                value?.producerParametersMap.forEach((parameterValue: any, producerBlockKey: string) => {
                    if (!blocksProgress.has(producerBlockKey)) {
                        // Delete the producer data in the current parameter.
                        value.producerParametersMap.delete(producerBlockKey);
                        needToRebuildFilters = true;
                    }
                });
            });

            if (needToRebuildFilters) {
                this.buildConsumersParameters();
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

        if (block.PageConfiguration?.Parameters.length > 0) {
            const isConsumeFilters = block.PageConfiguration.Parameters.some(param => param.Consume && param.Type === 'Filter');
            const isProduceFilters = block.PageConfiguration.Parameters.some(param => param.Produce && param.Type === 'Filter');

            if (isConsumeFilters && isProduceFilters) {
                priority = this.PRODUCERS_AND_CONSUMERS_PRIORITY;
            } else if (isConsumeFilters) {
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
                        this.buildConsumersParameters();
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

    private getProducerFiltersByConsumerFilter(producerFilters: IProducerFilter[], consumerFilter: PageConfigurationParameterFilter): IProducerFilter[] {
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
                            const filterFieldApiName = consumerFilter.Fields.find((apiName) => apiName.indexOf(complexApiName) >= 0);
                            if (filterFieldApiName) {
                                // Copy the producer filter (by value) and change the API name to be like the consumer need to get.
                                const tmpFilterToAdd = Object.assign({}, producerFilter);
                                tmpFilterToAdd.filter.ApiName = filterFieldApiName;
                                consumerFilters.push(tmpFilterToAdd);
                            }
                        }
                    }
                }
            }
        });

        return consumerFilters;
    }

    private getConsumerFilter(producerFilters: IProducerFilter[]): any {
        let res = {};

        if (producerFilters.length === 1) {
            const produceFilter = producerFilters.pop();
            res = produceFilter.filter;
        } else if (producerFilters.length >= 2) {
            const rightFilter = producerFilters.pop();
            
            res['Operation'] = 'AND';
            res['RightNode'] = rightFilter.filter;

            // After pop (when we have exaclly 2 filters)
            if (producerFilters.length == 1) {
                const leftFilter = producerFilters.pop();
                res['LeftNode'] = leftFilter.filter;
            } else {
                res['LeftNode'] = this.getConsumerFilter(producerFilters);
            }
        } 

        return res;
    }

    private canProducerRaiseFilter(filtersParameters: PageConfigurationParameterFilter[], producerFilter: IProducerFilter): boolean {
        let res = false;

        // Get the match filters that blockFilter.resource is equals producerFilters Resource.
        const matchProducerFilters = filtersParameters.filter(filter => filter.Resource === producerFilter.resource);
        
        if (matchProducerFilters && matchProducerFilters.length > 0) {
            // Check if the blockFilter.ApiName exist in the matchProducerFilters.Fields.
            for (let index = 0; index < matchProducerFilters.length; index++) {
                const filter = matchProducerFilters[index];
                
                if (filter.Fields.some(field => field === producerFilter.filter.ApiName)) {
                    res = true;
                    break;
                }
            }
        }

        return res;
    }

    // Build the consumer parameters map by the parameters keys and the producers filters.
    private buildConsumersParameters() {
        let consumersParametersMap = new Map<string, any>();

        // Run on all consumers.
        this.pageBlockProgressMap.forEach((value: IBlockProgress, key: string) => {
            const consumerParameters = value.block.PageConfiguration?.Parameters.filter(param => param.Consume) as PageConfigurationParameterBase[];
            
            if (consumerParameters?.length > 0) {
                let consumerParametersObject = {};
                
                // Go for all the consumer parameters
                for (let index = 0; index < consumerParameters.length; index++) {
                    const consumerParameter = consumerParameters[index];

                    if (consumerParameter.Type === 'String') {
                        // Get the producer strings by the parameter key.
                        const producerStringMap = this._producerParameterKeysMap.get(consumerParameter.Key)?.producerParametersMap;
                        
                        // The last value will override (can be only one value for parameter key of type string).
                        producerStringMap?.forEach((value: string, key: string) => {
                            consumerParametersObject[consumerParameter.Key] = value;
                        });

                    } else if (consumerParameter.Type === 'Filter') {
                        let consumerFilters: IProducerFilter[] = [];
                        // Get the producer filters by the parameter key.
                        const producerFiltersMap = this._producerParameterKeysMap.get(consumerParameter.Key)?.producerParametersMap;

                        // Check if resource exist in the producers filters.
                        producerFiltersMap?.forEach((value: IProducerFilter[], key: string) => {
                            let filtersByConsumerResource = this.getProducerFiltersByConsumerFilter(value, consumerParameter as PageConfigurationParameterFilter);
                            
                            if (filtersByConsumerResource) {
                                consumerFilters.push(...filtersByConsumerResource);
                            }
                        });
                    
                        // Build host object filter from consumerFilters ("Operation": "AND", "RightNode": { etc..)
                        if (consumerFilters.length > 0) {
                            consumerParametersObject[consumerParameter.Key] = this.getConsumerFilter(consumerFilters);
                        }
                    }
                }

                // Add the consumerParametersObject to the consumersParametersMap
                consumersParametersMap.set(value.block.Key, consumerParametersObject);
            }
        });

        this._consumerParametersMapSubject.next(consumersParametersMap);
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

    private getMergedConfigurationData(block: PageBlock): any {
        // Copy the object data.
        let configurationData = Object.assign({}, block.Configuration.Data);
        const currentScreenType = this.getScreenType(this._screenSizeSubject.value);
        
        // Get the configuration data by the current screen size (if exist then merge it up to Tablet and up to Landscape).
        if (currentScreenType !== 'Landscape') {
            // Merge from Tablet
            if (block.ConfigurationPerScreenSize?.Tablet) {
                configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);
            }

            // If currentScreenType === 'Phablet' merge from mobile
            if (currentScreenType === 'Phablet' && block.ConfigurationPerScreenSize?.Mobile) {
                configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Mobile);
            }
        }

        return configurationData;
    }

    private getEditorHostObject(block: PageBlock): IPageBlockHostObject {
        let hostObject: IPageBlockHostObject = {
            configuration: this.getMergedConfigurationData(block)
        };

        // Add pageConfiguration if exist.
        if (block.PageConfiguration) {
            hostObject.pageConfiguration = block.PageConfiguration;
        }
        
        return hostObject;
    }

    private getBlockEditor(blockId: string): IEditor {
        // Get the current block.
        let block: PageBlock = this.pageSubject?.value?.Blocks.find(block => block.Key === blockId);
        const key = this.getRemoteLoaderMapKey(block.Relation);
        const remoteLoaderOptions = this._blocksEditorsRemoteLoaderOptionsMap.get(key);

        if (block && remoteLoaderOptions) {
            const hostObject = this.getEditorHostObject(block);

            return {
                id: blockId,
                type: 'block',
                title: block.Relation.Name,
                remoteModuleOptions: remoteLoaderOptions,
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

    private getRemoteEntryByType(relation: NgComponentRelation, remoteBasePath: string) {
        // For devBlocks gets the remote entry from the query params.
        const devBlocks = this.navigationService.devBlocks;
        if (devBlocks.has(relation.ModuleName)) {
            return devBlocks.get(relation.ModuleName);
        } else if (devBlocks.has(relation.ComponentName)) {
            return devBlocks.get(relation.ComponentName);
        } else {
            return `${remoteBasePath}${relation.AddonRelativeURL}.js`;
        }
    }

    private getRemoteLoaderOptions(relation: NgComponentRelation, remoteBasePath: string, editor = false) {
        return {
            key: relation.Key,
            addonId: relation.AddonUUID,
            remoteEntry: this.getRemoteEntryByType(relation, remoteBasePath),
            remoteName: relation.AddonRelativeURL,
            exposedModule: './' + (editor ? relation.EditorModuleName : relation.ModuleName),
            componentName: (editor ? relation.EditorComponentName : relation.ComponentName),
        }
    }

    private getBaseUrl(addonUUID: string): string {
        // For devServer run server on localhost.
        if(this.navigationService.devServer) {
            return `http://localhost:4500/internal_api`;
        } else {
            const baseUrl = this.sessionService.getPapiBaseUrl();
            return `${baseUrl}/addons/api/${addonUUID}/internal_api`;
        }
    }
    
    private loadBlocksRemoteLoaderOptionsMap(availableBlocks: IAvailableBlockData[]) {
        this._blocksRemoteLoaderOptionsMap.clear();

        availableBlocks.forEach(data => {
            const relation: NgComponentRelation = data?.relation;
            const addonPublicBaseURL = data?.addonPublicBaseURL;
            
            if (relation && addonPublicBaseURL) {
                const key = this.getRemoteLoaderMapKey(relation);
                this._blocksRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(relation, addonPublicBaseURL));
            }
        });
    }

    private loadBlocksEditorsRemoteLoaderOptionsMap(availableBlocks: IAvailableBlockData[]) {
        this._blocksEditorsRemoteLoaderOptionsMap.clear();

        availableBlocks.forEach(data => {
            const relation: NgComponentRelation = data?.relation;
            const addonPublicBaseURL = data?.addonPublicBaseURL;
            
            if (relation && addonPublicBaseURL) {
                const key = this.getRemoteLoaderMapKey(relation);
                this._blocksEditorsRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(relation, addonPublicBaseURL, true));
            }
        });
    }

    private getRemoteLoaderMapKey(relation: NgComponentRelation): string {
        return `${relation.Name}_${relation.AddonUUID}`;
    }

    private changeCursorOnDragStart() {
        document.body.classList.add('inheritCursors');
        document.body.style.cursor = 'grabbing';
    }

    private changeCursorOnDragEnd() {
        document.body.classList.remove('inheritCursors');
        document.body.style.cursor = 'unset';
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/

    getBlocksRemoteLoaderOptions(relation: NgComponentRelation) {
        const key = this.getRemoteLoaderMapKey(relation);
        return this._blocksRemoteLoaderOptionsMap.get(key);
    }

    getBlockHostObject(block: PageBlock): IPageBlockHostObject {
        let hostObject = this.getEditorHostObject(block);
        
        // Add parameters.
        hostObject.parameters = this._consumerParametersMapSubject.value?.get(block.Key) || null;
        
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

                if (editor) {
                    this._editorsBreadCrumb.push(editor);
                    this.changeCurrentEditor();
                    success = true;
                } else {
                    success = false;
                }
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
                    if (colunm.BlockContainer) {
                        blocksIdsToRemove.push(colunm.BlockContainer.BlockKey);
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
            const blocksIds = this._sectionsSubject.value[index].Columns.map(column => column?.BlockContainer?.BlockKey);
            
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

    onSectionDragStart(event: CdkDragStart) {
        this.changeCursorOnDragStart();
        this._draggingSectionKey.next(event.source.data);
    }

    onSectionDragEnd(event: CdkDragEnd) {
        this.changeCursorOnDragEnd();
        this._draggingSectionKey.next('');
    }

    onRemoveBlock(sectionId: string, blockId: string) {
        const index = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = this._sectionsSubject.value[index].Columns.findIndex(column => column.BlockContainer?.BlockKey === blockId);
            if (columnIndex > -1) {
                // Remove the block.
                this.removeBlocks([blockId]);

                // Remove the block from section column.
                delete this._sectionsSubject.value[index].Columns[columnIndex].BlockContainer;
            }
        }
    }

    hideBlock(sectionId: string, blockId: string, hideIn: DataViewScreenSize[]) {
        const index = this._sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = this._sectionsSubject.value[index].Columns.findIndex(column => column.BlockContainer?.BlockKey === blockId);
            if (columnIndex > -1) {
                this._sectionsSubject.value[index].Columns[columnIndex].BlockContainer.Hide = hideIn;
            }
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>, sectionId: string) {
        if (event.previousContainer.id == 'availableBlocks') {
            // Create new block from the relation (previousContainer.data is AvailableBlock object).
            const relation: NgComponentRelation = event.previousContainer.data[event.previousIndex];
            
            let block: PageBlock = {
                Key: PepGuid.newGuid(),
                Relation: relation,
                Configuration: {
                    Resource: relation.Name,
                    AddonUUID: relation.AddonUUID,
                    Data: {}
                },
            }

            // Get the column.
            const currentColumn = this.getSectionColumnById(event.container.id);
            
            // Set the block key in the section block only if there is a blank column.
            if (currentColumn && !currentColumn.BlockContainer) {
                currentColumn.BlockContainer = { 
                    BlockKey: block.Key
                };
                
                // Add the block to the page blocks and navigate to block editor when the block will loaded.
                this.addPageBlock(block, true);
            }
        } else {
            // If the block moved between columns in the same section or between different sections but not in the same column.
            if (event.container.id !== event.previousContainer.id) {
                // Get the column.
                const currentColumn = this.getSectionColumnById(event.container.id);
                // Get the previous column.
                const previuosColumn = this.getSectionColumnById(event.previousContainer.id);

                currentColumn.BlockContainer = previuosColumn.BlockContainer;
                delete previuosColumn.BlockContainer;

                // Raise block progress change to update the subject.
                this.notifyBlockProgressMapChange();
            }
        }
    }
    
    onBlockDragStart(event: CdkDragStart) {
        this.changeCursorOnDragStart();
        // Take the block key if exist, else take the available block key (relation key).
        const blockKey = event.source.data?.BlockKey || event.source.data?.Key;
        this._draggingBlockKey.next(blockKey);
    }

    onBlockDragEnd(event: CdkDragEnd) {
        this.changeCursorOnDragEnd();
        this._draggingBlockKey.next('');
    }

    updateBlockLoaded(blockKey: string) {
        this.setBlockAsLoadedAndCalculateCurrentPriority(blockKey);
    }
    
    updateBlockConfiguration(blockKey: string, configuration: any) {
        const pageBlock = this.pageBlockProgressMap.get(blockKey);
        
        if (pageBlock) {
            pageBlock.block.Configuration.Data = configuration;
            this._pageBlockSubject.next(pageBlock.block);
        }
    }
    
    // Update the block configuration data by the propertiesHierarchy and set the field value (deep set).
    private updateConfigurationDataFieldValue(block: PageBlock, propertiesHierarchy: Array<string>, fieldValue: any) {
        this.setObjectPropertyValueRoot(block, block.Configuration.Data, propertiesHierarchy, fieldValue);
    }

    // Update the block configuration per screen size according the current screen sizes and the saved values (deep set).
    private updateConfigurationPerScreenSizeFieldValue(block: PageBlock, propertiesHierarchy: Array<string>, fieldValue: any, currentScreenType: DataViewScreenSize) {
        if (block.ConfigurationPerScreenSize === undefined) {
            block.ConfigurationPerScreenSize = {};
        }
        
        let objectToUpdate;
        if (currentScreenType === 'Tablet') {
            if (block.ConfigurationPerScreenSize.Tablet === undefined) {
                block.ConfigurationPerScreenSize.Tablet = {};
            }
            
            objectToUpdate = block.ConfigurationPerScreenSize.Tablet;
        } else { // Phablet
            if (block.ConfigurationPerScreenSize.Mobile === undefined) {
                block.ConfigurationPerScreenSize.Mobile = {};
            }
          
            objectToUpdate = block.ConfigurationPerScreenSize.Mobile;
        } 

        // Update the block configuration data by the propertiesHierarchy and set the field value.
        this.setObjectPropertyValueRoot(block, objectToUpdate, propertiesHierarchy, fieldValue);
    }

    private setObjectPropertyValueRoot(block: PageBlock, object: any, propertiesHierarchy: Array<string>, value: any): void {
        if (propertiesHierarchy.length > 0) {
            const propertyName = propertiesHierarchy[0];
            propertiesHierarchy.shift();
            this.setObjectPropertyValue(object, propertiesHierarchy, propertyName, value);
            this._pageBlockSubject.next(block);
        }
    }

    // Set the object field value by propertiesHierarchy (deep set)
    private setObjectPropertyValue(object: any, propertiesHierarchy: Array<string>, propertyName: string, value: any): void {
        if (propertiesHierarchy.length > 0) {
            const propertyName = propertiesHierarchy[0];
            propertiesHierarchy.shift();

            if (!object.hasOwnProperty(propertyName)) {
                object[propertyName] = {};
            } 
            
            this.setObjectPropertyValue(object[propertyName], propertiesHierarchy, propertyName, value);
        } else {
            // If the value is not undefined set the property, else - delete it.
            if (value !== undefined) {
                object[propertyName] = value;
            } else {
                if (object.hasOwnProperty(propertyName)) {
                    delete object[propertyName];
                }
            }
        }
    }

    private searchFieldInSchemaFields(schemaFields: any, propertiesHierarchy: Array<string>): boolean {
        let canConfigurePerScreenSize = false;

        if (propertiesHierarchy.length > 0) {
            const currentFieldKey = propertiesHierarchy[0];
            const schemaField = schemaFields[currentFieldKey];

            if (schemaField) {
                const type = schemaField.Type;
            
                // If it's object
                if (type === 'Object') {
                    // If the field index is the last
                    if (propertiesHierarchy.length === 1) {
                        if (schemaField.ConfigurationPerScreenSize === true) {
                            canConfigurePerScreenSize = true;
                        }
                    } else { // Check in fields.
                        if (schemaField.Fields) {
                            propertiesHierarchy.shift(); // Remove the first element.
                            canConfigurePerScreenSize = this.searchFieldInSchemaFields(schemaField.Fields, propertiesHierarchy);
                        } else {
                            // Do nothing.
                        }
                    }
                } else if (propertiesHierarchy.length === 1) {
                    if (type === 'Resource') {
                        // Do nothing.
                    } else {
                        if (schemaField.ConfigurationPerScreenSize === true) {
                            canConfigurePerScreenSize = true;
                        }
                    }
                }
            }
        }

        return canConfigurePerScreenSize;
    }

    updateBlockConfigurationField(blockKey: string, fieldKey: string, fieldValue: any) {
        const pageBlock = this.pageBlockProgressMap.get(blockKey);
        
        if (pageBlock) {
            const currentScreenType = this.getScreenType(this._screenSizeSubject.value);
            const propertiesHierarchy = fieldKey.split('.');

            // If it's Landscape mode then set the field to the regular (Configuration -> Data -> field hierarchy).
            if (currentScreenType === 'Landscape') {
                // Update confuguration data.
                this.updateConfigurationDataFieldValue(pageBlock.block, propertiesHierarchy, fieldValue);
            } else {
                const schema = pageBlock.block.Relation.Schema;
                let canConfigurePerScreenSize = false;

                if (schema?.Fields) {
                    canConfigurePerScreenSize = this.searchFieldInSchemaFields(schema?.Fields, propertiesHierarchy);
                }

                // Update
                if (canConfigurePerScreenSize) {
                    this.updateConfigurationPerScreenSizeFieldValue(pageBlock.block, propertiesHierarchy, fieldValue, currentScreenType);
                } else {
                    // Update confuguration data.
                    this.updateConfigurationDataFieldValue(pageBlock.block, propertiesHierarchy, fieldValue);
                }
            }
        }
    }
    
    updateBlockPageConfiguration(blockKey: string, pageConfiguration: PageConfiguration) {
        const blockProgress = this.pageBlockProgressMap.get(blockKey);
        
        if (blockProgress) {
            blockProgress.block.PageConfiguration = pageConfiguration;
            this._pageBlockSubject.next(blockProgress.block);

            // Calculate all filters by the updated page configuration.
            this.buildConsumersParameters();
        }
    }
    
    setBlockParameter(blockKey: string, event: { key: string, value: any }) {
        const pageBlock = this.pageBlockProgressMap.get(blockKey);

        // Only if this block parameter is declared as producer.
        if (pageBlock?.block?.PageConfiguration?.Parameters.length > 0) {
            const params = pageBlock?.block?.PageConfiguration?.Parameters.filter(param => param.Key === event.key && param.Produce === true);
        
            // If the key exist in parameters.
            if (params?.length > 0) {
                let canUpdateParameter = true;

                // Check if can raise this filter type parameter (for type 'String' there is no validation).
                if (params[0].Type === 'Filter') {
                    // Get the filters as PageConfigurationParameterFilter
                    const filtersParameters = params as PageConfigurationParameterFilter[];
                    
                    // Check if this producer can raise those filters.
                    const producerFilters = event.value as IProducerFilter[];
                    
                    for (let index = 0; index < producerFilters.length; index++) {
                        const producerFilter = producerFilters[index];
                        canUpdateParameter = this.canProducerRaiseFilter(filtersParameters, producerFilter);
        
                        if (!canUpdateParameter) {
                            // Write error to the console "You cannot raise this filter (not declared)."
                            console.error('One or more from the raised filters are not declared in the block -> pageConfiguration -> parameters array.');
                            break;
                        }
                    }
                }
                
                // Only if can update parameter
                if (canUpdateParameter) {
                    // Create new producerParameters map if key isn't exists.
                    if (!this._producerParameterKeysMap.has(event.key)) {
                        this._producerParameterKeysMap.set(event.key, { producerParametersMap: new Map<string, any>() });
                    }

                    // Set the producer parameter value in _producerParameterKeysMap.
                    this._producerParameterKeysMap.get(event.key).producerParametersMap.set(blockKey, event.value);
                    
                    // Raise the filters change only if this block has loaded AND the currentBlocksPriority is CONSUMERS_PRIORITY (consumers stage)
                    // because in case that the block isn't loaded we will raise the event once when all the blocks are ready.
                    if (pageBlock.loaded && this.currentBlocksPriority === this.CONSUMERS_PRIORITY) {
                        this.buildConsumersParameters();
                    }
                }
            }
        }
    }

    doesColumnContainBlock(sectionId: string, columnIndex: number): boolean {
        let res = false;
        const section = this._sectionsSubject.value.find(section => section.Key === sectionId);

        if (section && columnIndex >= 0 && section.Columns.length > columnIndex) {
            res = !!section.Columns[columnIndex].BlockContainer;
        }

        return res;
    }

    setScreenWidth(value: string) {
        let width = this.pepUtilitiesService.coerceNumberProperty(value, 0);
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
    
    /**************************************************************************************/
    /*                            CPI & Server side calls.
    /**************************************************************************************/
    
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
            this.httpService.getHttpCall(`${baseUrl}/get_page_data?key=${pageKey}`)
                .subscribe((res: IPageBuilderData) => {
                    if (res && res.page && res.availableBlocks) {
                        // Load the blocks remote loader options.
                        this.loadBlocksRemoteLoaderOptionsMap(res.availableBlocks);

                        // Load the page.
                        this.pageSubject.next(res.page);
                    }
            });
        } else { // If is't edit mode get the data of the page and the relations from the Server side.
            // Get the page (sections and the blocks data) from the server.
            this.httpService.getHttpCall(`${baseUrl}/get_page_builder_data?key=${pageKey}`)
                .subscribe((res: IPageBuilderData) => {
                    if (res && res.page && res.availableBlocks) {
                        // Load the available blocks.
                        const availableBlocks: NgComponentRelation[] = [];
                        
                        res.availableBlocks.forEach(data => {
                            availableBlocks.push(data?.relation);
                        });

                        this._availableBlocksSubject.next(availableBlocks);

                        // Load the blocks remote loader options.
                        this.loadBlocksRemoteLoaderOptionsMap(res.availableBlocks);
                        
                        // Load the blocks editors remote loader options.
                        this.loadBlocksEditorsRemoteLoaderOptionsMap(res.availableBlocks);

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
        return this.httpService.postHttpCall(`${baseUrl}/save_draft_page`, body);
    }

    // Publish the current page.
    publishCurrentPage(addonUUID: string): Observable<Page> {
        const page: Page = this.pageSubject.value;
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.postHttpCall(`${baseUrl}/publish_page`, body);
    }
}
