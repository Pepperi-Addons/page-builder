import { NavigationService } from './../../services/navigation.service';
import { IPageRowModel, PagesService } from '../../services/pages.service';
import { GenericListModule } from './../generic-list/generic-list.module';
import { Component, OnInit, Renderer2 } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { from, Observable } from "rxjs";
//simcha
import { map } from 'rxjs/operators';
import { GenericListDataSource } from '../generic-list/generic-list.component';
import { GridDataViewField } from '@pepperi-addons/papi-sdk';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

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
    
    private selectedPageID = '';
    mainMenuItems: Array<PepMenuItem> = null;
    secondaryMenuItems: Array<PepMenuItem> = null;
    isAddNewPage = false;

    tempPages: Array<TempPage> = [{id: 1, name: "PAGES_MANAGER.ADDNEW_BLANK" , description: 'PAGES_MANAGER.ADDNEW_BLANK_DESC', type: Page_Type.Homepage},
                                  {id: 2, name: 'PAGES_MANAGER.ADDNEW_GRIDY' , description: 'PAGES_MANAGER.ADDNEW_GRIDY_DESC', type: Page_Type.Homepage},
                                  {id: 3, name: 'PAGES_MANAGER.ADDNEW_SIMPLISTIC' , description: 'PAGES_MANAGER.ADDNEW_SIMPLISTIC_DESC', type: Page_Type.Homepage},
                                  {id: 4, name: 'PAGES_MANAGER.ADDNEW_BRANDED' , description: 'PAGES_MANAGER.ADDNEW_BRANDED_DESC', type: Page_Type.Homepage}];

     pageGroups: Array<pageGroup> = [{ title: "PAGES_MANAGER.ADDNEW_HOMEPAGE", isExpanded: true, pages: this.tempPages}
    //                               ,{ title: "PAGES_MANAGER.ADDNEW_DASHBOARD", isExpanded: false, pages: this.tempPages},
    //                               { title: "PAGES_MANAGER.ADDNEW_ITEM", isExpanded: false, pages: this.tempPages},
    //                               { title: "PAGES_MANAGER.ADDNEW_GENERIC", isExpanded: false, pages: this.tempPages}

];

    public imagesPath = '';
    public hasPages = true;
    constructor(

        private renderer: Renderer2,
        private translate: TranslateService,
        private navigationService: NavigationService,
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,
        public dialog: PepDialogService,

    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';

    }

    private getRegularReadOnlyColumn(columnId: string): GridDataViewField {
        return {
            FieldID: columnId,
            Type: 'TextBox',
            Title: this.translate.instant(`PAGES_MANAGER.GRID_HEADER_${columnId.toUpperCase()}`),
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
                    { Width: 15 },
                    { Width: 30 },
                    { Width: 20 },
                    { Width: 20 },
                    { Width: 15}
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
            }
        },

        getActions: async (objs) => {
            this.selectedPageID = objs[0].Key;
            return objs.length ? [
                {
                    title: this.translate.instant("ACTIONS.EDIT"),
                    handler: async (objs) => {
                        this.navigationService.navigateToPage([objs[0].Key].toString());
                    }
                },{
                    title: this.translate.instant("ACTIONS.EXPORT"),
                    handler: async (objs) => {
                        // TODO - ADD EXPORT PAGES CALL
                        //this.pagesService.exportPage([objs[0].Key].toString());
                    }
                },
                {
                    title: this.translate.instant("ACTIONS.DELETE"),
                    handler: async (objs) => {
                        this.deletePage([objs[0].Key].toString());
                    }
                }
            ] : []
        }
    }

    ngOnInit() {
        this.mainMenuItems = new Array<PepMenuItem>();
        this.mainMenuItems.push({
            key: 'import',
            text: this.translate.instant('ACTIONS.IMPORT')
            // ,disabled: this.selectedPageID == ''
        }
        );
    }

    addNewPage() {
        this.isAddNewPage = true;
    }

    onMenuItemClicked(event: IPepMenuItemClickEvent = null){
        const menuItem = event.source;
        switch(menuItem.key){
            case 'export': {
                //this.pagesService.exportPage(this.selectedPageID == '');
                break;
            }
            case 'import': {
                break;
            }
        } 
    };

    createTemplatePage(template: TempPage  ){
        this.pagesService.createNewPage(this.navigationService.addonUUID, template.id).subscribe(returnedData => {
            this.navigationService.navigateToPage('1');
            //console.log(returnedData);
        });


    }

    deletePage(pageId: string){
        const content = this.translate.instant('PAGES_MANAGER.DELETE_PAGE_MSG');
        const title = this.translate.instant('PAGES_MANAGER.DELETE_PAGE_DIALOG_TITLE');
        const dataMsg = new PepDialogData({title, actionsType: "cancel-delete", content});

        this.dialog.openDefaultDialog(dataMsg).afterClosed().subscribe((isDeletePressed) => {
            if (isDeletePressed) {
                this.pagesService.deletePage(this.navigationService.addonUUID, pageId);
            }
        });

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
