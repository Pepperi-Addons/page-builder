import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PepStyleType, PepSizeType, PepHorizontalAlignment, PepVerticalAlignment, PepScreenSizeType} from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { ISlideShow, ISlideshowEditor, slide, TransitionType, ArrowShape, ISlideEditor } from '../slideshow.model';
// import { PageSizeType } from '@pepperi-addons/papi-sdk';

// type UiPageSizeType = PageSizeType | 'NONE';

// export interface ISpacingOption {
//     key?: UiPageSizeType; 
//     value: string;
// }
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
    
    @ViewChild('availableSlidesContainer', { read: ElementRef }) availableBlocksContainer: ElementRef;

    // @Input() slidesDropList = []; 
    
    private _hostObject: ISlideShow = this.getDefaultHostObject();
    @Input() 
    set hostObject(value: ISlideShow) {
        
        if (!value) {
            value = this.getDefaultHostObject();
        }

        this._hostObject = value;
    }
    get hostObject(): ISlideShow {
        return this._hostObject;
    }

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    
    // hostObject: ISlideShow = { slideshowConfig: new ISlideshowEditor(), slides: Array<ISlideEditor>() };
    slideShowConfig = new ISlideshowEditor();

    availableSlides: Array<slide> = [{id: '1', Title: "Slide1"},{id: '2', Title: "Slide2"}];
    
    transitionTypes: Array<{key: TransitionType, value: string}>;
    transitionTimes: Array<{key: string, value: string}>;
    arrowStyles: Array<{key: PepStyleType, value: string}>;

    HeightUnitsType: Array<groupButtonArray>;
    InnerSpacing: Array<{key: PepSizeType, value: string}>;
    ArrowsType: Array<groupButtonArray>;
    ArrowButtons: Array<{key: ArrowShape, value: string}>;
    ControllerSize: Array<groupButtonArray>;
    
    SlideTitleSize:Array<groupButtonArray>;
    SlideSubTitleSize: Array<groupButtonArray>;
    WidthSize: Array<groupButtonArray>;
    HorizentalAlign: Array<groupButtonArray>;
    VerticalAlign: Array<groupButtonArray>;
    SlideDropShadowStyle: Array<groupButtonArray>;

    showSlideEditor = false;

    // SLIDE ATTR
    showSlideTitle = false;
    slideContent = '';
    showSubTitle = false;
    showFirstButton = false;
    showSecondButton = false;
    useGradientOverlay = false;
    useOverlay = false;
    hasImage = true;
    useDropShadow = false;
    

    constructor(private translate: TranslateService) { 
        // this.hostObject.slideshowConfig = new ISlideshowEditor();
    }

    private getDefaultHostObject(): ISlideShow {
        return { slideshowConfig: new ISlideshowEditor(), slides: Array<ISlideEditor>() };
    }

    private updateHostObject() {
        this.hostObject.slideshowConfig = this.slideShowConfig;
        
        this.hostEvents.emit({
            action: 'set-configuration',
            configuration: this.hostObject
        });
    }


    onSlideshowFieldChange(key, event){
        if(event && event.source && event.source.key){
            this.slideShowConfig[key] = event.source.key;
        }
        else{
            this.slideShowConfig[key] = event;
        }

        this.updateHostObject();
    }

    async ngOnInit(): Promise<void> {

        const desktopTitle = await this.translate.get('SLIDESHOW.HEIGHTUNITS_REM').toPromise();

        this.transitionTypes = [
            { key: 'Fade', value: this.translate.instant('SLIDESHOW.TRANSITIONTYPES.FADE') },
            { key: 'Blur', value: this.translate.instant('SLIDESHOW.TRANSITIONTYPES.BLUR') },
            { key: 'Dissolve', value: this.translate.instant('SLIDESHOW.TRANSITIONTYPES.DISSOLVE') },
            { key: 'Iris', value: this.translate.instant('SLIDESHOW.TRANSITIONTYPES.IRIS') }
        ]

        this.transitionTimes = [
            { key: '3', value: '3'},
            { key: '5', value: '5'},
            { key: '7', value: '7'},
            { key: '10', value: '10'},
            { key: '15', value: '15'},
        ]
        
        this.arrowStyles = [
            { key: 'weak', value: 'Weak' },
            { key: 'weak-invert', value:'Weak-Invert' },
            { key: 'regular', value: 'Regular' },
            { key: 'strong', value: 'Strong' }
        ];

        this.HeightUnitsType = [
            { key: 'REM', value: this.translate.instant('SLIDESHOW.HEIGHTUNITS_REM') },
            { key: 'VH', value: this.translate.instant('SLIDESHOW.HEIGHTUNITS_VH') }
        ];
    
        this.InnerSpacing = [
            { key: 'sm', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'md', value: this.translate.instant('GROUP_SIZE.MD') }
        ];
    
        this.ArrowsType = [
            { key: 'Two', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.TWO_ARROWS') },
            { key: 'One', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.ONE_ARROW') },
            { key: 'Styled', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.STYLED_ARROW') },
        ];
    
        this.ArrowButtons = [
            { key: 'None', value: this.translate.instant('GROUP_SIZE.NONE') },
            { key: 'Rect', value: this.translate.instant('SLIDESHOW.ARROW_BUTTON.RECT') },
            { key: 'Rounded', value: this.translate.instant('SLIDESHOW.ARROW_BUTTON.ROUNDED') }
        ];
    
        this.ControllerSize = [
            { key: 'SM', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'MD', value: this.translate.instant('GROUP_SIZE.MD') }
        ];

        this.SlideTitleSize = [
            { key: 'MD', value: this.translate.instant('GROUP_SIZE.MD') },
            { key: 'LG', value: this.translate.instant('GROUP_SIZE.LG') },
            { key: 'XL', value: this.translate.instant('GROUP_SIZE.XL') },
        ];
    
        this.SlideSubTitleSize = [
            { key: 'SM', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'MD', value: this.translate.instant('GROUP_SIZE.MD') },
            { key: 'LG', value: this.translate.instant('GROUP_SIZE.LG') }
        ];
    
        this.WidthSize =  [
            { key: 'NARROW', value: this.translate.instant('SLIDE_EDITOR.WIDTH_SIZE.NARROW') },
            { key: 'REGULAR', value: this.translate.instant('SLIDE_EDITOR.WIDTH_SIZE.REGULAR') },
            { key: 'WIDE', value: this.translate.instant('SLIDE_EDITOR.WIDTH_SIZE.WIDE') }
        ];
    
        this.HorizentalAlign =  [
            { key: 'LEFT', value: this.translate.instant('SLIDE_EDITOR.HORIZONTAL_ALIGN_DIRECTION.LEFT') },
            { key: 'CENTER', value: this.translate.instant('SLIDE_EDITOR.HORIZONTAL_ALIGN_DIRECTION.CENTER') },
            { key: 'RIGHT', value: this.translate.instant('SLIDE_EDITOR.HORIZONTAL_ALIGN_DIRECTION.RIGHT') }
        ];
    
        this.VerticalAlign =  [
            { key: 'TOP', value: this.translate.instant('SLIDE_EDITOR.VERTICAL_ALIGN_DIRECTION.TOP') },
            { key: 'MIDDLE', value: this.translate.instant('SLIDE_EDITOR.VERTICAL_ALIGN_DIRECTION.MIDDLE') },
            { key: 'BOTTOM', value: this.translate.instant('SLIDE_EDITOR.VERTICAL_ALIGN_DIRECTION.BOTTOM') }
        ];
    
        this.SlideDropShadowStyle = [
            { key: 'SOFT', value: this.translate.instant('SLIDE_EDITOR.SOFT') },
            { key: 'REGULAR', value: this.translate.instant('SLIDE_EDITOR.REGULAR') }
        ];

    }

    onAddNewSlideClick(e) {
        let slide = new ISlideEditor();
        this.hostObject.slides.push( slide);
        //this.pageBuilderService.addSection();
    }

    onSlideEditClick(event){
        this.showSlideEditor = true;
         //this.pageBuilderService.navigateToEditor('section', this.id);
    }

    navigateBack() {
        this.showSlideEditor = false;
    }

    onValueChange(event){

    }
}
