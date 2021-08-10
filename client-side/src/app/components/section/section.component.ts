import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragExit, CdkDropList, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PageBuilderService, Section } from 'src/app/services/page-builder.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'page-builder-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnChanges {
    
    // @ViewChildren('htmlSections') htmlSections: QueryList<ElementRef>;
    @ViewChildren(CdkDropList) htmlSections: QueryList<CdkDropList>;
    @ViewChildren('htmlBlocks') htmlBlocks: QueryList<ElementRef>;

    // @Input() section: any;

    @Input() id: string;
    @Input() name: string;
    @Input() editable = false;
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
        private pageBuilderService: PageBuilderService
    ) {

    }

    private refreshSplitData() {
        if (this.sectionContainer) {
            this.renderer.setStyle(this.sectionContainer.nativeElement, 'grid-template-columns', this.splitData);
        }
    }

    ngOnInit(): void {
        this.refreshSplitData();

        this.pageBuilderService.sectionsSubject$.subscribe(res => {
            this.sectionsDropList = res.map(section => section.id);
        })

        // this.blocks = new Array(0);
        // for(let i=0;i<this.numOfBlocks;i++){
        //     this.blocks.push({ 'index': i, 'id': 'block_'+ i});
        // }

    }

    ngOnChanges(changes: SimpleChanges): void {
        // throw new Error('Method not implemented.');
    }

    onEditSectionClick() {
        this.pageBuilderService.navigateToEditor({
            title: this.translate.instant('Section'),
            type : 'section',
            currentEditableObject: null // TODO:
        })
    }

    onRemoveSectionClick() {
        // TODO: Remove section.
        this.remove.emit(this.id);
    }

    // drop(event: CdkDragDrop<string[]>) {
    //     debugger;
    //     moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);

    // }
    // drop(event: CdkDragDrop<string[]>) {
    //     debugger;
    //     if (event.previousContainer === event.container) {
    //         moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    //     } else if (event.previousContainer.id == 'availableBlocks') {
    //         copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    //     }
    //     else {
    //         transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    //     }

    //     const flatLayout = this.htmlSections.toArray().map((section, sectionIndex) =>
    //         section.getSortedItems().map((block, blockIndex) => {
    //             const flex = block.element.nativeElement.style.flexGrow != '' ?
    //                         block.element.nativeElement.style.flexGrow : '1'
    //             return {
    //                 'Key': block.data.key,
    //                 'layout':  {
    //                     section: sectionIndex,
    //                     block: blockIndex,
    //                     flex: flex
    //                 },
    //                 'Block': block.data
    //             }
    //         }
    //     ));

    //     this.pageLayout =  [].concat.apply([], flatLayout);
    //     sessionStorage.setItem('blocks',JSON.stringify(this.pageLayout));
    // }
    
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
        block.exposedModue = block.editorModuleName;
        block.compoenntName = block.editorComponentName;
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
