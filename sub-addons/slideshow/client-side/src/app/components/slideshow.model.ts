import { PepStyleType, PepSizeType, PepHorizontalAlignment, PepVerticalAlignment } from "@pepperi-addons/ngx-lib";

export type HeightUnit = 'REM' | 'VH';

export type TransitionType = 'Fade' | 'Blur' | 'Dissolve' | 'Iris';
export type ArrowType = 'Two' | 'One' | 'Styled';
export type ArrowShape = 'None' | 'Rect' | 'Rounded';
export type WidthUnits = 'Narrow' | 'Regular' | 'Wide';
export type Intensity = 'Soft' | 'Regular';

export class SlideButton {
    useButton: boolean = true;
    label: string = '1st button';
    linkTo: string = '';
    style: PepStyleType = 'regular'
}

export class Overlay {
    useGradientOverlay: boolean = false;
    color: string = '000';
    opacity: string = '1';
}

export class SlideImage {
    useImage: boolean = false;
    src: string = '';
    horizontalPosition: string = '0';
    verticalPosition: string = '0';
}

export class DropShadow {
    useDropShadow: boolean = false;
    intensity:  Intensity = 'Regular';
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
    arrowsStyle: PepStyleType = 'regular';
    arrowsColor: PepStyleType = 'weak';
    useControllers: boolean = true;
    usePauseButton: boolean = true;
    showOnMobile: boolean = true;
    useInverStyle: boolean = true;
    showControllersInSlider: boolean = true;
    controllerSize: HeightUnit
}

export class ISlideEditor {
    id: string;
    useTitle: boolean = false;
    titleContent: string = 'Title';
    titleSize: PepSizeType = 'lg';
    useSubTitle: boolean = false;
    subTitleContent: string;
    subTitleSize: PepSizeType = 'md';
    contentWidth: WidthUnits = 'Regular';
    horizontalAlign: PepHorizontalAlignment = 'left';
    verticalAlign: PepVerticalAlignment = 'middle';
    textColor: string;
    buttonsSize: PepSizeType  = 'md';
    buttonsColor: string;
    firstButton: SlideButton = new SlideButton();
    secondButton: SlideButton  = new SlideButton();
    gradientOverlay: Overlay = new Overlay();
    overlay: Overlay = new Overlay();
    image: SlideImage = new SlideImage();
    dropShadow: DropShadow = new DropShadow();
}

export interface slide {
    id: string,
    Title?: string,
}

export interface ISlideShow{
    slideshowConfig: ISlideshowEditor,
    slides: Array<ISlideEditor>
}
