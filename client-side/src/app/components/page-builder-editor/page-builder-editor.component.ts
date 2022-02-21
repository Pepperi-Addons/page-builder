import { coerceNumberProperty } from '@angular/cdk/coercion';
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { IPepDraggableItem } from '@pepperi-addons/ngx-lib/draggable-items/draggable-items.model';
import { NgComponentRelation, PageSizeType } from '@pepperi-addons/papi-sdk';
import { PagesService, IPageEditor, UiPageSizeType } from '../../services/pages.service';

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
        this.horizontalSpacing = this._hostObject.horizontalSpacing || 'none';
        this.verticalSpacing = this._hostObject.verticalSpacing || 'none';
        this.sectionsGap = this._hostObject.sectionsGap || 'none';
        this.columnsGap = this._hostObject.columnsGap || 'none';
        this.roundedCorners = this._hostObject.roundedCorners || 'none';
    }
    get hostObject(): IPageEditor {
        return this._hostObject;
    }

    @Output() hostObjectChange: EventEmitter<IPageEditor> = new EventEmitter<IPageEditor>();
    
    // @Input()
    pageName: string = '';
    // @Input()
    pageDescription: string = '';

    horizontalSpacing: UiPageSizeType = 'none'
    verticalSpacing: UiPageSizeType = 'none'
    sectionsGap: UiPageSizeType = 'none';
    columnsGap: UiPageSizeType = 'none';
    roundedCorners: UiPageSizeType = 'none';

    isFullWidth: boolean;
    maxWidth: number;

    availableBlocks: NgComponentRelation[] = [];
    availableBlocksForDrag: Array<IPepDraggableItem> = [];
    sizesGroupButtons = Array<ISpacingOption>();
    
    constructor(
        private translate: TranslateService,
        private pagesService: PagesService,
    ) { 
        
    }

    private updateHostObject() {
        this._hostObject.pageName = this.pageName;
        this._hostObject.pageDescription = this.pageDescription;
        this._hostObject.maxWidth = this.isFullWidth ? 0 : this.maxWidth;
        this._hostObject.horizontalSpacing = this.horizontalSpacing === 'none' ? undefined : this.horizontalSpacing;
        this._hostObject.verticalSpacing = this.verticalSpacing === 'none' ? undefined : this.verticalSpacing;
        this._hostObject.sectionsGap = this.sectionsGap === 'none' ? undefined : this.sectionsGap;
        this._hostObject.columnsGap = this.columnsGap === 'none' ? undefined : this.columnsGap;
        this._hostObject.roundedCorners = this.roundedCorners === 'none' ? undefined : this.roundedCorners;

        this.hostObjectChange.emit(this.hostObject);
    }

    ngOnInit(): void {

        this.sizesGroupButtons = [
            { key: 'none', value: this.translate.instant('GROUP_SIZE.NONE') },
            { key: 'sm', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'md', value: this.translate.instant('GROUP_SIZE.MD') },
            { key: 'lg', value: this.translate.instant('GROUP_SIZE.LG') }
        ];
        
        this.pagesService.availableBlocksLoadedSubject$.subscribe(availableBlocks => {
            this.availableBlocks = availableBlocks;
            
            this.availableBlocksForDrag = this.availableBlocks.map(ab => {
                return {
                    title: ab.Name,
                    disabled: false,
                    data: ab
                }
            });
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
        this.pagesService.addSection();
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
        this.horizontalSpacing = key as UiPageSizeType; 
        this.updateHostObject();
    }
    
    setColumnsVerticalGap(key: string) {
        this.verticalSpacing = key as UiPageSizeType; 
        this.updateHostObject();
    }
    
    setSectionGap(key: string) {
        this.sectionsGap = key as UiPageSizeType; 
        this.updateHostObject();
    }

    setColumnsGap(key: string) {
        this.columnsGap = key as UiPageSizeType; 
        this.updateHostObject();
    }

    setRoundedCorners(key: string) {
        this.roundedCorners = key as UiPageSizeType; 
        this.updateHostObject();
    }

    onDragStart(event: CdkDragStart) {
        this.pagesService.onBlockDragStart(event);
    }

    onDragEnd(event: CdkDragEnd) {
        this.pagesService.onBlockDragEnd(event);
    }
}
