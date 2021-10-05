import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PepStyleType, PepSizeType, PepHorizontalAlignment, PepVerticalAlignment, PepScreenSizeType} from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
// import { PageSizeType } from '@pepperi-addons/papi-sdk';

// type UiPageSizeType = PageSizeType | 'NONE';

// export interface ISpacingOption {
//     key?: UiPageSizeType; 
//     value: string;
// }
export type HeightUnit = 'REM' | 'VH';

export type TransitionType = 'Fade' | 'Blur' | 'Dissolve' | 'Iris';
export type ArrowType = 'Two' | 'One' | 'Styled';
export type ArrowShape = 'None' | 'Rect' | 'Rounded';
export type WidthUnits = 'Narrow' | 'Regular' | 'Wide';
export type Intensity = 'Soft' | 'Regular';

export type SlideButton = {
    useButton: boolean,
    label: string,
    linkTo: string,
    style: PepStyleType
}

export type Overlay = {
    useGradientOverlay: boolean,
    color: string,
    opacity: string,
}

export type SlideImage = {
    useImage: boolean,
    src: string,
    horizontalPosition: string,
    verticalPosition: string
}

export type DropShadow = {
    useDropShadow: boolean,
    intensity:  Intensity
}


//export interface ISlideshowEditor {
export class ISlideshowEditor {
    id: string;
    heightUnit: HeightUnit = "REM";
    height: string = '300';
    innerSpacing?: PepSizeType = "md";
    isTransition: boolean = false;
    transitionDuration: number = 10;
    transitionType: TransitionType = 'Fade';
    transitionTime: string = '5';
    isUseArrows: boolean = true;
    arrowType: ArrowType = 'One';
    arrowShape: ArrowShape = 'Rect';
    arrowStyle: PepStyleType = 'regular';
    arrowColor: PepStyleType = 'weak';
    useControllers: boolean = true;
    usePauseButton: boolean = true;
    showOnMobile: boolean = true;
    useInverStyle: boolean = true;
    showControllersInSlider: boolean = true;
    controllerSize: HeightUnit
}

export interface ISlideEditor {
    id: string,
    useTitle: boolean,
    titleContent: string,
    titleSize: PepSizeType,
    useSubTitle: boolean,
    subTitleContent: string,
    subTitleSize: PepSizeType,
    contentWidth: WidthUnits,
    horizontalAlign: PepHorizontalAlignment,
    verticalAlign: PepVerticalAlignment,
    textColor: string,
    firstButton: SlideButton,
    secondButton: SlideButton,
    gradientOverlay: Overlay,
    overlay: Overlay,
    image: SlideImage,
    dropShadow: DropShadow
}

interface groupButtonArray {
    key: string; 
    value: string;
}

export interface slide {
    id: string,
    Title?: string,
}

export interface ISlideShow{
    slideshowConfig: ISlideshowEditor,
    // slides: Array<ISlideEditor>;
}

@Component({
    selector: 'slideshow-editor',
    templateUrl: './slideshow-editor.component.html',
    styleUrls: ['./slideshow-editor.component.scss']
})
export class SlideshowEditorComponent implements OnInit {
    
    @ViewChild('availableSlidesContainer', { read: ElementRef }) availableBlocksContainer: ElementRef;

    // @Input() slidesDropList = []; 
    
    //private hostObject: ISlideShow;
    // @Input() 
    // set hostObject(value: ISlideShow) {
    //     this._hostObject = value;
    // }
    // get hostObject(): ISlideShow {
    //     return this._hostObject;
    // }

    @Output() hostObjectChange: EventEmitter<ISlideShow> = new EventEmitter<ISlideShow>();
    
    hostObject: ISlideShow = { slideshowConfig: new ISlideshowEditor()};
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
        this.hostObject.slideshowConfig = new ISlideshowEditor();
        debugger;
    }

    private updateHostObject() {
        this.hostObject.slideshowConfig = this.slideShowConfig;
        this.hostObjectChange.emit(this.hostObject);
    }


    onSlideshowFieldChange(key, event){
        switch(key){
            case 'heightUnits': {
                this.slideShowConfig.heightUnit = event.source.key;
                break;
            }
            case 'height':{
                this.slideShowConfig.height = event;
                break;
            }
            case 'innerspacing': {
                this.slideShowConfig.innerSpacing = event.source.key;
                break;
            }
            case 'duration':{
                this.slideShowConfig.transitionDuration = event;
                break;
            }
            case 'isTransition':{
                
                this.slideShowConfig.isTransition = event;
                break;
            } 
            case 'transitionType':{
                this.slideShowConfig.transitionType = event;
                break;
            } 
            case 'transitionTime':{
                this.slideShowConfig.transitionTime = event;
                break;
            } 
            case 'useArrows':{
                this.slideShowConfig.isUseArrows = event;
                break;
            } 
            case 'arrowType':{
                this.slideShowConfig.arrowType = event.source.key;
                break;
            } 
            case 'arrowShape':{
                this.slideShowConfig.arrowShape = event.source.key;
                break;
            } 
            case 'arrowsStyle':{
                this.slideShowConfig.arrowStyle = event;
                break;
            } 
            case 'arrowsColor':{
                this.slideShowConfig.arrowColor = event;
                break;
            } 
            case 'useControllers':{
                this.slideShowConfig.useControllers = event;
                break;
            } 
            case 'usePauseBtn':{
                this.slideShowConfig.usePauseButton = event;
                break;
            } 
            case 'showOnMobile':{
                this.slideShowConfig.showOnMobile = event;
                break;
            } 
            case 'useInverStyle':{
                this.slideShowConfig.useInverStyle = event;
                break;
            } 
            case 'showControllersInSlider':{
                this.slideShowConfig.showControllersInSlider = event;
                break;
            } 
            
        }
        this.updateHostObject();
    }

    onIsTransitionChange(value: boolean) {
        this.slideShowConfig.isTransition = value;
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

  

    onAddContentClick(e) {
        //this.pageBuilderService.addSection();
    }

    onDragStart(event: CdkDragStart) {
        //this.pageBuilderService.changeCursorOnDragStart();
    }

    onDragEnd(event: CdkDragEnd) {
        //this.pageBuilderService.changeCursorOnDragEnd();
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
