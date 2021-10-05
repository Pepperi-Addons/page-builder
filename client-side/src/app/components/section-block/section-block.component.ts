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
    @Input() columnBlock: PageSectionBlock;
    @Input() canDrag = false;
    @Input() editable = false;

    @Output() hideInChange: EventEmitter<void> = new EventEmitter();

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        public pageBuilderService: PagesService
    ) { }

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
        
        // Refresh the map for show or hide this block.
        this.hideInChange.emit();
    }

    // TODO: Implement all producer & consumers.
    onBlockChange(event, blockId: string) {
        switch(event.action){
            case 'update-addons':
                // propsSubject.next(e);
            break;
        }
    }
}
