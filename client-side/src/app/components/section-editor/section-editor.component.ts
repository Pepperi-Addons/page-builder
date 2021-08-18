import { Component, Input, OnInit, Output } from '@angular/core';
import { IPepFieldValueChangeEvent, IPepOption, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { PageSection, SplitType } from '@pepperi-addons/papi-sdk';

export interface IAllSplitOption {
    key: string;
    value: Array<{ key: SplitType; value: string }>;
}

@Component({
    selector: 'page-builder-section-editor',
    templateUrl: './section-editor.component.html',
    styleUrls: ['./section-editor.component.scss']
})
export class SectionEditorComponent implements OnInit {
    // private _hostObject: PageSection;
    // @Input()
    // set hostObject(value: PageSection) {
    //     this._hostObject = value;
    // }
    // get hostObject(): PageSection {
    //     return this._hostObject;
    // }

    @Input() sectionName: string = '';
    
    private _split: string = '';
    @Input() 
    set split(value: string) {
        this._split = value;
        
        this.subSections = this._split.length > 0;

        // Check how many parts we have.
        const arr = value.split(' ');
        if (arr && arr.length > 1 && arr.length <= 4) {
            this.partsNumber = arr.length.toString();
        } else {
            this.partsNumber = "2";
        }
        
        this.loadSplitOptions();
    }
    get split(): string {
        return this._split;
    }
    
    subSections: boolean = false;
    partsNumber: string = "2";
    partsNumberOptions = Array<IPepOption>();
    splitOptions = Array<IPepOption>();
    allSplitOptions = Array<IAllSplitOption>();

    constructor(private utilitiesService: PepUtilitiesService) { }

    ngOnInit(): void {

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
        
        this.loadSplitOptions();
    }

    private loadSplitOptions() {
        const splitOprions = this.allSplitOptions.find((option) => option.key === this.partsNumber);
        if (splitOprions) {
            this.splitOptions = splitOprions.value;
        } else {
            this.splitOptions = this.allSplitOptions[0].value;
        }

        if (this.split === '') {
            this.split = this.splitOptions[0].key;
        }
    }

    onPartsNumberChange(key: string) {
        this.partsNumber = key;
        this.loadSplitOptions();
        this._split = this.splitOptions[0].key;
    }

    onSplitChange(key: string) {
        this._split = key;
    }
}
