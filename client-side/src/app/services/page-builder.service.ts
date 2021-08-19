import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepScreenSizeType, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
import { PepRemoteLoaderOptions } from "@pepperi-addons/ngx-remote-loader";
import { InstalledAddon, Page, PageBlock, NgComponentRelation, PageSection, PageSizeType, SplitType } from "@pepperi-addons/papi-sdk";
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter } from 'rxjs/operators';

export type EditorType = 'page-builder' | 'section' | 'block';

export interface Editor {
    id: string,
    title: string,
    type: EditorType,
    remoteModuleOptions?: PepRemoteLoaderOptions,
    hostObject?: any
}

export interface PageEditor {
    id: string,
    pageName: string,
    pageDescription: string,
    maxWidth: number,
    columnsHorizntalGap?: PageSizeType,
    columnsVerticalGap?: PageSizeType,
    sectionsGap: PageSizeType,
    roundedCorners?: PageSizeType,
}

export interface SectionEditor {
    id: string,
    sectionName: string,
    split: SplitType,
    height: number,
}

export interface BlockEditor {
    id: string,
    configuration?: any,
}

export interface AvailableBlock {
    options: PepRemoteLoaderOptions,
    relation: NgComponentRelation
}

@Injectable({
    providedIn: 'root',
})
export class PageBuilderService {
    private editorsBreadCrumb = Array<Editor>();

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
    private editorSubject: BehaviorSubject<Editor> = new BehaviorSubject<Editor>(null);
    get onEditorChange$(): Observable<Editor> {
        return this.editorSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load available blocks on the main editor (Usage only in edit mode).
    private availableBlocksSubject: BehaviorSubject<AvailableBlock[]> = new BehaviorSubject<AvailableBlock[]>([]);
    get availableBlocksLoadedSubject$(): Observable<AvailableBlock[]> {
        return this.availableBlocksSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This is the sections subject (a pare from the page object)
    private sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get onSectionsChange$(): Observable<PageSection[]> {
        return this.sectionsSubject.asObservable().pipe(distinctUntilChanged());
    }
    
    private blocksSubject: BehaviorSubject<PageBlock[]> = new BehaviorSubject<PageBlock[]>([]);
    get onBlocksChange$(): Observable<PageBlock[]> {
        return this.blocksSubject.asObservable().pipe(distinctUntilChanged());
    }



    private _pageBlocksMap = new Map<string, PageBlock>();
    get pageBlockMap(): ReadonlyMap<string, PageBlock> {
        return this._pageBlocksMap;
    }
    
    private _pageBlockProgress$ = new BehaviorSubject<ReadonlyMap<string, PageBlock>>(this.pageBlockMap);
    get pageBlockProgress$(): Observable<ReadonlyMap<string, PageBlock>> {
        return this._pageBlockProgress$.asObservable();
    }



    private pageSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
    get pageDataChange$(): Observable<Page> {
        return this.pageSubject.asObservable().pipe(filter(page => !!page));
    }
    get pageLoad$(): Observable<Page> {
        return this.pageSubject.asObservable().pipe(filter(page => !!page), distinctUntilKeyChanged("Key"));
    }

    constructor(
        private utilitiesService: PepUtilitiesService,
        private translate: TranslateService,
        private http: PepHttpService,
    ) {
        this.pageLoad$.subscribe((page: Page) => {
            this.loadDefaultEditor(page);
            this.loadSections(page);
            this.loadBlocks(page);
        });

        // this.pageDataChange$.subscribe((page: Page) => {
        //     this.updatePageDependencies(page);
        // });
    }

    // private updatePageDependencies(page: Page) {
    // }

    private loadDefaultEditor(page: Page) {
        this.editorsBreadCrumb = new Array<Editor>();
        const pageEditor: PageEditor = {
            id: page?.Key,
            pageName: page?.Name,
            pageDescription: page?.Description,
            maxWidth: page?.Layout.MaxWidth,
            // blocksHorizntalGap: page?.Layout.
            // blocksVerticalGap: page?.Layout.
            sectionsGap: page?.Layout.SectionsGap,
            // roundedCorners: page?.Layout.
        };

        this.editorsBreadCrumb.push({
            id: 'main',
            type : 'page-builder',
            title: page?.Name,
            hostObject: pageEditor
        });

        this.editorSubject.next(this.editorsBreadCrumb[0]);
    }

    private loadSections(page: Page) {
        this.sectionsSubject.next(page?.Layout.Sections ?? []);
    }

    private loadBlocks(page: Page) {
        if (page) {
            this.blocksSubject.next(page.Blocks);

            // TODO:
            // page.Blocks.forEach(pageBlock => {
            //     this.pageBlockMap[pageBlock.Key] = pageBlock;
            // });
        }
    }

    private changeCurrentEditor() {
        if (this.editorsBreadCrumb.length > 0) {
            this.editorSubject.next(this.editorsBreadCrumb[this.editorsBreadCrumb.length - 1]);
        }
    }

    private createNewSection(): PageSection {
        const section: PageSection = {
            Key: PepGuid.newGuid(),
            Columns: [{}], // Add empty section column
            Hide: []
        }

        return section;
    }

    private getEditorFromPage(editorType: EditorType, id: string): Editor {
        // TODO: Build editor object from the page.
        let editor: Editor = null;

        if (editorType === 'section') {
            editor = this.getSectionEditor(id);
        } else if (editorType === 'block') {
            editor = this.getBlockEditor(id);
        }

        return editor;
    }

    private getBlockEditor(blockId: string): Editor {
        // Get the current block.
        let block: PageBlock = this.pageSubject?.value?.Blocks.find(block => blockId);
        
        if (block) {
            // Change the RemoteLoaderOptions of the block for loading the block editor.
            let editorRelationOptions: PepRemoteLoaderOptions = JSON.parse(JSON.stringify(block.Relation.Options));
            editorRelationOptions.exposedModule = block.Relation.EditorModuleName;
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

    private getSectionEditor(sectionId: string): Editor {
        // Get the current block.
        const sectionIndex = this.pageSubject?.value?.Layout.Sections.findIndex(section => sectionId);
        
        if (sectionIndex >= 0) {
            let section: PageSection = this.pageSubject?.value?.Layout.Sections[sectionIndex];
            const sectionEditor: SectionEditor = {
                id: section.Key,
                sectionName: section.Name || '',
                split: section.Split || undefined,
                height: section.Height || 0,
            }

            return {
                id: sectionId,
                type: 'section',
                title: section.Name || `${this.translate.instant('Section')} ${sectionIndex + 1}`,
                hostObject: sectionEditor
            }
        } else {
            return null;
        }
    }

    private getRemoteEntryByType(relation: NgComponentRelation, entryAddon, remoteName = 'remoteEntry') {
        switch (relation.Type){
            case "NgComponent":
                // TODO: Hack for localhost please comment.
                if (relation?.ComponentName == 'SlideshowComponent'){
                    const res = 'http://localhost:4401/slideshow.js';
                    return res;
                } else if (relation?.ComponentName == 'SubAddon2Component'){
                    const res = 'http://localhost:4402/sub_addon_2.js';
                    return res;
                } else if (relation?.ComponentName == 'SubAddon3Component'){
                    const res = 'http://localhost:4403/sub_addon_3.js';
                    return res;
                } else if (relation?.ComponentName == 'SubAddon4Component'){
                    const res = 'http://localhost:4404/sub_addon_4.js';
                    return res;
                } else if (relation?.ComponentName == 'SubAddon5Component'){
                    const res = 'http://localhost:4405/sub_addon_5.js';
                    return res;
                } else
                // END OF HACK 
                    return entryAddon?.PublicBaseURL +  remoteName + '.js';
            default:
                return relation?.AddonRelativeURL;
        }
    }

    private getRemoteLoaderOptions() {

    }

    initPageBuilder(pageKey: string): void {
        // TODO: Load the saved page from the session for now.
        const savedPage: Page = JSON.parse(sessionStorage.getItem('page')) ?? null;

        if (savedPage) {
            this.pageSubject.next(savedPage);
        } else {
            // TODO: Get the sections and the blocks data from the server.
            this.http.getHttpCall(`http://localhost:4500/api/pages?pageKey=${pageKey}`)
            // this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/pages?pageKey=${pageKey}`)
                .subscribe(res => {
                this.pageSubject.next(res['page']);
            });
        }
    }

    initPageEditor(addonUUID: string, pageType: string): void {
        // debug locally
        if (!this.availableBlocksSubject.value || this.availableBlocksSubject.value.length === 0) {
            this.http.postHttpCall('http://localhost:4500/api/init_page_editor', { PageType: pageType})
            // this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/init_page_editor`, { PageType: pageType})
                .subscribe((res: { relation: NgComponentRelation, addon: InstalledAddon }[]) => {
                    const availableBlocks: AvailableBlock[] = [];
                    res.forEach(data => {
                        const relation: NgComponentRelation = data?.relation;
                        const addon: InstalledAddon = data?.addon;
                        
                        if (relation && addon) {
                            availableBlocks.push({
                                relation: relation,
                                options: {
                                    addonId: relation?.AddonUUID,
                                    remoteEntry: this.getRemoteEntryByType(relation, addon, relation.AddonRelativeURL),
                                    remoteName: relation.AddonRelativeURL,
                                    exposedModule: './' + relation?.ModuleName,
                                    componentName: relation?.ComponentName,
                                }
                            });
                        }
                    });
                        
                    this.availableBlocksSubject.next(availableBlocks);
            });
        }
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

                let editor = this.getEditorFromPage(editorType, id);
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
            this.clearActiveSection();
            const lastEditor = this.editorsBreadCrumb.pop();
            this.changeCurrentEditor();
        }
    }

    clearActiveSection() {
        var lastActiveSection = document.getElementsByClassName("active-section");
        if(lastActiveSection.length){
            lastActiveSection[0].classList.remove("active-section");
        }
    }

    clearSections() {
        this.pageSubject.value.Layout.Sections = [];
        this.sectionsSubject.next(this.pageSubject.value.Layout.Sections);
        // this.pageSubject.next(this.pageSubject.value);
        

        // TODO: clear all blocks?
    }

    addSection(section: PageSection = null) {
        // Create new section
        if (!section) {
            section = this.createNewSection();
        }
        
        // Add the new section to page layout.
        this.pageSubject.value.Layout.Sections.push(section);
        this.sectionsSubject.next(this.pageSubject.value.Layout.Sections);
        // this.pageSubject.next(this.pageSubject.value);
    }

    removeSection(sectionId: string) {
        const index = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
        if (index > -1) {
            // First remove all blocks.
            this.sectionsSubject.value[index].Columns.forEach(column => {
                if (column.Block) {
                    this.removeBlock(column.Block.BlockKey);
                }
            });

            // Remove section.
            this.sectionsSubject.value.splice(index, 1);
        }
    }

    updatePageFromEditor(pageData: PageEditor) {
        const currentPage = this.pageSubject.value;

        if (currentPage) {
            currentPage.Name = pageData.pageName;
            currentPage.Description = pageData.pageDescription;
            currentPage.Layout.MaxWidth = pageData.maxWidth;
            // currentPage.Layout.ColumnsHorizntalGap = pageData.columnsHorizntalGap;
            // currentPage.Layout.ColumnsVerticalGap = pageData.columnsVerticalGap;
            currentPage.Layout.SectionsGap = pageData.sectionsGap;
            // currentPage.Layout.RoundedCorners = pageData.roundedCorners;

            this.pageSubject.next(currentPage);
        }
    }

    updateSectionFromEditor(sectionData: SectionEditor) {
        const currentSection = this.sectionsSubject.value.find(section => section.Key === sectionData.id);

        if (currentSection) {
            currentSection.Name = sectionData.sectionName;
            currentSection.Split = sectionData.split;
            currentSection.Height = sectionData.height;
        }
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        moveItemInArray(this.sectionsSubject.value, event.previousIndex, event.currentIndex);
    }

    removeBlock(blockId: string) {
        const blockIndex = this.blocksSubject.value.findIndex(block => block.Key === blockId);

        if (blockIndex >= 0) {
            this.blocksSubject.value.splice(blockIndex, 1);
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>, sectionId: string) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else if (event.previousContainer.id == 'availableBlocks') {
            // Create new block from the relation (previousContainer.data is AvailableBlock object).
            const relation = event.previousContainer.data[event.previousIndex].relation;
            relation["Options"] = event.previousContainer.data[event.previousIndex].options;
            
            let block: PageBlock = {
                Key: PepGuid.newGuid(),
                Relation: relation
            }

            // Set the block key in the section block
            const sectionIndex = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);

            // If there is a blank column.
            const currentColumn = this.sectionsSubject.value[sectionIndex].Columns[event.currentIndex];
            if (currentColumn && !currentColumn.Block) {
                this.sectionsSubject.value[sectionIndex].Columns[event.currentIndex].Block = { 
                    BlockKey: block.Key
                };
                
                // Add the block to the page blocks
                this.pageSubject.value.Blocks.push(block);
                this.blocksSubject.next(this.pageSubject.value.Blocks);
                // this.pageSubject.next(this.pageSubject.value);
                
                // copyArrayItem(event.previousContainer.data, this.sectionsSubject.value[sectionIndex].Columns, event.previousIndex, event.currentIndex);
            }
        } else {
            // TODO: Move the Block Key in the section columns array.
            const sectionIndex = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
            transferArrayItem(event.previousContainer.data, this.sectionsSubject.value[sectionIndex].Columns, event.previousIndex, event.currentIndex);
        }
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

    publishPage() {
        // TODO: Implement this.
        sessionStorage.setItem('page', JSON.stringify(this.pageSubject.value));
    }
}
