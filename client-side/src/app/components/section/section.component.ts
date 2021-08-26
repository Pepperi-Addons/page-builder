import { Component, ElementRef, Input, OnChanges, OnInit, QueryList, Renderer2, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { IEditor, PagesService } from 'src/app/services/pages.service';
import { PageSectionColumn, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'page-builder-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnChanges {
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
        public pageBuilderService: PagesService
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
            this.pageBuilderService.onEditorChange$.subscribe((editor: IEditor) => {
                this.canDrag = editor.type === 'page-builder';
                
                this.selected = editor.type === 'section' && editor.id === this.id;
                this.selectedBlockId = editor.type === 'block' ? editor.id : '';
            });
        }

        this.sectionColumnKeyPrefix = this.pageBuilderService.getSectionColumnKey(this.id);
    }

    ngOnChanges(changes: SimpleChanges): void {
        // throw new Error('Method not implemented.');
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
