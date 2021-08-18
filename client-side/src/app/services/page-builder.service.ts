import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepScreenSizeType, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
import { PepRemoteLoaderOptions } from "@pepperi-addons/ngx-remote-loader";
import { InstalledAddon, Page, PageBlock, PageRelation, PageSection, PageSectionColumn } from "@pepperi-addons/papi-sdk";
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export type EditorType = 'page-builder' | 'section' | 'block';

export interface Editor {
    id: string,
    title: string,
    type: EditorType,
    // editorData: any,
    remoteModuleOptions?: PepRemoteLoaderOptions,
    hostObject?: any
}

// export interface Section {
//     id: string,
//     name: string,
//     split: string;
//     blocks: Array<any>,
// }
export interface AvailableBlock {
    options: PepRemoteLoaderOptions,
    relation: PageRelation
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

    // TODO:
    private screenMaxWidthSubject: BehaviorSubject<string> = new BehaviorSubject<string>('unset');
    get onScreenMaxWidthChange$(): Observable<string> {
        return this.screenMaxWidthSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for demostrate the container size (Usage only in edit mode).
    private screenWidthSubject: BehaviorSubject<string> = new BehaviorSubject<string>('100%');
    get onScreenWidthChange$(): Observable<string> {
        return this.screenWidthSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load the current editor (Usage only in edit mode).
    private editorChangeSubject: BehaviorSubject<Editor>;
    get onEditorChange$(): Observable<Editor> {
        return this.editorChangeSubject.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load available blocks on the main editor (Usage only in edit mode).
    private availableBlocksSubject: BehaviorSubject<AvailableBlock[]> = new BehaviorSubject<AvailableBlock[]>([]);
    get availableBlocksLoadedSubject$(): Observable<AvailableBlock[]> {
        return this.availableBlocksSubject.asObservable();
    }

    // This is the sections subject (a pare from the page object)
    private sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get sectionsSubject$(): Observable<PageSection[]> {
        return this.sectionsSubject.asObservable();
    }
    
    private blocksChangeSubject: BehaviorSubject<PageBlock[]> = new BehaviorSubject<PageBlock[]>([]);
    get blocksChangeSubject$(): Observable<PageBlock[]> {
        return this.blocksChangeSubject.asObservable();
    }

    private pageChangeSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
    get pageChangeSubject$(): Observable<Page> {
        return this.pageChangeSubject.asObservable();
    }

    constructor(
        private utilitiesService: PepUtilitiesService,
        private translate: TranslateService,
        private http: PepHttpService,
    ) {
        this.pageChangeSubject$.subscribe((page: Page) => {
            this.loadDefaultEditor(page);
            this.buildSections(page);
        });
    }

    private loadDefaultEditor(page: Page) {
        this.editorsBreadCrumb = new Array<Editor>();
        this.editorsBreadCrumb.push({
            type : 'page-builder',
            id: 'main',
            title: page?.Name,
            hostObject: {
                pageName: page?.Name,
                pageDescription: page?.Description
            }
        });

        this.editorChangeSubject = new BehaviorSubject<Editor>(this.editorsBreadCrumb[0]);
    }

    private buildSections(page: Page) {
        // const savedSections: Section[] = JSON.parse(sessionStorage.getItem('sections')) ?? [];
        // this.sectionsSubject.next(savedSections);
        if (page && page.Layout) {
            this.sectionsSubject.next(page.Layout.Sections);
        } else {
            this.sectionsSubject.next([]);
        }
    }

    private changeCurrentEditor() {
        if (this.editorsBreadCrumb.length > 0) {
            this.editorChangeSubject.next(this.editorsBreadCrumb[this.editorsBreadCrumb.length - 1]);
        }
    }

    private createNewSection(): PageSection {
        const sectionsLength = this.sectionsSubject.value.length;
        //`${this.translate.instant('Section')} ${sectionsLength}`

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
        let block: PageBlock = this.pageChangeSubject.value.Blocks.find(block => blockId);
        
        if (block) {
            // Change the RemoteLoaderOptions of the block for loading the block editor.
            let editorRelationOptions: PepRemoteLoaderOptions = JSON.parse(JSON.stringify(block.Relation.Options));
            editorRelationOptions.exposedModule = block.Relation.EditorModuleName;
            editorRelationOptions.componentName = block.Relation.EditorComponentName;

            return {
                type: 'block',
                id: blockId,
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
        let section: PageSection = this.pageChangeSubject.value.Layout.Sections.find(section => sectionId);
        
        if (section) {
            return {
                type: 'section',
                id: sectionId,
                title: section.Name,
                hostObject: {
                    sectionName: section.Name,
                    split: section.Split,
                    height: section.Height,
                }
            }
        } else {
            return null;
        }
    }

    private getRemoteEntryByType(pbRelation: PageRelation, entryAddon, remoteName = 'remoteEntry') {
        switch (pbRelation.Type){
            case "NgComponent":
                // // HACK FOR LOCALHOST PLEASE REMOVE
                if (pbRelation?.ComponentName == 'SlideshowComponent'){
                    const res = 'http://localhost:4401/slideshow.js';
                    return res;
                }
                // if (field?.ComponentName == 'SubAddon2Component'){
                //     const res = 'http://localhost:4402/sub_addon_2.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon3Component'){
                //     const res = 'http://localhost:4403/sub_addon_3.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon4Component'){
                //     const res = 'http://localhost:4404/sub_addon_4.js';
                //     return res;
                // }
                // if (field?.ComponentName == 'SubAddon5Component'){
                //     const res = 'http://localhost:4405/sub_addon_5.js';
                //     return res;
                // }
                else
                // // END OF HACK 
                    return entryAddon?.PublicBaseURL +  remoteName + '.js';
            default:
                return pbRelation?.AddonRelativeURL;
        }
    }

    private getRemoteLoaderOptions() {

    }

    initPageBuilder(): void {
        // TODO: Get the sections and the blocks data from the server.
        let pageName = '1';
        this.http.getHttpCall(`http://localhost:4500/api/pages?pageName=${pageName}`)
        // this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/pages?pageName=${pageName}`)
            .subscribe(res => {
            this.pageChangeSubject.next(res['page']);
        });
    }

    initPageEditor(addonUUID: string): void {
        // debug locally
        if (!this.availableBlocksSubject.value || this.availableBlocksSubject.value.length === 0) {
            this.http.postHttpCall('http://localhost:4500/api/init_page_editor', { PageType: ''})
            // this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/init_page_editor`, {})
                .subscribe((res: { relation: PageRelation, addon: InstalledAddon }[]) => {
                    const availableBlocks: AvailableBlock[] = [];
                    res.forEach(data => {
                        const relation: PageRelation = data?.relation;
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
        this.sectionsSubject.next([]);
    }

    addSection(section: PageSection = null) {
        // Create new section
        if (!section) {
            section = this.createNewSection();
        }
        
        // Add it to the sections subject.
        const sections = [...this.sectionsSubject.value, section];
        this.sectionsSubject.next(sections);
        
        // Add new Column in page layout that represent the new section.
        this.pageChangeSubject.value.Layout.Sections = sections;
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

    onSectionDropped(event: CdkDragDrop<any[]>) {
        moveItemInArray(this.sectionsSubject.value, event.previousIndex, event.currentIndex);
    }

    removeBlock(blockId: string) {
        const blockIndex = this.blocksChangeSubject.value.findIndex(block => block.Key === blockId);

        if (blockIndex >= 0) {
            this.blocksChangeSubject.value.splice(blockIndex, 1);
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
            this.sectionsSubject.value[sectionIndex].Columns[event.currentIndex].Block = { 
                BlockKey: block.Key
            };
            
            // Add the block to the page blocks
            this.pageChangeSubject.value.Blocks.push(block);
            this.blocksChangeSubject.next(this.pageChangeSubject.value.Blocks);

            // copyArrayItem(event.previousContainer.data, this.sectionsSubject.value[sectionIndex].Columns, event.previousIndex, event.currentIndex);
        } else {
            // TODO: Move the Block Key in the section columns array.
            const sectionIndex = this.sectionsSubject.value.findIndex(section => section.Key === sectionId);
            transferArrayItem(event.previousContainer.data, this.sectionsSubject.value[sectionIndex].Columns, event.previousIndex, event.currentIndex);
        }
    }

    setScreenMaxWidth(value: string) {
        let maxWidth = this.utilitiesService.coerceNumberProperty(value, 0);

        if (maxWidth === 0) {
            this.screenMaxWidthSubject.next('unset');
        } else {
            this.screenMaxWidthSubject.next(`${maxWidth}px`);
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

    public publish() {
        // TODO: Implement this.
        sessionStorage.setItem('sections', JSON.stringify(this.sectionsSubject.value));
    }
}
