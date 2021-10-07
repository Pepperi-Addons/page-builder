// import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import {  map, tap } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType, PepSizeType, PepStyleType } from '@pepperi-addons/ngx-lib';
import { SlideshowService } from './index';
import { Observable } from 'rxjs';
import { ISlideEditor, ISlideShow, ISlideshowEditor } from '../slideshow.model';


@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss'],
  providers: [TranslatePipe]
})
export class SlideshowComponent implements OnInit {

    screenSize: PepScreenSizeType;
    //mainTitleSize: string;
    //subTitleSize: string;

    //dataSource$: Observable<any[]>

    // @Input() hostObject: any;
    // @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
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

    // @ViewChild(PepperiTableComponent) table: PepperiTableComponent;


    constructor(
        public addonService: SlideshowService,
        public layoutService: PepLayoutService,
        // public dialog: PepDialogService,
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
        //this.mainTitleSize = this.getTitleFontClass(this.hostObject.slides[0].titleSize);
        //this.subTitleSize = this.getTitleFontClass(this.hostObject.slides[0].subTitleSize);
        //this.dataSource$ = this.addonService.pepGet(`/items`);
        //this.dataSource$.toPromise().then(res => this.raiseBlockLoadedEvent());
    }

    

    ngAfterViewInit(): void {
        
    }

    onMenuItemClicked(e){

    }

    onActionsStateChanged(e){

    }




}
