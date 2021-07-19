import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import {  map, tap } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { AddonService, PepperiTableComponent } from './index';
import { Observable } from 'rxjs';
import { InstalledAddon } from '@pepperi-addons/papi-sdk';
import { PepMenuItem } from '@pepperi-addons/ngx-lib/menu';


@Component({
  selector: 'sub-addon-1',
  templateUrl: './sub-addon-1.component.html',
  styleUrls: ['./sub-addon-1.component.scss'],
  providers: [TranslatePipe]
})
export class SubAddon1Component implements OnInit {

    menuItems: Array<PepMenuItem> = [];
    showListActions = false;
    screenSize: PepScreenSizeType;
    options: {key:string, value:string}[] = [{key: "Option1", value: 'Option 1'},{key: "Option2", value: 'Option 2'}];
    dataSource$: Observable<any[]>
    displayedColumns = ['Name'];
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(PepperiTableComponent) table: PepperiTableComponent;


    constructor(
        public addonService: AddonService,
        public layoutService: PepLayoutService,
        public dialog: PepDialogService,
        public translate: TranslateService
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

    }

    ngOnInit(){
       this.dataSource$ = this.addonService.pepGet(`/items`)
       .pipe(tap(res => this.hostEvents.emit({action: 'addon-loaded'})));
    //    .pipe(
    //        map((addons: InstalledAddon[]) =>
    //          addons.filter(addon => addon?.Addon).map(addon => addon?.Addon))
    //     );
    }

    openDialog(){
        const content = this.translate.instant('Dialog_Body');
        const title = this.translate.instant('Dialog_Title');
        const dataMsg = new PepDialogData({title, actionsType: "close", content});
        this.dialog.openDefaultDialog(dataMsg);
    }

    ngAfterViewInit(): void {
        this.menuItems.push({key:'OpenDialog', text: 'Edit' });
        // this.hostEvents.emit({action: 'addon-loaded'});
    }

    onMenuItemClicked(e){

    }

    onActionsStateChanged(e){

    }




}
