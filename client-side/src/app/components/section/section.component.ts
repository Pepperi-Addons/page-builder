import { Component, ElementRef, Input, OnChanges, OnInit, QueryList, Renderer2, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { IEditor, PagesService } from 'src/app/services/pages.service';
import { DataViewScreenSize, PageBlock, PageSectionColumn, PageSizeType, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit {
    @ViewChild('sectionContainer') sectionContainerRef: ElementRef;
    @ViewChildren('columnsWrapper') columnsElementRef: QueryList<ElementRef>;

    @Input() id: string;
    @Input() name: string;

    private _editable = false;
    @Input()
    set editable(value: boolean) {
        this._editable = value;
        this.refreshSplit();
    }
    get editable(): boolean {
        return this._editable;
    }

    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
        this.refreshSplit();
        this.setScreenType();
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
        this.calculateIfSectionContainsBlocks();
    }
    get columns(): Array<PageSectionColumn> {
        return this._columns;
    }
    
    private _hideIn: DataViewScreenSize[];
    @Input()
    set hideIn(value: DataViewScreenSize[]) {
        this._hideIn = value;
        this.setIfHideForCurrentScreenType();
    }
    get hideIn(): DataViewScreenSize[] {
        return this._hideIn;
    }

    @Input() columnsGap: PageSizeType | 'NONE';
    @Input() sectionsColumnsDropList = [];
    @Input() pageBlocksMap = new Map<string, PageBlock>();

    PepScreenSizeType = PepScreenSizeType;
    sectionColumnKeyPrefix = '';
    
    canDrag = false;
    selected = false;
    selectedBlockId = '';
    
    containsBlocks = false;
    pepScreenSizeToFlipToVertical = PepScreenSizeType.SM;
    screenType: DataViewScreenSize;
    hideForCurrentScreenType = false;
    
    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        public pageBuilderService: PagesService
    ) { }

    private calculateIfSectionContainsBlocks() {
        this.containsBlocks = this.columns.some(column => column.Block);
    }

    private setScreenType() {
        this.screenType = this.pageBuilderService.getScreenType(this.screenSize);
        this.setIfHideForCurrentScreenType();
    }

    private setIfHideForCurrentScreenType(): void {
        let isHidden = false;

        if (this.hideIn) {
            isHidden = this.hideIn.some(hideIn => hideIn === this.screenType);
        }

        this.hideForCurrentScreenType = isHidden;
    }
    
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
                let cssSplitString = this.getCssSplitString();
                
                // Go for all the columns in the columnsWrapper
                this.columnsElementRef.toArray().map((section, sectionIndex) => {
                    // Horizontal (true) for large screens, false for small screens.
                    const isHorizontalView = this.screenSize <= this.pepScreenSizeToFlipToVertical;

                    if (isHorizontalView) {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'column');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', 'unset');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', cssSplitString);
                    } else {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'row');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', 'unset');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', cssSplitString);
                        
                        // In runtime (or preview mode).
                        if (!this.editable) {
                            const cssSplitArray = cssSplitString.split(' ');
                            
                            // If there are some hidden columns change the column width to 0 (for cut the spacing in the grid-template-rows).
                            this.columns.forEach((column, index) => {
                                if (!column.Block) {
                                    cssSplitArray[index] = '0';
                                }
                            });

                            this.renderer.setStyle(section.nativeElement, 'grid-template-rows', cssSplitArray.join(' '));
                        }
                    }
                });
            }
        }, 0);
    }

    ngOnInit(): void {
        this.refreshSplit();

        if (this.editable) {
            this.pageBuilderService.onEditorChange$.subscribe((editor: IEditor) => {
                this.canDrag = editor && editor.type === 'page-builder';
                this.selected = editor && editor.type === 'section' && editor.id === this.id;
                this.selectedBlockId = editor && editor.type === 'block' ? editor.id : '';
            });
        }

        this.sectionColumnKeyPrefix = this.pageBuilderService.getSectionColumnKey(this.id);
    }

    onEditSectionClick() {
        this.pageBuilderService.navigateToEditor('section', this.id);
    }

    onRemoveSectionClick() {
        this.pageBuilderService.removeSection(this.id);
    }

    onHideSectionChange(hideIn: DataViewScreenSize[]) {
        this.pageBuilderService.hideSection(this.id, hideIn);
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
