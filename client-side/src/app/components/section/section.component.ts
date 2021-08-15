import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragExit, CdkDropList, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PageBuilderService, Section } from 'src/app/services/page-builder.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'page-builder-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnChanges {
    @ViewChildren('blocksWrapper') blocksElementRef: QueryList<ElementRef>;

    @Input() id: string;
    @Input() name: string;
    @Input() editable = false;
    @Input() screenSize: PepScreenSizeType;

    PepScreenSizeType = PepScreenSizeType;
    // @Input() numOfBlocks = 3;

    private _blocks = [];
    @Input()
    set blocks(value: Array<any>) {
        this._blocks = value || [];
    }
    get blocks(): Array<any> {
        return this._blocks;
    }

    // public numOfBlocksArr = new Array(0);

    @Output() remove: EventEmitter<string> = new EventEmitter();

    @ViewChild('sectionContainer') sectionContainer: ElementRef;

    // @Input() partsNumber: number = 1;
    private _splitData: string = '';
    @Input()
    set splitData(value: string) {
        this._splitData = value;

        this.refreshSplitData();
    }
    get splitData(): string {
        return this._splitData;
    }

    pageLayout;
    sectionsDropList;

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private layoutService: PepLayoutService,
        private pageBuilderService: PageBuilderService
    ) {
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            this.refreshSplitData();
        });

        this.pageBuilderService.onScreenSizeChange$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            this.refreshSplitData();
        });
    }

    private refreshSplitData() {
        if (this.sectionContainer) {
            if (this.screenSize <= PepScreenSizeType.LG) {
                this.blocksElementRef.toArray().map((section, sectionIndex) => {
                    this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'column');
                    this.renderer.setStyle(section.nativeElement, 'grid-template-columns', this.splitData);
                });

                this.renderer.setStyle(this.sectionContainer.nativeElement, 'grid-auto-flow', 'column');
                this.renderer.setStyle(this.sectionContainer.nativeElement, 'grid-template-columns', this.splitData);
            } else {
                this.blocksElementRef.toArray().map((section, sectionIndex) => {
                    this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'row');
                    this.renderer.setStyle(section.nativeElement, 'grid-template-rows', this.splitData);
                });

                this.renderer.setStyle(this.sectionContainer.nativeElement, 'grid-auto-flow', 'row');
                this.renderer.setStyle(this.sectionContainer.nativeElement, 'grid-template-rows', this.splitData);
            }
        }
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
    }

    ngOnChanges(changes: SimpleChanges): void {
        // throw new Error('Method not implemented.');
    }

    onEditSectionClick() {
        this.renderer.setStyle(this.sectionContainer.nativeElement, 'border', '3px solid Red');
        this.pageBuilderService.navigateToEditor({
            title: this.name, //this.translate.instant('Section'),
            type : 'section',
            // currentEditableObject: null // TODO:
        })
    }

    onRemoveSectionClick() {
        // TODO: Remove section.
        this.remove.emit(this.id);
    }

    entered() {
        // this.transferringItem = undefined;
    }

    exited(e: CdkDragExit<string>) {
    //   this.transferringItem = e.item.data;
    }

    removeBlock(id) {
        for(let i=0; i < this.blocks.length; i++) {
            if(this.blocks[i].id === id) {
                this.blocks.splice(i , 1);
            }
        }
    }

    editBlock(block) {
        const blockEditor = this.getBlockEditor(block);

        this.pageBuilderService.navigateToEditor(
        {
            title: blockEditor.title,
            type : 'block',
            // currentEditableObject: blockEditor,
            remoteModuleOptions: blockEditor,
            hostObject: null
        });
        // blockEditorSubject.next(block);
    }

    // addBlock(event) {
    //     if(this.blocks.length < 12) {
    //         this.blocks.push({ 'id': 'block_'+ this.blocks.length+1});
    //     }
    //     else {
    //         alert("reached to maximum columns !")
    //     }
    // }

    onBlockChange(event) {
        switch(event.action){
            case 'update-addons':
                // propsSubject.next(e);
            break;
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>) {
        // if (event.previousContainer === event.container) {
        //     moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);
        // } else {
        //     this.addField(event.item.data, event.currentIndex);
        // }
        this.pageBuilderService.onBlockDropped(event, this.id);
// debugger;
//         if (event.previousContainer === event.container) {
//             // moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);
//             moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
//         } else if (event.previousContainer.id == 'availableBlocks') {
//             copyArrayItem(event.previousContainer.data, this.blocks, event.previousIndex, event.currentIndex);
//             // copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
//             // this.addField(event.item.data, event.currentIndex);
//         }
//         else {
//             transferArrayItem(event.previousContainer.data, this.blocks, event.previousIndex, event.currentIndex);
//             // transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
//         }
    }

    addField(blockType: string, index: number) {
        this.blocks.splice(index, 0, blockType)
    }

    /** Predicate function that only allows even numbers to be dropped into a list. */
    evenPredicate(item: CdkDrag<any>) {
        return item.data % 2 === 0;
    }

    /** Predicate function that doesn't allow items to be dropped into a list. */
    noReturnPredicate() {
        return false;
    }
}
