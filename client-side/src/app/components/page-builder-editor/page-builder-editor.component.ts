import { CdkDragEnd, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { PageSizeType } from '@pepperi-addons/papi-sdk';
import { Observable, ReplaySubject } from 'rxjs';
import { AvailableBlock, PageBuilderService, PageEditor } from '../../services/page-builder.service';
// import { subject } from '../page-builder/page-builder.component';
// import { config } from '../addon.config';

type UiPageSizeType = PageSizeType | 'NONE';

export interface ISpacingOption {
    key?: UiPageSizeType; 
    value: string;
}

@Component({
    selector: 'page-builder-editor',
    templateUrl: './page-builder-editor.component.html',
    styleUrls: ['./page-builder-editor.component.scss']
})
export class PageBuilderEditorComponent implements OnInit {
    @ViewChild('availableBlocksContainer', { read: ElementRef }) availableBlocksContainer: ElementRef;
        
    @Input() sectionsColumnsDropList = [];

    private _hostObject: PageEditor;
    @Input()
    set hostObject(value: PageEditor) {
        this._hostObject = value;

        this.pageName = value.pageName;
        this.pageDescription = value.pageDescription;

        this.isFullWidth = !value.maxWidth || value.maxWidth === 0;
        this.maxWidth = value.maxWidth;
        this.columnsHorizntalGap = this._hostObject.columnsHorizntalGap|| 'NONE';
        this.columnsVerticalGap = this._hostObject.columnsVerticalGap|| 'NONE';
        this.sectionsGap = this._hostObject.sectionsGap|| 'NONE';
        this.roundedCorners = this._hostObject.roundedCorners|| 'NONE';
    }
    get hostObject(): PageEditor {
        return this._hostObject;
    }

    @Output() hostObjectChange: EventEmitter<PageEditor> = new EventEmitter<PageEditor>();
    
    // @Input()
    pageName: string = '';
    // @Input()
    pageDescription: string = '';

    columnsHorizntalGap: UiPageSizeType = 'NONE'
    columnsVerticalGap: UiPageSizeType = 'NONE'
    sectionsGap: UiPageSizeType = 'NONE';
    roundedCorners: UiPageSizeType = 'NONE';

    isFullWidth: boolean;
    maxWidth: number;

    availableBlocks: AvailableBlock[] = [];
    sizesGroupButtons = Array<ISpacingOption>();
    
    constructor(
        private pageBuilderService: PageBuilderService,
        private route: ActivatedRoute
    ) { 
        this.sizesGroupButtons = [
            { key: 'NONE', value: 'None' },
            { key: 'SM', value: 'SM' },
            { key: 'MD', value: 'MD' },
            { key: 'LG', value: 'LG' }
        ];
    }

    private updateHostObject() {
        this._hostObject.pageName = this.pageName;
        this._hostObject.pageDescription = this.pageDescription;
        this._hostObject.maxWidth = this.isFullWidth ? 0 : this.maxWidth;
        this._hostObject.columnsHorizntalGap = this.columnsHorizntalGap === 'NONE' ? undefined : this.columnsHorizntalGap;
        this._hostObject.columnsVerticalGap = this.columnsVerticalGap === 'NONE' ? undefined : this.columnsVerticalGap;
        this._hostObject.sectionsGap = this.sectionsGap === 'NONE' ? undefined : this.sectionsGap;
        this._hostObject.roundedCorners = this.roundedCorners === 'NONE' ? undefined : this.roundedCorners;

        this.hostObjectChange.emit(this.hostObject);
    }

    ngOnInit(): void {
        // this.pageBuilderService.pageLoad$.subscribe(page => {
        //     if (page) {
                const addonUUID = this.route.snapshot.params.addon_uuid; // || config.AddonUUID;
                this.pageBuilderService.initPageEditor(addonUUID, '');
        //     }
        // });

        this.pageBuilderService.availableBlocksLoadedSubject$.subscribe(availableBlocks => {
            this.availableBlocks = availableBlocks;
        });
    }

    onPageNameChange(value: string) {
        this.pageName = value;
        this.updateHostObject();
    }

    onPageDescriptionChange(value: string) {
        this.pageDescription = value;
        this.updateHostObject();
    }

    isFullWidthChange(isChecked: boolean) {
        this.isFullWidth = isChecked;
        this.updateHostObject();
    }

    onMaxWidthChange(maxWidth: number) {
        this.maxWidth = maxWidth;
        this.updateHostObject();
    }
    
    setColumnsHorizntalGap(event: IPepButtonClickEvent) {
        this.columnsHorizntalGap = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }
    
    setColumnsVerticalGap(event: IPepButtonClickEvent) {
        this.columnsVerticalGap = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }
    
    setSectionGap(event: IPepButtonClickEvent) {
        this.sectionsGap = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }

    setRoundedCorners(event: IPepButtonClickEvent) {
        this.roundedCorners = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }

    onDragStart(event: CdkDragStart) {
        this.pageBuilderService.changeCursorOnDragStart();
    }

    onDragEnd(event: CdkDragEnd) {
        this.pageBuilderService.changeCursorOnDragEnd();
    }
}
