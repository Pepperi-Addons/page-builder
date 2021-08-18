import { Component, OnInit, Renderer2 } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';

@Component({
    selector: 'pages-manager',
    templateUrl: './pages-manager.component.html',
    styleUrls: ['./pages-manager.component.scss']
})
export class PagesManagerComponent implements OnInit {

    menuItems: Array<PepMenuItem> = null;

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
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
