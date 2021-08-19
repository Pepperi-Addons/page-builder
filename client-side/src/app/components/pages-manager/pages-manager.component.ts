import { GenericListModule } from './../generic-list/generic-list.module';
import { Component, OnInit, Renderer2 } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { Observable } from "rxjs";

@Component({
    selector: 'pages-manager',
    templateUrl: './pages-manager.component.html',
    styleUrls: ['./pages-manager.component.scss']
})
export class PagesManagerComponent implements OnInit {

    menuItems: Array<PepMenuItem> = null;
    dataSource$: Observable<any[]>

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService
    ) {

    }

    ngOnInit() {
        this.menuItems = [];
    }

    addNewPage() {

    }

    onMainMenuItemClicked(event: IPepMenuItemClickEvent){

    };

    onSecondaryMenuItemClicked(event: IPepMenuItemClickEvent){

    };


}
