import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { IEditor, PagesService } from 'src/app/services/pages.service';
import { DataViewScreenSize, PageBlock, PageConfiguration, PageSectionBlock, PageSectionColumn, PageSizeType, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

interface IHostObject {
    configuration: any;
    pageConfiguration?: PageConfiguration;
    pageType?: any;
    context?: any;
    filter?: any;
}
@Component({
    selector: 'section-block',
    templateUrl: './section-block.component.html',
    styleUrls: ['./section-block.component.scss']
})
export class SectionBlockComponent implements OnInit {
    
    @Input() sectionId: string;
    @Input() canDrag = false;
    @Input() editable = false;
    @Input() active = false;
    
    private _pageBlock: PageBlock;
    @Input()
    set pageBlock(value: PageBlock) {
        this._pageBlock = value;
        this.setHostObject();
    }
    get pageBlock(): PageBlock {
        return this._pageBlock;
    }

    private _columnBlock: PageSectionBlock;
    @Input()
    set columnBlock(value: PageSectionBlock) {
        this._columnBlock = value;
        this.setIfHideForCurrentScreenType();
    }
    get columnBlock(): PageSectionBlock {
        return this._columnBlock;
    }

    private _screenType: DataViewScreenSize;
    @Input()
    set screenType(value: DataViewScreenSize) {
        this._screenType = value;
        this.setIfHideForCurrentScreenType();
    }
    get screenType(): DataViewScreenSize {
        return this._screenType;
    }
    
    hideForCurrentScreenType = false;
    
    private _hostObject: IHostObject;
    get hostObject() {
        return this._hostObject;
    }

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        public pageBuilderService: PagesService
    ) { }
    
    private setHostObject(): void {
        this._hostObject = this.pageBuilderService.getBlockHostObject(this.pageBlock);
    }

    private setIfHideForCurrentScreenType(): void {
        let isHidden = false;

        if (this.columnBlock.Hide) {
            isHidden = this.columnBlock.Hide.some(hideIn => hideIn === this.screenType);
        }

        this.hideForCurrentScreenType = isHidden;
    }

    ngOnInit(): void {
        this.pageBuilderService.onPageBlockChange$.subscribe((pageBlock: PageBlock) => {
            if (pageBlock && this.pageBlock.Key === pageBlock.Key) {
                this.pageBlock = pageBlock;
            }
        });

        this.pageBuilderService.pageConsumersFiltersMapChange$.subscribe((map: Map<string, any>) => {
            // Only if this block is consumer and he's in the map than set hostObject (cause some filter was change).
            if (this.pageBlock.PageConfiguration?.Consume && map.has(this.pageBlock.Key)) {
                this.setHostObject();
            }
        });
    }

    onEditBlockClick() {
        this.pageBuilderService.navigateToEditor('block', this.pageBlock.Key);
    }

    onRemoveBlockClick() {
        this.pageBuilderService.onRemoveBlock(this.sectionId, this.pageBlock.Key);
    }

    onHideBlockChange(hideIn: DataViewScreenSize[]) {
        this.pageBuilderService.hideBlock(this.sectionId, this.pageBlock.Key, hideIn);
        this.setIfHideForCurrentScreenType();
    }

    onBlockHostEvents(event) {
        // TODO: Implement all other events.
        switch(event.action){
            case 'block-loaded':
                this.pageBuilderService.updateBlockLoaded(this.pageBlock.Key);
                break;
            case 'set-filters':
                this.pageBuilderService.updateBlockFilters(this.pageBlock.Key, event.filters);
                break;
            case 'set-context':
                break;
        }
    }

    onDragStart(event: CdkDragStart) {
        this.pageBuilderService.changeCursorOnDragStart();
    }

    onDragEnd(event: CdkDragEnd) {
        this.pageBuilderService.changeCursorOnDragEnd();
    }
}
