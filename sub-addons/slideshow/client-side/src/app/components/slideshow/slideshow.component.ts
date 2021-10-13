import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { SlideshowService } from './index';
import { ISlideEditor, ISlideShow, ISlideshowEditor } from '../slideshow.model';
import { NgtscCompilerHost } from '@angular/compiler-cli/src/ngtsc/file_system';


@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss'],
  providers: [TranslatePipe]
})

export class SlideshowComponent implements OnInit {
    @ViewChild('mainSlideCont', { static: true }) slideContainer: ElementRef;
    screenSize: PepScreenSizeType;

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

    public slideIndex = 0;

    constructor(
        public addonService: SlideshowService,
        public layoutService: PepLayoutService,
        public translate: TranslateService
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

    }
    
    private getDefaultHostObject(): ISlideShow {
        return { slideshowConfig: new ISlideshowEditor(), slides: Array<ISlideEditor>() };
    }

    private raiseBlockLoadedEvent() {
        this.hostEvents.emit({action: 'block-loaded'});
    }
    
    ngOnInit() {
        //this.hostObject.slideshowConfig.editSlideIndex = "-1"; // TODO - NEED TO THINK ABOUT A BETTER SOLUTION
        this.raiseBlockLoadedEvent();
        this.showSlides();
    }

    showSlides() {

        var slides = this.hostObject.slides; 
        //var dots = document.getElementsByClassName("dot");
        if (this.slideIndex >= slides.length) {this.slideIndex = 0}
        //if (this.slideIndex < 1) {this.slideIndex = slides.length}
        
        
        var that = this;
        setTimeout(function(){that.slideIndex ++; that.showSlides() }, 3000);
      }




}
