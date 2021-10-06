import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import {  map, tap } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { SlideshowService, PepperiTableComponent } from './index';
import { Observable } from 'rxjs';
import { PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { ISlideEditor, ISlideShow, ISlideshowEditor } from '../slideshow.model';


@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss'],
  providers: [TranslatePipe]
})
export class SlideshowComponent implements OnInit {

    menuItems: Array<PepMenuItem> = [];
    showListActions = false;
    screenSize: PepScreenSizeType;
    options: {key:string, value:string}[] = [{key: "Option1", value: 'Option 1'},{key: "Option2", value: 'Option 2'}];
    dataSource$: Observable<any[]>
    displayedColumns = ['Name'];

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

    @ViewChild(PepperiTableComponent) table: PepperiTableComponent;


    constructor(
        public addonService: SlideshowService,
        public layoutService: PepLayoutService,
        public dialog: PepDialogService,
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
        this.dataSource$ = this.addonService.pepGet(`/items`);
        this.dataSource$.toPromise().then(res => this.raiseBlockLoadedEvent());
    }

    openDialog(){
        const content = this.translate.instant('Dialog_Body');
        const title = this.translate.instant('Dialog_Title');
        const dataMsg = new PepDialogData({title, actionsType: "close", content});
        this.dialog.openDefaultDialog(dataMsg);
    }

    ngAfterViewInit(): void {
        this.menuItems.push({key:'OpenDialog', text: 'Edit' });
    }

    onMenuItemClicked(e){

    }

    onActionsStateChanged(e){

    }




}
