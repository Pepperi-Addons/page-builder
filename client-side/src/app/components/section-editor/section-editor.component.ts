import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IPepOption } from '@pepperi-addons/ngx-lib';
import { SplitType } from '@pepperi-addons/papi-sdk';
import { ISectionEditor } from 'src/app/services/pages.service';
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

export interface ISplitOption {
    key: SplitType; 
    value: string;
}
export interface IAllSplitOption {
    key: string;
    value: Array<ISplitOption>;
}

@Component({
    selector: 'section-editor',
    templateUrl: './section-editor.component.html',
    styleUrls: ['./section-editor.component.scss']
})
export class SectionEditorComponent implements OnInit {
    readonly MIN_HEIGHT = 40;
    
    private _hostObject: ISectionEditor;
    @Input()
    set hostObject(value: ISectionEditor) {
        this._hostObject = value;

        this.sectionName = value.sectionName;
        this.split = value.split;
        this.isAutoHeight = !value.height || value.height === 0;
        this.height = this.isAutoHeight ? this.MIN_HEIGHT : value.height;
    }
    get hostObject(): ISectionEditor {
        return this._hostObject;
    }

    sectionName: string = '';
    
    private _split: SplitType | undefined;
    set split(value: SplitType | undefined) {
        this._split = value;
        
        this.subSections = this._split?.length > 0;

        // Check how many parts we have.
        const arr = value?.split(' ');
        if (arr && arr.length > 1 && arr.length <= 4) {
            this.partsNumber = arr.length.toString();
        } else {
            this.partsNumber = "2";
        }
        
        this.loadSplitOptions();
    }
    get split(): SplitType {
        return this._split;
    }
    
    isAutoHeight: boolean = true;
    height: number = this.MIN_HEIGHT;

    @Output() hostObjectChange: EventEmitter<ISectionEditor> = new EventEmitter<ISectionEditor>();
    
    subSections: boolean = false;
    partsNumber: string = "2";
    partsNumberOptions = Array<IPepOption>();
    splitOptions = Array<ISplitOption>();
    allSplitOptions = Array<IAllSplitOption>();

    constructor(private translate: TranslateService, private dialog: PepDialogService) {
        this.initData();
    }

    private initData() {
        this.partsNumberOptions = [
            { 'key': '2', 'value': '2 Parts' }, 
            { 'key': '3', 'value': '3 Parts' },
            { 'key': '4', 'value': '4 Parts' }
        ];
        
        this.allSplitOptions = [
            { 'key': '2', 'value': [
                { 'key': '1/4 3/4', 'value': '1/4-3/4' },
                { 'key': '1/3 2/3', 'value': '1/3-2/3' },
                { 'key': '1/2 1/2', 'value': '1/2-1/2' },
                { 'key': '2/3 1/3', 'value': '2/3-1/3' },
                { 'key': '3/4 1/4', 'value': '3/4-1/4' },
            ]}, 
            { 'key': '3', 'value': [
                { 'key': '1/3 1/3 1/3', 'value': '1/3-1/3-1/3' },
                { 'key': '1/2 1/4 1/4', 'value': '1/2-1/4-1/4' },
                { 'key': '1/4 1/2 1/4', 'value': '1/4-1/2-1/4' },
                { 'key': '1/4 1/4 1/2', 'value': '1/4-1/4-1/2' },
            ]},
            { 'key': '4', 'value': [
                { 'key': '1/4 1/4 1/4 1/4', 'value': '1/4-1/4-1/4-1/4' },
            ]}
        ];
    }

    private loadSplitOptions() {
        const splitOptions = this.allSplitOptions.find((option) => option.key === this.partsNumber);
        if (splitOptions) {
            this.splitOptions = splitOptions.value;
        } else {
            this.splitOptions = this.allSplitOptions[0].value;
        }

        if (!this._split) {
            this._split = this.splitOptions[0].key;
        }
    }

    private updateHostObject() {
        this._hostObject.sectionName = this.sectionName;
        this._hostObject.split = this.subSections ? this.split : undefined;
        this._hostObject.height = this.isAutoHeight ? 0 : this.height;

        this.hostObjectChange.emit(this.hostObject);
    }

    ngOnInit(): void {
        this.loadSplitOptions();
    }
    
    isAutoHeightChange(isChecked: boolean) {
        this.isAutoHeight = isChecked;
        this.updateHostObject();
    }

    onHeightChange(height: number) {
        if (height >= this.MIN_HEIGHT) {
            this.height = coerceNumberProperty(height, this.height);
            this.updateHostObject();
        }
    }
    
    onSectionNameChange(value: string) {
        this.sectionName = value;
        this.updateHostObject();
    }

    onSubSectionsChange(value: boolean) {
        const oldValue = this.subSections;
        // Check if cancel the sub sections ( change from any -> 1 section ), if true need to show confirm message
        if(value === false){
            this.subSections = value;
            this.showDeleteSectionMsg(() => {
                    this.updateHostObject();
            },
            () => {
                this.subSections = oldValue;

            });
        }
        else{
            this.subSections = value;
            this.updateHostObject();
        }

        
    }
  
    onPartsNumberChange(key: string) {
        const oldKey = this.partsNumber;
        // Check if decrease on sub sections number, if true need to show confirm message
        if(key && parseInt(key) < parseInt(this.partsNumber)){
            this.partsNumber = key;
            this.showDeleteSectionMsg(() => {
                
                this.loadSplitOptions();
                this._split = this.splitOptions[0].key;
                this.updateHostObject();
            },
            () => {
                this.partsNumber = oldKey;
            })
           
        }
        else{
            this.partsNumber = key;
            this.loadSplitOptions();
            this._split = this.splitOptions[0].key;
            this.updateHostObject();
        }
        
    }

    showDeleteSectionMsg(continueCB,cancelCB){
        const actionButtons = [
            new PepDialogActionButton(
                this.translate.instant('ACTIONS.CANCEL'),
                '',
                () => {
                    cancelCB();
                }
            ),
            new PepDialogActionButton(
                this.translate.instant('ACTIONS.CONTINUE'),
                'strong caution',
                () => {
                    continueCB();
                }
            )
        ];
        
        const content = this.translate.instant('PAGE_MANAGER.DELETE_SECTION_MSG');
        const title = this.translate.instant('PAGE_MANAGER.DELETE_SECTION_TITLE');
        const dataMsg = new PepDialogData({title, actionsType: 'custom', content, actionButtons});

        this.dialog.openDefaultDialog(dataMsg);
    }

    onSplitChange(key: SplitType) {
        this._split = key;
        this.updateHostObject();
    }
}
