import { CdkDragEnd, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { PageSizeType } from '@pepperi-addons/papi-sdk';
import { Observable, ReplaySubject } from 'rxjs';
import { NavigationService } from 'src/app/services/navigation.service';
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
        this.horizontalSpacing = this._hostObject.horizontalSpacing || 'NONE';
        this.verticalSpacing = this._hostObject.verticalSpacing || 'NONE';
        this.sectionsGap = this._hostObject.sectionsGap || 'NONE';
        this.columnsGap = this._hostObject.columnsGap || 'NONE';
        this.roundedCorners = this._hostObject.roundedCorners || 'NONE';
    }
    get hostObject(): PageEditor {
        return this._hostObject;
    }

    @Output() hostObjectChange: EventEmitter<PageEditor> = new EventEmitter<PageEditor>();
    
    // @Input()
    pageName: string = '';
    // @Input()
    pageDescription: string = '';

    horizontalSpacing: UiPageSizeType = 'NONE'
    verticalSpacing: UiPageSizeType = 'NONE'
    sectionsGap: UiPageSizeType = 'NONE';
    columnsGap: UiPageSizeType = 'NONE';
    roundedCorners: UiPageSizeType = 'NONE';

    isFullWidth: boolean;
    maxWidth: number;

    availableBlocks: AvailableBlock[] = [];
    sizesGroupButtons = Array<ISpacingOption>();
    
    constructor(
        private navigationService: NavigationService,
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
        this._hostObject.horizontalSpacing = this.horizontalSpacing === 'NONE' ? undefined : this.horizontalSpacing;
        this._hostObject.verticalSpacing = this.verticalSpacing === 'NONE' ? undefined : this.verticalSpacing;
        this._hostObject.sectionsGap = this.sectionsGap === 'NONE' ? undefined : this.sectionsGap;
        this._hostObject.columnsGap = this.columnsGap === 'NONE' ? undefined : this.columnsGap;
        this._hostObject.roundedCorners = this.roundedCorners === 'NONE' ? undefined : this.roundedCorners;

        this.hostObjectChange.emit(this.hostObject);
    }

    ngOnInit(): void {
        this.pageBuilderService.pageLoad$.subscribe(page => {
            if (page) {
                // const addonUUID = this.route.snapshot.params['addonUUID']; // || config.AddonUUID;
                this.pageBuilderService.initPageEditor(this.navigationService.addonUUID, '');
            }
        });

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
        this.horizontalSpacing = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }
    
    setColumnsVerticalGap(event: IPepButtonClickEvent) {
        this.verticalSpacing = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }
    
    setSectionGap(event: IPepButtonClickEvent) {
        this.sectionsGap = event.source.key as UiPageSizeType;
        this.updateHostObject();
    }

    setColumnsGap(event: IPepButtonClickEvent) {
        this.columnsGap = event.source.key as UiPageSizeType;
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
