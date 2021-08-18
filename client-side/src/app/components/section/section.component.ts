import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragExit, CdkDropList, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Editor, PageBuilderService } from 'src/app/services/page-builder.service';
import { PageBlock, PageSection, PageSectionColumn, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { BehaviorSubject, Observable } from 'rxjs';

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

    @Output() remove: EventEmitter<string> = new EventEmitter();

    sectionsDropList;
    PepScreenSizeType = PepScreenSizeType;
    canDrag = false;

    private blocksSubject: BehaviorSubject<PageBlock[]> = new BehaviorSubject<PageBlock[]>([]);
    get blocksSubject$(): Observable<PageBlock[]> {
        return this.blocksSubject.asObservable();
    }

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private layoutService: PepLayoutService,
        private pageBuilderService: PageBuilderService
    ) {
        this.pageBuilderService.blocksChangeSubject$.subscribe((blocks) => {
            const blockKeys = this.columns.map(column => column.Block?.BlockKey);
            this.blocksSubject.next(blocks.filter(block => blockKeys.includes(block.Key)))
        });
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
                if (this.screenSize <= PepScreenSizeType.LG) {
                    this.blocksElementRef.toArray().map((section, sectionIndex) => {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'column');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', this.getCssSplitString());
                    });

                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-auto-flow', 'column');
                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-template-columns', this.getCssSplitString());
                } else {
                    this.blocksElementRef.toArray().map((section, sectionIndex) => {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'row');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', this.getCssSplitString());
                    });

                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-auto-flow', 'row');
                    this.renderer.setStyle(this.sectionContainerRef.nativeElement, 'grid-template-rows', this.getCssSplitString());
                }
            }
        }, 0);
    }

    ngOnInit(): void {
        this.refreshSplit();

        // Get the sections id's into sectionsDropList for the drag & drop.
        this.pageBuilderService.sectionsSubject$.subscribe(res => {
            this.sectionsDropList = res.map(section => section.Key);
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
        this.pageBuilderService.navigateToEditor('section', this.id);
    }

    onRemoveSectionClick() {
        this.pageBuilderService.removeSection(this.id);
    }

    removeBlock(blockId: string) {
        this.pageBuilderService.removeBlock(blockId);
    }

    editBlock(block: any) {
        this.pageBuilderService.navigateToEditor('block', block.Key);
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
