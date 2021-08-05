import { Component, Input, OnInit, Output } from '@angular/core';
import { IPepFieldValueChangeEvent, IPepOption, PepUtilitiesService } from '@pepperi-addons/ngx-lib';

export interface IAllSplitDataOption {
    key: string;
    value: Array<IPepOption>;
}

@Component({
    selector: 'page-builder-section-editor',
    templateUrl: './section-editor.component.html',
    styleUrls: ['./section-editor.component.scss']
})
export class SectionEditorComponent implements OnInit {
    @Input() sectionName: string = '';
    
    @Input() subSections: boolean = false;

    private _splitData: string = '';
    @Input() 
    set splitData(value: string) {
        this._splitData = value;
        
        // Check how many parts we have.
        const arr = value.split(' ');
        if (arr && arr.length > 1 && arr.length <= 4) {
            this.partsNumber = arr.length.toString();
        } else {
            this.partsNumber = "2";
        }
     
        this.loadSplitDataOptions();
    }
    get splitData(): string {
        return this._splitData;
    }
    
    partsNumber: string = "2";
    partsNumberOptions = Array<IPepOption>();
    splitDataOptions = Array<IPepOption>();
    allSplitDataOptions = Array<IAllSplitDataOption>();

    constructor(private utilitiesService: PepUtilitiesService) { }

    ngOnInit(): void {
        this.partsNumberOptions = [
            { "key": "2", "value": "2 Parts" }, 
            { "key": "3", "value": "3 Parts" },
            { "key": "4", "value": "4 Parts" }
        ];
        
        this.allSplitDataOptions = [
            { "key": "2", "value": [
                { "key": "1fr 3fr", "value": "1/4-3/4" },
                { "key": "1fr 2fr", "value": "1/3-2/3" },
                { "key": "1fr 1fr", "value": "1/2-1/2" },
                { "key": "2fr 1fr", "value": "2/3-1/3" },
                { "key": "3fr 1fr", "value": "3/4-1/4" },
            ]}, 
            { "key": "3", "value": [
                { "key": "1fr 1fr 1fr", "value": "1/3-1/3-1/3" },
                { "key": "2fr 1fr 1fr", "value": "1/2-1/4-1/4" },
                { "key": "1fr 2fr 1fr", "value": "1/4-1/2-1/4" },
                { "key": "1fr 1fr 2fr", "value": "1/4-1/4-1/2" },
            ]},
            { "key": "4", "value": [
                { "key": "1fr 1fr 1fr 1fr", "value": "1/4-1/4-1/4-1/4" },
            ]}
        ];
        
        this.loadSplitDataOptions();
    }

    private loadSplitDataOptions() {
        const splitDataOprions = this.allSplitDataOptions.find((option) => option.key === this.partsNumber);
        if (splitDataOprions) {
            this.splitDataOptions = splitDataOprions.value;
        } else {
            this.splitDataOptions = this.allSplitDataOptions[0].value;
        }

        if (this.splitData === '') {
            this.splitData = this.splitDataOptions[0].key;
        }
    }

    onPartsNumberChange(key: string) {
        this.partsNumber = key;
        this.loadSplitDataOptions();
        this._splitData = this.splitDataOptions[0].key;
    }

    onSplitDataChange(key: string) {
        this._splitData = key;
    }
}
