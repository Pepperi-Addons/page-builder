import { coerceNumberProperty } from '@angular/cdk/coercion';
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { NgComponentRelation, PageSizeType } from '@pepperi-addons/papi-sdk';
import { PagesService, IPageEditor } from '../../services/pages.service';

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

    private _hostObject: IPageEditor;
    @Input()
    set hostObject(value: IPageEditor) {
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
    get hostObject(): IPageEditor {
        return this._hostObject;
    }

    @Output() hostObjectChange: EventEmitter<IPageEditor> = new EventEmitter<IPageEditor>();
    
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

    availableBlocks: NgComponentRelation[] = [];
    sizesGroupButtons = Array<ISpacingOption>();
    
    constructor(
        private translate: TranslateService,
        private pageBuilderService: PagesService,
    ) { 
        
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

        this.sizesGroupButtons = [
            { key: 'NONE', value: this.translate.instant('GROUP_SIZE.NONE') },
            { key: 'sm', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'md', value: this.translate.instant('GROUP_SIZE.MD') },
            { key: 'lg', value: this.translate.instant('GROUP_SIZE.LG') }
        ];
        
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

    onAddSectionClick(e) {
        this.pageBuilderService.addSection();
    }

    isFullWidthChange(isChecked: boolean) {
        this.isFullWidth = isChecked;
        this.updateHostObject();
    }

    onMaxWidthChange(maxWidth: number) {
        this.maxWidth = coerceNumberProperty(maxWidth, this.maxWidth);
        this.updateHostObject();
    }
    
    setColumnsHorizntalGap(key: string ){
        this.horizontalSpacing = key.toUpperCase() as UiPageSizeType; 
        this.updateHostObject();
    }
    
    setColumnsVerticalGap(key: string) {
        this.verticalSpacing = key.toUpperCase() as UiPageSizeType; 
        this.updateHostObject();
    }
    
    setSectionGap(key: string) {
        this.sectionsGap = key.toUpperCase() as UiPageSizeType; 
        this.updateHostObject();
    }

    setColumnsGap(key: string) {
        this.columnsGap = key.toUpperCase() as UiPageSizeType; 
        this.updateHostObject();
    }

    setRoundedCorners(key: string) {
        this.roundedCorners = key.toUpperCase() as UiPageSizeType; 
        this.updateHostObject();
    }

    onDragStart(event: CdkDragStart) {
        this.pageBuilderService.onBlockDragStart(event);
    }

    onDragEnd(event: CdkDragEnd) {
        this.pageBuilderService.onBlockDragEnd(event);
    }
}
