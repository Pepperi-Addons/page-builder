import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PepHttpService } from "@pepperi-addons/ngx-lib";
import { RemoteModuleOptions } from "@pepperi-addons/ngx-remote-loader";
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export type EditorType = 'page-builder' | 'section' | 'block';

export interface Editor {
    title: string,
    type: EditorType,
    // currentEditableObject: any,
    remoteModuleOptions?: RemoteModuleOptions,
    hostObject?: any
}

export interface Section {
    id: string,
    name: string,
    splitData: string;
    blocks: Array<any>,
}


@Injectable({
    providedIn: 'root',
})
export class PageBuilderService {
    private editorsBreadCrumb = Array<Editor>();
    private editorChangeSubject: BehaviorSubject<Editor>;

    private availableBlocksSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    private sectionsSubject: BehaviorSubject<Section[]> = new BehaviorSubject<Section[]>([]);;
    

    get onEditorChange$(): Observable<Editor> {
        return this.editorChangeSubject.asObservable().pipe(distinctUntilChanged());
    }

    get availableBlocksLoadedSubject$(): Observable<any> {
        return this.availableBlocksSubject.asObservable();
    }

    get sectionsSubject$(): Observable<Section[]> {
        return this.sectionsSubject.asObservable()
    }

    constructor(
        private translate: TranslateService,
        private http: PepHttpService,
    ) {
        this.editorsBreadCrumb = new Array<Editor>();
        this.editorsBreadCrumb.push({
            title: this.translate.instant('Main'),
            type : 'page-builder',
            // currentEditableObject: null
        });

        this.editorChangeSubject = new BehaviorSubject<Editor>(this.editorsBreadCrumb[0]);
    }

    private changeCurrentEditor() {
        if (this.editorsBreadCrumb.length > 0) {
            this.editorChangeSubject.next(this.editorsBreadCrumb[this.editorsBreadCrumb.length - 1]);
        }
    }

    private createNewSection(): Section {
        const sectionsLength = this.sectionsSubject.value.length;
        const section = {
            id: `section-${sectionsLength}`,
            name: `${this.translate.instant('Section')} ${sectionsLength}`,
            splitData: '',
            blocks: []
        }

        return section;
    }

    private loadSections() {
        const savedSections: Section[] = JSON.parse(sessionStorage.getItem('sections')) ?? [];
        this.sectionsSubject.next(savedSections);
    }

    initPageBuilder(): void {
        // TODO: Get the sections and the blocks data from the server.
        this.loadSections();
    }

    initPageEditor(addonUUID: string): void {
        // debug locally
        this.http.postHttpCall('http://localhost:4500/api/init_page_editor', { PageType: ''}) // {RelationName: `PageBlock` }
        // this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/init_page_editor`, {})
            .subscribe(res => {
            
            this.availableBlocksSubject.next(res['availableBlocks']);
        });
    }

    navigateToEditor(editor: Editor) {
        if (editor) {
            // Check which editor we have now
            const currentEditor = this.editorsBreadCrumb[this.editorsBreadCrumb.length - 1];
            
            if (currentEditor.type === 'page-builder') {
                this.editorsBreadCrumb.push(editor);
                this.changeCurrentEditor();
            }
        }
    }

    navigateBackFromEditor() {
        // Keep the page builder editor.
        if (this.editorsBreadCrumb.length > 1) {
            // Maybe we want to compare the last editor for validation ?
            const lastEditor = this.editorsBreadCrumb.pop();
            this.changeCurrentEditor();
        }
    }

    clearSections() {
        this.sectionsSubject.next([]);
    }

    addSection(section: Section = null) {
        if (!section) {
            section = this.createNewSection();
        }

        const sections = [...this.sectionsSubject.value, section];
        this.sectionsSubject.next(sections);
    }
    
    removeSection(sectionId: string) {
        const index = this.sectionsSubject.value.findIndex(section => section.id === sectionId);
        if (index > -1) {
            this.sectionsSubject.value.splice(index, 1);
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>, sectionId: string) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else if (event.previousContainer.id == 'availableBlocks') {
            const index = this.sectionsSubject.value.findIndex(section => section.id === sectionId);
            copyArrayItem(event.previousContainer.data, this.sectionsSubject.value[index].blocks, event.previousIndex, event.currentIndex);
        } else {
            const index = this.sectionsSubject.value.findIndex(section => section.id === sectionId);
            transferArrayItem(event.previousContainer.data, this.sectionsSubject.value[index].blocks, event.previousIndex, event.currentIndex);
        }
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        moveItemInArray(this.sectionsSubject.value, event.previousIndex, event.currentIndex);
    }

    public publish() {
        // TODO: Implement this.
        sessionStorage.setItem('sections', JSON.stringify(this.sectionsSubject.value));
    }
}