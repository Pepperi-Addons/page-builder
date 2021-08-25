import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragExit, CdkDragStart, CdkDropList, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BlockProgress, Editor, PageBuilderService } from 'src/app/services/page-builder.service';
import { PageBlock, PageSection, PageSectionColumn, PageSizeType, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { BehaviorSubject, Observable } from 'rxjs';
import { reduce } from 'rxjs/operators';

@Component({
    selector: 'page-builder-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnChanges {
    private readonly ACTIVE_SECTION_CLASS_NAME = 'active-section';
    private readonly ACTIVE_BLOCK_CLASS_NAME = 'active-block';

    @ViewChild('sectionContainer') sectionContainerRef: ElementRef;
    @ViewChildren('columnsWrapper') columnsElementRef: QueryList<ElementRef>;

    @Input() id: string;
    @Input() name: string;
    @Input() editable = false;
    
    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
        this.refreshSplit();
    }
    get screenSize(): PepScreenSizeType {
        return this._screenSize;
    }

    private _split: SplitType = null;
    @Input()
    set split(value: SplitType) {
        this._split = value;
        this.refreshSplit();
    }
    get split(): SplitType {
        return this._split;
    }

    private _columns = [];
    @Input()
    set columns(value: Array<PageSectionColumn>) {
        this._columns = value || [];
    }
    get columns(): Array<PageSectionColumn> {
        return this._columns;
    }

    private _blocksMap = new Map<string, PageBlock>();
    get blocksMap(): ReadonlyMap<string, PageBlock> {
        return this._blocksMap;
    }

    @Input() sectionsColumnsDropList = [];
    
    PepScreenSizeType = PepScreenSizeType;
    sectionColumnKeyPrefix = '';
    
    canDrag = false;
    selected = false;
    selectedBlockId = '';
    
    pepScreenSizeToFlipToVertical = PepScreenSizeType.SM;

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private layoutService: PepLayoutService,
        private pageBuilderService: PageBuilderService
    ) { }

    private getCssSplitString() {
        switch (this.split) {
            case '1/2 1/2':
                return '1fr 1fr';
            case '1/2 1/4 1/4':
                return '2fr 1fr 1fr';
            case '1/3 1/3 1/3':
                return '1fr 1fr 1fr';
            case '1/3 2/3':
                return '1fr 2fr';
            case '1/4 1/2 1/4':
                return '1fr 2fr 1fr';
            case '1/4 1/4 1/2':
                return '1fr 1fr 2fr';
            case '1/4 1/4 1/4 1/4':
                return '1fr 1fr 1fr 1fr';
            case '1/4 3/4':
                return '1fr 3fr';
            case '2/3 1/3':
                return '2fr 1fr';
            case '3/4 1/4':
                return '3fr 1fr';
            default: // For one column.
                return '1fr';
        }
    }

    private refreshSplit() {
        setTimeout(() => {
            if (this.sectionContainerRef) {
                if (this.screenSize <= this.pepScreenSizeToFlipToVertical) {
                    this.columnsElementRef.toArray().map((section, sectionIndex) => {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'column');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', 'unset');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', this.getCssSplitString());
                    });

                    // this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-auto-flow', 'column');
                    // this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-template-columns', this.getCssSplitString());
                } else {
                    this.columnsElementRef.toArray().map((section, sectionIndex) => {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'row');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', 'unset');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', this.getCssSplitString());
                    });

                    // this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-auto-flow', 'row');
                    // this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-template-rows', this.getCssSplitString());
                }
            }
        }, 0);
    }

    ngOnInit(): void {
        this.refreshSplit();

        if (this.editable) {
            this.pageBuilderService.onEditorChange$.subscribe((editor: Editor) => {
                this.canDrag = editor.type === 'page-builder';
                
                this.selected = editor.type === 'section' && editor.id === this.id;
                this.selectedBlockId = editor.type === 'block' ? editor.id : '';
            });
        }

        this.sectionColumnKeyPrefix = this.pageBuilderService.getSectionColumnKey(this.id);

        this.pageBuilderService.pageBlockProgress$.subscribe((blocksProgress: ReadonlyMap<string, BlockProgress>) => {
            // Clear the blocks map.
            this._blocksMap.clear();

            // // Get only the block keys that exist in columns.
            // const blockKeys = this.columns.filter(column => !!column.Block).map(column => column.Block?.BlockKey);

            // // For each block id -> if exist in blocksProgress insert the block into my blocksMap 
            // blockKeys.forEach(blockKey => {
            //     const blockProgress = blocksProgress.get(blockKey);
            //     if (blockProgress) {
            //         this._blocksMap.set(blockKey, blockProgress.block);
            //     }
            // });

            blocksProgress.forEach(block => {
                this._blocksMap.set(block.block.Key, block.block);
            });
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // throw new Error('Method not implemented.');
    }

    getBlock(blockKey: string) {
        const block = this._blocksMap.get(blockKey);
        return block;
    }

    onEditSectionClick() {
        this.pageBuilderService.navigateToEditor('section', this.id);
    }

    onRemoveSectionClick() {
        this.pageBuilderService.onRemoveSection(this.id);
    }

    onEditBlockClick(blockId: string) {
        this.pageBuilderService.navigateToEditor('block', blockId);
    }

    onRemoveBlockClick(blockId: string) {
        this.pageBuilderService.onRemoveBlock(this.id, blockId);
    }

    onBlockChange(event, blockId: string) {
        switch(event.action){
            case 'update-addons':
                // propsSubject.next(e);
            break;
        }
    }

    onBlockDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onBlockDropped(event, this.id);
    }

    canDropPredicate(columnIndex: number) {
        return (drag: CdkDrag, drop: CdkDropList) => {
            const res = !this.pageBuilderService.doesColumnContainBlock(this.id, columnIndex);
            return res;
        };
    }

    onDragStart(event: CdkDragStart) {
        this.pageBuilderService.changeCursorOnDragStart();
    }

    onDragEnd(event: CdkDragEnd) {
        this.pageBuilderService.changeCursorOnDragEnd();
    }
}
