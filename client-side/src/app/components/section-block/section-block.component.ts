import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, Renderer2, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { IEditor, PagesService } from 'src/app/services/pages.service';
import { DataViewScreenSize, PageBlock, PageSectionBlock, PageSectionColumn, PageSizeType, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'section-block',
    templateUrl: './section-block.component.html',
    styleUrls: ['./section-block.component.scss']
})
export class SectionBlockComponent implements OnInit {
    
    @Input() sectionId: string;
    @Input() pageBlock: PageBlock;
    @Input() canDrag = false;
    @Input() editable = false;
    @Input() active = false;
    
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

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        public pageBuilderService: PagesService
    ) { }
    
    private setIfHideForCurrentScreenType(): void {
        let isHidden = false;

        if (this.columnBlock.Hide) {
            isHidden = this.columnBlock.Hide.some(hideIn => hideIn === this.screenType);
        }

        this.hideForCurrentScreenType = isHidden;
    }

    ngOnInit(): void {
       
    }

    onEditBlockClick(blockId: string) {
        this.pageBuilderService.navigateToEditor('block', blockId);
    }

    onRemoveBlockClick(blockId: string) {
        this.pageBuilderService.onRemoveBlock(this.sectionId, blockId);
    }

    onHideBlockChange(blockId: string, hideIn: DataViewScreenSize[]) {
        this.pageBuilderService.hideBlock(this.sectionId, blockId, hideIn);
        this.setIfHideForCurrentScreenType();
    }

    // TODO: Implement all producer & consumers.
    onBlockChange(event, blockId: string) {
        switch(event.action){
            case 'update-addons':
                // propsSubject.next(e);
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
