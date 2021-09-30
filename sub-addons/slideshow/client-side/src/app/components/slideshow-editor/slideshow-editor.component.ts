import { Component, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

interface groupButtonArray {
    key: string; 
    value: string;
}

@Component({
    selector: 'slideshow-editor',
    templateUrl: './slideshow-editor.component.html',
    styleUrls: ['./slideshow-editor.component.scss']
})
export class SlideshowEditorComponent implements OnInit {
    
    HeightUnitsType: Array<groupButtonArray>;
    InnerSpacing: Array<groupButtonArray>;
    ArrowsType: Array<groupButtonArray>;
    ArrowButtons: Array<groupButtonArray>;
    ControllerSize: Array<groupButtonArray>;

    isTransition = true;
    useArrows = true;

    slideshowHeight: '100';

    

    constructor(
        private translate: TranslateService
        // private utilitiesService: PepUtilitiesService
    ) { 

        this.HeightUnitsType = [
            { key: 'REM', value: this.translate.instant('SLIDESHOW.HEIGHTUNITS_REM') },
            { key: 'VH', value: this.translate.instant('SLIDESHOW.HEIGHTUNITS_VH') }
        ];
    
        this.InnerSpacing = [
            { key: 'SM', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'MD', value: this.translate.instant('GROUP_SIZE.MD') }
        ]
    
        this.ArrowsType = [
            { key: 'TWO', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.TWO_ARROWS') },
            { key: 'ONE', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.ONE_ARROW') },
            { key: 'STYLED', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.STYLED_ARROW') },
        ]
    
        this.ArrowButtons = [
            { key: 'NONE', value: this.translate.instant('GROUP_SIZE.NONE') },
            { key: 'RECT', value: this.translate.instant('SLIDESHOW.ARROW_BUTTON.RECT') },
            { key: 'ROUNDED', value: this.translate.instant('SLIDESHOW.ARROW_BUTTON.ROUNDED') }
        ]
    
        this.ControllerSize = [
            { key: 'SM', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'MD', value: this.translate.instant('GROUP_SIZE.MD') }
        ]
    }

    ngOnInit(): void {
    
    }

    onSlideshowHeightChange(event){
        
    }
}
