import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragExit, CdkDropList, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Editor, PageBuilderService, Section } from 'src/app/services/page-builder.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'page-builder-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnChanges {
    @ViewChild('sectionContainer') sectionContainerRef: ElementRef;
    @ViewChildren('blocksWrapper') blocksElementRef: QueryList<ElementRef>;

    @Input() id: string;
    @Input() name: string;
    @Input() editable = false;

    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
        this.refreshSplitData();
    }
    get screenSize(): PepScreenSizeType {
        return this._screenSize;
    }

    private _splitData: string = '';
    @Input()
    set splitData(value: string) {
        this._splitData = value;
        this.refreshSplitData();
    }
    get splitData(): string {
        return this._splitData;
    }

    private _blocks = [];
    @Input()
    set blocks(value: Array<any>) {
        this._blocks = value || [];
    }
    get blocks(): Array<any> {
        return this._blocks;
    }

    @Output() remove: EventEmitter<string> = new EventEmitter();

    sectionsDropList;
    PepScreenSizeType = PepScreenSizeType;
    canDrag = false;

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private layoutService: PepLayoutService,
        private pageBuilderService: PageBuilderService
    ) {
    }

    private refreshSplitData() {
        setTimeout(() => {
            if (this.sectionContainerRef) {
                if (this.screenSize <= PepScreenSizeType.LG) {
                    this.blocksElementRef.toArray().map((section, sectionIndex) => {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'column');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', this.splitData);
                    });

                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-auto-flow', 'column');
                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-template-columns', this.splitData);
                } else {
                    this.blocksElementRef.toArray().map((section, sectionIndex) => {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'row');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', this.splitData);
                    });

                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-auto-flow', 'row');
                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-template-rows', this.splitData);
                }
            }
        }, 0);
    }

    private getBlockEditor(block: any) {
        let blockEditor: any = {};
        Object.assign(blockEditor, block);
        blockEditor.exposedModule = block.editorModuleName;
        blockEditor.componentName = block.editorComponentName;
        return blockEditor;
    }

    ngOnInit(): void {
        this.refreshSplitData();

        // Get the sections id's into sectionsDropList for the drag & drop.
        this.pageBuilderService.sectionsSubject$.subscribe(res => {
            this.sectionsDropList = res.map(section => section.id);
        })

        if (this.editable) {
            this.pageBuilderService.onEditorChange$.subscribe((editor: Editor) => {
                this.canDrag = editor.type === 'page-builder';
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // throw new Error('Method not implemented.');
    }


    onEditSectionClick() {
        this.pageBuilderService.clearActiveSection();

        this.renderer.addClass(this.sectionContainerRef.nativeElement, 'active-section');
        this.pageBuilderService.navigateToEditor({
            title: this.name, //this.translate.instant('Section'),
            type : 'section',
            // currentEditableObject: null // TODO:
        })
    }

    onRemoveSectionClick() {
        this.pageBuilderService.removeSection(this.id);
    }

    removeBlock(blockId: string) {
        for(let i=0; i < this.blocks.length; i++) {
            if(this.blocks[i].id === blockId) {
                this.blocks.splice(i , 1);
            }
        }
    }

    editBlock(block: any) {
        const blockEditor = this.getBlockEditor(block);

        this.pageBuilderService.navigateToEditor({
            title: blockEditor.title,
            type : 'block',
            // currentEditableObject: blockEditor,
            remoteModuleOptions: blockEditor,
            hostObject: null
        });
    }

    onBlockChange(event) {
        switch(event.action){
            case 'update-addons':
                // propsSubject.next(e);
            break;
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onBlockDropped(event, this.id);
    }

    // addField(blockType: string, index: number) {
    //     this.blocks.splice(index, 0, blockType)
    // }

    /** Predicate function that only allows even numbers to be dropped into a list. */
    // evenPredicate(item: CdkDrag<any>) {
    //     return item.data % 2 === 0;
    // }

    // /** Predicate function that doesn't allow items to be dropped into a list. */
    // noReturnPredicate() {
    //     return false;
    // }
}
