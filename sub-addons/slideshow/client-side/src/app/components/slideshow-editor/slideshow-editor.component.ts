import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PepStyleType, PepSizeType, PepHorizontalAlignment, PepVerticalAlignment} from '@pepperi-addons/ngx-lib';
// import { PageSizeType } from '@pepperi-addons/papi-sdk';

// type UiPageSizeType = PageSizeType | 'NONE';

// export interface ISpacingOption {
//     key?: UiPageSizeType; 
//     value: string;
// }
export type HeightUnit = 'REM' | 'VH';

export type TransitionType = 'Fade' | 'Blur' | 'Dissolve' | 'Iris';
export type ArrowType = '>>' | '>' | '-->';
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

export interface ISlideshowEditor {
    id: string,
    heightUnit?: HeightUnit,
    height: string,
    innerSpacing?: PepSizeType,
    isTransition: boolean,
    transitionDuration: number,
    transitionType?: TransitionType,
    transitionTime: string,
    isUseArrows: boolean,
    arrowType: ArrowType,
    arrowShape: ArrowShape,
    arrowStyle: PepStyleType,
    arrowColor: PepStyleType,
    isControllers: boolean,
    usePauseButton: boolean,
    showOnMobile: boolean,
    inverStyle: boolean,
    showControllersInSlider: boolean,
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

@Component({
    selector: 'slideshow-editor',
    templateUrl: './slideshow-editor.component.html',
    styleUrls: ['./slideshow-editor.component.scss']
})
export class SlideshowEditorComponent implements OnInit {
    
    @ViewChild('availableSlidesContainer', { read: ElementRef }) availableBlocksContainer: ElementRef;
    @Input() slidesDropList = []; 
    availableSlides: Array<slide> = [{id: '1', Title: "Slide1"},{id: '2', Title: "Slide2"}];

    HeightUnitsType: Array<groupButtonArray>;
    InnerSpacing: Array<groupButtonArray>;
    ArrowsType: Array<groupButtonArray>;
    ArrowButtons: Array<groupButtonArray>;
    ControllerSize: Array<groupButtonArray>;
    
    SlideTitleSize:Array<groupButtonArray>;
    SlideSubTitleSize: Array<groupButtonArray>;
    WidthSize: Array<groupButtonArray>;
    HorizentalAlign: Array<groupButtonArray>;
    VerticalAlign: Array<groupButtonArray>;
    SlideDropShadowStyle: Array<groupButtonArray>;

    showSlideEditor = false;
    isTransition = true;
    useArrows = true;

    slideshowHeight: '100';
    
   

    showSlideTitle = false;
    slideContent = '';
    showSubTitle = false;
    showFirstButton = false;
    showSecondButton = false;
    useGradientOverlay = false;
    useOverlay = false;
    hasImage = true;
    useDropShadow = false;
    

    constructor(
        private translate: TranslateService
        // private utilitiesService: PepUtilitiesService
    ) { 

    }

    async ngOnInit(): Promise<void> {
        const desktopTitle = await this.translate.get('PAGE_MANAGER.DESKTOP').toPromise();


        this.HeightUnitsType = [
            { key: 'REM', value: this.translate.instant('SLIDESHOW.HEIGHTUNITS_REM') },
            { key: 'VH', value: this.translate.instant('SLIDESHOW.HEIGHTUNITS_VH') }
        ];
    
        this.InnerSpacing = [
            { key: 'SM', value: this.translate.instant('GROUP_SIZE.SM') },
            { key: 'MD', value: this.translate.instant('GROUP_SIZE.MD') }
        ];
    
        this.ArrowsType = [
            { key: 'TWO', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.TWO_ARROWS') },
            { key: 'ONE', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.ONE_ARROW') },
            { key: 'STYLED', value: this.translate.instant('SLIDESHOW.ARROW_TYPE.STYLED_ARROW') },
        ];
    
        this.ArrowButtons = [
            { key: 'NONE', value: this.translate.instant('GROUP_SIZE.NONE') },
            { key: 'RECT', value: this.translate.instant('SLIDESHOW.ARROW_BUTTON.RECT') },
            { key: 'ROUNDED', value: this.translate.instant('SLIDESHOW.ARROW_BUTTON.ROUNDED') }
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

    onSlideshowHeightChange(event){
        
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
        debugger;
    }

    onValueChange(event){

    }
}
