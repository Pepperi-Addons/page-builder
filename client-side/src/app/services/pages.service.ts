import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepScreenSizeType, PepSessionService, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
import { PepRemoteLoaderOptions } from "@pepperi-addons/ngx-remote-loader";
import { InstalledAddon, Page, PageBlock, NgComponentRelation, PageSection, PageSizeType, SplitType, PageSectionColumn, DataViewScreenSize } from "@pepperi-addons/papi-sdk";
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter } from 'rxjs/operators';
import { NavigationService } from "./navigation.service";

// export type ScreenType = 'desktop' | 'tablet' | 'mobile';

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
    load: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class PagesService {
    private editorsBreadCrumb = Array<IEditor>();

    // This subject is for the screen size change events.
    private screenSizeSubject: BehaviorSubject<PepScreenSizeType> = new BehaviorSubject<PepScreenSizeType>(PepScreenSizeType.XL);
    get onScreenSizeChange$(): Observable<PepScreenSizeType> {
        return this.screenSizeSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for demostrate the container size (Usage only in edit mode).
    private screenWidthSubject: BehaviorSubject<string> = new BehaviorSubject<string>('100%');
    get onScreenWidthChange$(): Observable<string> {
        return this.screenWidthSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load the current editor (Usage only in edit mode).
    private editorSubject: BehaviorSubject<IEditor> = new BehaviorSubject<IEditor>(null);
    get onEditorChange$(): Observable<IEditor> {
        return this.editorSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load available blocks on the main editor (Usage only in edit mode).
    private availableBlocksSubject: BehaviorSubject<IAvailableBlock[]> = new BehaviorSubject<IAvailableBlock[]>([]);
    get availableBlocksLoadedSubject$(): Observable<IAvailableBlock[]> {
        return this.availableBlocksSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This is the sections subject (a pare from the page object)
    private sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get onSectionsChange$(): Observable<PageSection[]> {
        return this.sectionsSubject.asObservable();
    }
    
    private _pageBlockProgressMap = new Map<string, IBlockProgress>();
    get pageBlockProgressMap(): ReadonlyMap<string, IBlockProgress> {
        return this._pageBlockProgressMap;
    }
    private _pageBlockProgress$ = new BehaviorSubject<ReadonlyMap<string, IBlockProgress>>(this.pageBlockProgressMap);
    get pageBlockProgress$(): Observable<ReadonlyMap<string, IBlockProgress>> {
        return this._pageBlockProgress$.asObservable();
    }

    private pageSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
    get pageLoad$(): Observable<Page> {
        // return this.pageSubject.asObservable().pipe(filter(page => !!page), distinctUntilKeyChanged("Key"));
        return this.pageSubject.asObservable().pipe(distinctUntilChanged((prevPage, nextPage) => prevPage?.Key === nextPage?.Key));
    }
    get pageDataChange$(): Observable<Page> {
        return this.pageSubject.asObservable().pipe(filter(page => !!page));
    }

    constructor(
        private utilitiesService: PepUtilitiesService,
        private translate: TranslateService,
        private sessionService: PepSessionService,
        private httpService: PepHttpService,
        private navigationService: NavigationService
    ) {
        this.pageLoad$.subscribe((page: Page) => {
            this.loadDefaultEditor(page);
            this.loadSections(page);
        });

        // this.pageDataChange$.subscribe((page: Page) => {
        // });
    }

    private loadSections(page: Page) {
        this.sectionsSubject.next(page?.Layout.Sections ?? []);
        this.loadBlocks(page);
    }

    private loadBlocks(page: Page) {
        if (page) {
            // TODO: Write some logic to load the blocks by priority.
            if (page.Blocks) {
                page.Blocks.forEach(block => {
                    this.addBlockProgress(block, false);
                });
                
                this.notifyBlockProgressMapChange();
            }
        } else {
            this.removeAllBlocks();
        }
    }
    
    private addBlockProgress(block: PageBlock, notify = true) {
        // Create block progress and add it to the map.
        const initialProgress: IBlockProgress = { block, load: false };
        this._pageBlockProgressMap.set(block.Key, initialProgress);

        if (notify) {
            this.notifyBlockProgressMapChange();
        }
    }

    private addPageBlock(block: PageBlock) {
        // Add the block to the page blocks.
        this.pageSubject.value.Blocks.push(block);

        // Add the block progress.
        this.addBlockProgress(block);
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
    
    // TODO:
    // private updateBlockLoaded(blockKey: string, isLoad: boolean) {
    //     this._pageBlockProgressMap.get(blockKey).load = isLoad;
    //     this.notifyBlockProgressMapChange();
    // }
    
    private notifyBlockProgressMapChange() {
        this._pageBlockProgress$.next(this.pageBlockProgressMap);
    }

    private loadDefaultEditor(page: Page) {
        this.editorsBreadCrumb = new Array<IEditor>();

        if (page) {
            const pageEditor: IPageEditor = {
                id: page?.Key,
                pageName: page?.Name,
                pageDescription: page?.Description,
                maxWidth: page?.Layout.MaxWidth,
                // blocksHorizntalGap: page?.Layout.
                // blocksVerticalGap: page?.Layout.
                sectionsGap: page?.Layout.SectionsGap,
                // columnsGap: page?.Layout.ColumnsGap,
                // roundedCorners: page?.Layout.
            };

            this.editorsBreadCrumb.push({
                id: 'main',
                type : 'page-builder',
                title: page?.Name,
                hostObject: pageEditor
            });

            this.editorSubject.next(this.editorsBreadCrumb[0]);
        } else {
            this.editorSubject.next(null);
        }
    }

    private changeCurrentEditor() {
        if (this.editorsBreadCrumb.length > 0) {
            this.editorSubject.next(this.editorsBreadCrumb[this.editorsBreadCrumb.length - 1]);
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

    private getBlockEditor(blockId: string): IEditor {
        // Get the current block.
        let block: PageBlock = this.pageSubject?.value?.Blocks.find(block => block.Key === blockId);
        
        if (block) {
            // Change the RemoteLoaderOptions of the block for loading the block editor.
            let editorRelationOptions: PepRemoteLoaderOptions = JSON.parse(JSON.stringify(block.Relation.Options));
            editorRelationOptions.exposedModule = './' + block.Relation.EditorModuleName;
            editorRelationOptions.componentName = block.Relation.EditorComponentName;

            return {
                id: blockId,
                type: 'block',
                title: block.Relation.Description,
                remoteModuleOptions: editorRelationOptions,
                hostObject: block.Configuration
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
        const sectionIndex = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
        
        if (sectionIndex >= 0) {
            let section = this.sectionsSubject.value[sectionIndex];
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
            const sectionIndex = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
            // Get the column index.
            const columnIndex = sectionColumnArr[1];
            currentColumn = this.sectionsSubject.value[sectionIndex].Columns[columnIndex];
        } 
        
        return currentColumn;
    }

    private getRemoteEntryByType(relation: NgComponentRelation, entryAddon, remoteName = 'remoteEntry') {
        switch (relation.Type){
            case "NgComponent":
                // For devBlocks gets the remote entry from the query params.
                const devBlocks = this.navigationService.devBlocks;
                if(devBlocks.size > 1) {
                    if (devBlocks.has(relation?.ComponentName)) {
                        return devBlocks.get(relation?.ComponentName);
                    }
                } else {
                    return entryAddon?.PublicBaseURL + remoteName + '.js';
                }
            default:
                return relation?.AddonRelativeURL;
        }
    }

    private getRemoteLoaderOptions(relation: NgComponentRelation, addon: InstalledAddon) {
        return {
            addonId: relation?.AddonUUID,
            remoteEntry: this.getRemoteEntryByType(relation, addon, relation.AddonRelativeURL),
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
            const currentEditor = this.editorsBreadCrumb[this.editorsBreadCrumb.length - 1];

            // Only if it's another editor.
            if(currentEditor.id !== id) {
                if (currentEditor.type !== 'page-builder') {
                    // Always pop the last and insert the current.
                    this.editorsBreadCrumb.pop();
                }

                let editor = this.getEditor(editorType, id);
                this.editorsBreadCrumb.push(editor);
                this.changeCurrentEditor();
                success = true;
            }
        }
        
        return success;
    }

    navigateBackFromEditor() {
        // Keep the page builder editor.
        if (this.editorsBreadCrumb.length > 1) {
            // Maybe we want to compare the last editor for validation ?
            const lastEditor = this.editorsBreadCrumb.pop();
            this.changeCurrentEditor();
        }
    }

    updatePageFromEditor(pageData: IPageEditor) {
        const currentPage = this.pageSubject.value;

        if (currentPage) {
            currentPage.Name = pageData.pageName;
            currentPage.Description = pageData.pageDescription;
            currentPage.Layout.MaxWidth = pageData.maxWidth;
            // currentPage.Layout.HorizontalSpacing = pageData.horizontalSpacing;
            // currentPage.Layout.VerticalSpacing = pageData.verticalSpacing;
            currentPage.Layout.SectionsGap = pageData.sectionsGap;
            // currentPage.Layout.ColumnsGap = pageData.columnsGap;
            // currentPage.Layout.RoundedCorners = pageData.roundedCorners;

            this.pageSubject.next(currentPage);
        }
    }

    updateSectionFromEditor(sectionData: ISectionEditor) {
        const sectionIndex = this.sectionsSubject.value.findIndex(section => section.Key === sectionData.id);
        
        // Update section details.
        if (sectionIndex >= 0) {
            const currentSection = this.sectionsSubject.value[sectionIndex];
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
            const currentEditor = this.editorSubject.value;
            if (currentEditor.type === 'section' && currentEditor.id === currentSection.Key) {
                currentEditor.title = this.getSectionEditorTitle(currentSection, sectionIndex);
            }
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
        this.sectionsSubject.next(this.pageSubject.value.Layout.Sections);
    }

    removeSection(sectionId: string) {
        const index = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            // Get the blocks id's to remove.
            const blocksIds = this.sectionsSubject.value[index].Columns.map(column => column?.Block?.BlockKey);
            
            // Remove the blocks by ids.
            this.removeBlocks(blocksIds)

            // Remove section.
            this.sectionsSubject.value.splice(index, 1);
        }
    }

    hideSection(sectionId: string, hideIn: DataViewScreenSize[]) {
        const index = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            this.sectionsSubject.value[index].Hide = hideIn;
        }
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        moveItemInArray(this.sectionsSubject.value, event.previousIndex, event.currentIndex);
    }

    onRemoveBlock(sectionId: string, blockId: string) {
        const index = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = this.sectionsSubject.value[index].Columns.findIndex(column => column.Block?.BlockKey === blockId);
            if (columnIndex > -1) {
                // Remove the block.
                this.removeBlocks([blockId]);

                // Remove the block from section column.
                delete this.sectionsSubject.value[index].Columns[columnIndex].Block;
            }
        }
    }

    hideBlock(sectionId: string, blockId: string, hideIn: DataViewScreenSize[]) {
        const index = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            const columnIndex = this.sectionsSubject.value[index].Columns.findIndex(column => column.Block?.BlockKey === blockId);
            if (columnIndex > -1) {
                this.sectionsSubject.value[index].Columns[columnIndex].Block.Hide = hideIn;
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
                
                // Add the block to the page blocks
                this.addPageBlock(block);
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
        const section = this.sectionsSubject.value.find(section => section.Key === sectionId);

        if (section && columnIndex >= 0 && section.Columns.length > columnIndex) {
            res = !!section.Columns[columnIndex].Block;
        }

        return res;
    }

    setScreenWidth(value: string) {
        let width = this.utilitiesService.coerceNumberProperty(value, 0);
        if (width === 0) {
            this.screenWidthSubject.next('100%');
            this.screenSizeSubject.next(PepScreenSizeType.XL);
        } else {
            this.screenWidthSubject.next(`${width}px`);

            // Change the size according the width.
            if (width >= 1920) {
                this.screenSizeSubject.next(PepScreenSizeType.XL);
            } else if (width >= 1280 && width < 1920) {
                this.screenSizeSubject.next(PepScreenSizeType.LG);
            } else if (width >= 960 && width < 1280) {
                this.screenSizeSubject.next(PepScreenSizeType.MD);
            } else if (width >= 600 && width < 960) {
                this.screenSizeSubject.next(PepScreenSizeType.SM);
            } else if (width < 600) {
                this.screenSizeSubject.next(PepScreenSizeType.XS);
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
        return this.httpService.getHttpCall(`${baseUrl}/pages?${options}`);
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

    loadPageBuilder(addonUUID: string, pageKey: string, editMode: boolean): void {
        //  If is't not edit mode get the page from the CPI side.
        if (!editMode) {
            // TODO: Get from CPI side.
            
        } else { // If is't edit mode get the data of the page and the relations from the Server side.
            const baseUrl = this.getBaseUrl(addonUUID);
            // Get the page (sections and the blocks data) from the server.
            this.httpService.getHttpCall(`${baseUrl}/get_page_builder_data?key=${pageKey}`)
                .subscribe((res: IPageBuilderDataForEditMode) => {
                    if (res && res.page && res.availableBlocks) {
                        // Load the page.
                        this.pageSubject.next(res.page);

                        // Load the available blocks.
                        const availableBlocks: IAvailableBlock[] = [];
                        res.availableBlocks.forEach(data => {
                            const relation: NgComponentRelation = data?.relation;
                            const addon: InstalledAddon = data?.addon;
                            
                            if (relation && addon) {
                                availableBlocks.push({
                                    relation: relation,
                                    options: this.getRemoteLoaderOptions(relation, addon)
                                });
                            }
                        });
                            
                        this.availableBlocksSubject.next(availableBlocks);
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
        return this.httpService.postHttpCall(`${baseUrl}/pages`, body);
    }

    // Publish the current page.
    publishCurrentPage(addonUUID: string): Observable<Page> {
        const page: Page = this.pageSubject.value;
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.postHttpCall(`${baseUrl}/publish_page`, body);
    }
}
