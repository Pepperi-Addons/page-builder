import { GenericListModule } from './../generic-list/generic-list.module';
import { Component, OnInit, Renderer2 } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { Observable } from "rxjs";

export enum Page_Type { "Homepage" = 1, "Dashbaord" = 2, "Item" = 3, "Generic" = 4, "None" = 5 };

export class pageType {
    title: string = '';
    isExpanded: boolean = false;
    pages: Array<TempPage> = [];
}
export class TempPage {
    name: string = '';
    description: string = '';
    type: Page_Type = Page_Type.None;

}

@Component({
    selector: 'pages-manager',
    templateUrl: './pages-manager.component.html',
    styleUrls: ['./pages-manager.component.scss']
})

export class PagesManagerComponent implements OnInit {

    mainMenuItems: Array<PepMenuItem> = null;
    secondaryMenuItems: Array<PepMenuItem> = null;
    isAddNewPage = false;

    tempPages: Array<TempPage> = [{name: "Pages_AddNew_Blank" , description: 'Pages_AddNew_Blank_Desc', type: Page_Type.Homepage},
                                  {name: 'Pages_AddNew_Gridy' , description: 'Pages_AddNew_Gridy_Desc', type: Page_Type.Homepage},
                                  {name: 'Pages_AddNew_Simplistic' , description: 'Pages_AddNew_Simplistic_Desc', type: Page_Type.Homepage},
                                  {name: 'Pages_AddNew_Branded' , description: 'Pages_AddNew_Branded_Desc', type: Page_Type.Homepage}];

    pageTypes: Array<pageType> = [{ title: "Pages_AddNew_HomePage", isExpanded: true, pages: this.tempPages},
                                  { title: "Pages_AddNew_Dashboard", isExpanded: false, pages: this.tempPages},
                                  { title: "Pages_AddNew_Item", isExpanded: false, pages: this.tempPages},
                                  { title: "Pages_AddNew_Generic", isExpanded: false, pages: this.tempPages}];

    dataSource$: Observable<any[]>

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService
    ) {

    }

    ngOnInit() {
        this.mainMenuItems = this.secondaryMenuItems = [];
    }

    addNewPage() {
        this.isAddNewPage = true;
    }

    onMainMenuItemClicked(event: IPepMenuItemClickEvent){

    };

    onSecondaryMenuItemClicked(event: IPepMenuItemClickEvent){

    };

    togglePanel(page: pageType){
        page.isExpanded = !page.isExpanded
    }

    navigateBackToMainPage(){
        this.isAddNewPage = false;
    }


}
