import { NavigationService } from './../../services/navigation.service';
import { IPageRowModel, PagesService } from '../../services/pages.service';
import { GenericListModule } from './../generic-list/generic-list.module';
import { Component, OnInit, Renderer2 } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { from, Observable } from "rxjs";

import { map } from 'rxjs/operators';
import { GenericListDataSource } from '../generic-list/generic-list.component';
import { GridDataViewField } from '@pepperi-addons/papi-sdk';

export enum Page_Type { "Homepage" = 1, "Dashbaord" = 2, "Item" = 3, "Generic" = 4, "None" = 5 };

export class pageGroup {
    title: string = '';
    isExpanded: boolean = false;
    pages: Array<TempPage> = [];
}
export class TempPage {
    name: string = '';
    description: string = '';
    id: number = 0;
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

    tempPages: Array<TempPage> = [{id: 1, name: "Pages_AddNew_Blank" , description: 'Pages_AddNew_Blank_Desc', type: Page_Type.Homepage},
                                  {id: 2, name: 'Pages_AddNew_Gridy' , description: 'Pages_AddNew_Gridy_Desc', type: Page_Type.Homepage},
                                  {id: 3, name: 'Pages_AddNew_Simplistic' , description: 'Pages_AddNew_Simplistic_Desc', type: Page_Type.Homepage},
                                  {id: 4, name: 'Pages_AddNew_Branded' , description: 'Pages_AddNew_Branded_Desc', type: Page_Type.Homepage}];

     pageGroups: Array<pageGroup> = [{ title: "Pages_AddNew_HomePage", isExpanded: true, pages: this.tempPages}
    //                               ,{ title: "Pages_AddNew_Dashboard", isExpanded: false, pages: this.tempPages},
    //                               { title: "Pages_AddNew_Item", isExpanded: false, pages: this.tempPages},
    //                               { title: "Pages_AddNew_Generic", isExpanded: false, pages: this.tempPages}

];

    public imagesPath = '';
    public hasPages = true;
    constructor(

        private renderer: Renderer2,
        private translate: TranslateService,
        private navigationService: NavigationService,
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,

    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';

    }

    private getRegularReadOnlyColumn(columnId: string): GridDataViewField {
        return {
            FieldID: columnId,
            Type: 'TextBox',
            Title: this.translate.instant(columnId),
            Mandatory: false,
            ReadOnly: true
        }
    }

    pagesDataSource: GenericListDataSource = {
        getList: (options) => {
            const res: Promise<IPageRowModel[]> = this.pagesService.getPages(this.navigationService.addonUUID, options).toPromise().then((pages) => {
                this.hasPages = !pages || pages.length < 1 ? false : true;
                return pages.map(page => ({
                    Key: page.Key,
                    Name: page.Name,
                    Description: page.Description,
                    CreationDate: page.CreationDate,
                    ModificationDate: page.ModificationDate,
                    Status: page.Status
                }));
            });

            return res;
        },

        getDataView: async () => {
            return {
                Context: {
                    Name: '',
                    Profile: { InternalID: 0 },
                    ScreenSize: 'Landscape'
                },
                Type: 'Grid',
                Title: '',
                Fields: [
                    this.getRegularReadOnlyColumn('Name'),
                    this.getRegularReadOnlyColumn('Description'),
                    this.getRegularReadOnlyColumn('CreationDate'),
                    this.getRegularReadOnlyColumn('ModificationDate'),
                    this.getRegularReadOnlyColumn('Status')
                ],
                Columns: [
                    { Width: 20 },
                    { Width: 20 },
                    { Width: 20 },
                    { Width: 20 },
                    { Width: 20 }
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
            }
        },

        getActions: async (objs) => {
            return objs.length ? [
                {
                    title: this.translate.instant("Edit"),
                    handler: async (objs) => {
                        this.navigationService.navigateToPage([objs[0].Key].toString());
                    }
                }
            ] : []
        }
    }

    ngOnInit() {
        // TODO - NEED TO INITLIZE THE MENUS
        this.mainMenuItems = this.secondaryMenuItems = [];

        // TODO - NEED TO CHANGE TO GET PAGES CALL.
        /*this.dataSource$*/
        //let pages = this.pagesService.getPages(this.navigationService.addonUUID);
    //    this.pagesService.getPages(this.navigationService.addonUUID).subscribe(returnedData => {
    //         console.log(returnedData);
    //     });

    }

    addNewPage() {
        this.isAddNewPage = true;
    }

    onMainMenuItemClicked(event: IPepMenuItemClickEvent){

    };

    onSecondaryMenuItemClicked(event: IPepMenuItemClickEvent){

    };

    createTemplatePage(template: TempPage  ){
        this.pagesService.createNewPage(this.navigationService.addonUUID, template.id).subscribe(returnedData => {
            console.log(returnedData);
        });

        //this.navigationService.navigateToPage('1');
    }

    navigateBackToMainPage(){
        this.isAddNewPage = false;
    }

    openLink(link: string) {
        let url = 'https://www.pepperi.com/';
        switch (link) {
            case 'Using': {
                    url = 'https://support.pepperi.com/hc/en-us/categories/200185656-Getting-Started-with-Pepperi-Do-these-steps-first-';
                    break;
            }
        }

    }


}
