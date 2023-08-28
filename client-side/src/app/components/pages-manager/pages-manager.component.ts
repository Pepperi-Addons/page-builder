import { NavigationService } from './../../services/navigation.service';
import { PagesService } from '../../services/pages.service';
// import { DIMXService } from '../../services/dimx.service';
import { AfterViewInit, Component, OnInit, Renderer2, ViewChild, ViewContainerRef } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, IPepGenericListEmptyState } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { DataViewFieldType, GridDataViewField, Page } from '@pepperi-addons/papi-sdk';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { IPepFormFieldClickEvent } from '@pepperi-addons/ngx-lib/form';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { ActivatedRoute, Router } from '@angular/router';
import { PageRowProjection, PAGES_TABLE_NAME } from 'shared';
import { PepAddonBlockLoaderService } from '@pepperi-addons/ngx-lib/remote-loader';

export type TempPageType = 'homepage' | 'dashbaord' | 'item' | 'generic' | 'none';

export class pageGroup {
    title: string = '';
    isExpanded: boolean = false;
    pages: Array<TempPage> = [];
}
export class TempPage {
    // id: number = 0;
    type: TempPageType = 'none';
    name: string = '';
}

@Component({
    selector: 'pages-manager',
    templateUrl: './pages-manager.component.html',
    styleUrls: ['./pages-manager.component.scss'],
    // providers: [DIMXService]
})
export class PagesManagerComponent implements OnInit {
    // private readonly IMPORT_KEY = 'import';
    
    // private selectedPageID = '';
    // mainMenuItems: Array<PepMenuItem> = null;
    totalPages: number = 0;
    // pages: PageRowProjection[];

    secondaryMenuItems: Array<PepMenuItem> = null;
    isAddNewPage = false;
    softLimitPagesNumber = 100;
    // pagesDataSource: IPepGenericListDataSource;
    
    emptyState: IPepGenericListEmptyState = {
        show: true
    };

    tempPages: Array<TempPage> = [
        { type: 'homepage', name: 'blank'}/*,
        { type: 'homepage', name: 'gridy'},
        { type: 'homepage', name: 'simplistic'},
        { type: 'homepage', name: 'branded'}*/
    ];
    
    pageGroups: Array<pageGroup> = [{ title: "PAGES_MANAGER.ADD_NEW.TEMPLATES.GROUPS.HOMEPAGE", isExpanded: true, pages: this.tempPages}
    //                               ,{ title: "PAGES_MANAGER.ADD_NEW.TEMPLATES.GROUPS.DASHBOARD", isExpanded: false, pages: this.tempPages},
    //                               { title: "PAGES_MANAGER.ADD_NEW.TEMPLATES.GROUPS.ITEM", isExpanded: false, pages: this.tempPages},
    //                               { title: "PAGES_MANAGER.ADD_NEW.TEMPLATES.GROUPS.GENERIC", isExpanded: false, pages: this.tempPages}

    ];
    protected configurationHostObject: any = null;
    protected remoteEntry = ''; //'http://localhost:4401/file_84c999c3-84b7-454e-9a86-71b7abc96554.js';
    // public imagesPath = '';

    constructor (
        private translate: TranslateService,
        private navigationService: NavigationService,
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,
        // private dimxService: DIMXService,
        private dialog: PepDialogService,
        private viewContainerRef: ViewContainerRef,
        private activatedRoute: ActivatedRoute,
        private addonBlockLoaderService: PepAddonBlockLoaderService
    ) {
 
        this.translate.get(['PAGES_MANAGER.NO_PAGES_MSG', 'PAGES_MANAGER.PAGES_HEADER']).subscribe(res => {
            
            this.emptyState = {
                show: true,
                description: res?.length > 0 ? res[0] : this.translate.instant('PAGES_MANAGER.NO_PAGES_MSG'),
                title: res?.length > 1 ? res[1] : this.translate.instant('PAGES_MANAGER.PAGES_HEADER'),
            }
        })
        
        this.pepAddonService.setShellRouterData({ showSidebar: true, addPadding: true});

        // this.dimxService.register(this.viewContainerRef, this.onDIMXProcessDone.bind(this));
        // this.imagesPath = this.pepAddonService.getAddonStaticFolder(this.navigationService.addonUUID) + 'assets/images/';
        // this.pagesDataSource = this.setDataSource();
    }

    // private getRegularReadOnlyColumn(columnId: string, columnType: DataViewFieldType = 'TextBox'): GridDataViewField {
    //     return {
    //         FieldID: columnId,
    //         Type: columnType,
    //         Title: this.translate.instant(`PAGES_MANAGER.GRID_HEADER_${columnId.toUpperCase()}`),
    //         Mandatory: false,
    //         ReadOnly: true
    //     }
    // }

    // private setDataSource() {
    //     return {
    //         init: async (params) => {
    //             //this.pagesList = this.pagesService.getPages(this.navigationService.addonUUID, null);
    //                 let options = 'order_by=';

    //                 if (params.sorting) {
    //                     options += `${params.sorting.sortBy} ${params.sorting?.isAsc ? 'ASC' : 'DESC'}`;
    //                 } else {
    //                     options += 'Name ASC';
    //                 }
    //                 if (params.searchString?.length > 0) {
    //                     options += `&where=${params.searchString}`;
    //                 }
                    
    //                 this.pages = await this.pagesService.getPages(this.navigationService.addonUUID, encodeURI(options)).toPromise().then((pages) => {
    //                     return pages; 
    //                 });

    //                 this.totalPages = this.pages.length;

    //                 return {
    //                     items:  this.pages,
    //                             totalCount: this.pages.length, 
    //                             dataView: {
    //                                 Context: {
    //                                     Name: '',
    //                                     Profile: { InternalID: 0 },
    //                                     ScreenSize: 'Landscape'
    //                                 },
    //                                 Type: 'Grid',
    //                                 Title: '',
    //                                 Fields: [
    //                                     this.getRegularReadOnlyColumn('Name','Link'),
    //                                     this.getRegularReadOnlyColumn('Description'),
    //                                     this.getRegularReadOnlyColumn('CreationDate', 'DateAndTime'),
    //                                     this.getRegularReadOnlyColumn('ModificationDate', 'DateAndTime'),
    //                                     this.getRegularReadOnlyColumn('Draft', 'Boolean'),
    //                                     this.getRegularReadOnlyColumn('Published', 'Boolean'),
    //                                     // this.getRegularReadOnlyColumn('Status')
    //                                 ],
    //                                 Columns: [   
    //                                     { Width: 15 },
    //                                     { Width: 25 },
    //                                     { Width: 20 },
    //                                     { Width: 20 },
    //                                     { Width: 8 },
    //                                     { Width: 12}
    //                                 ],
    //                                 FrozenColumnsCount: 0,
    //                                 MinimumColumnWidth: 0
    //                             }
    //                 } as IPepGenericListInitData;
    //         }
    //     }
    // } 

    // actions: IPepGenericListActions = {        
    //     get: async (data: PepSelectionData) => {
    //         if (data?.rows.length === 1 ) {
    //             return [{
    //                     title: this.translate.instant("ACTIONS.EDIT"),
    //                     handler: async (data: PepSelectionData) => {
    //                         this.navigationService.navigateToPage([data?.rows[0]].toString());
    //                     }
    //                 // }, {
    //                 //     title: this.translate.instant("ACTIONS.EXPORT"),
    //                 //     handler: async (data: PepSelectionData) => {
    //                 //         const pageKey = data?.rows[0];
    //                 //         const pageName = this.pages.find(p => p.Key === pageKey)?.Name || undefined;

    //                 //         this.dimxService.export(pageKey, pageName);
    //                 //     }
    //                 }, {
    //                     title: this.translate.instant("ACTIONS.DUPLICATE"),
    //                     handler: async (data: PepSelectionData) => {
    //                         if (data?.rows.length > 0) {
    //                             this.duplicatePage(data?.rows[0]);
    //                         }
    //                     }
    //                 }, {
    //                     title: this.translate.instant("ACTIONS.DELETE"),
    //                     handler: async (data: PepSelectionData) => {
    //                         if (data?.rows.length > 0) {
    //                             this.deletePage(data?.rows[0]);
    //                         }
    //                     }
    //                 }
    //             ]
    //         } 
    //         else {
    //             return [];
    //         }
    //     }
    // }

    ngOnInit() {
        this.translate.get('PAGES_MANAGER.SECONDARY_HEADER').subscribe(title => {
            this.configurationHostObject = {
                addonUUID: this.navigationService.addonUUID,
                configurationSchemaName: PAGES_TABLE_NAME,
                title: title,
                emptyState: this.emptyState,
                // lineMenu: ConfigurationLineMenuItem[],
                // menu: ConfigurationMenuItem[],
            };
        });
    }

    onConfigurationHostEvent(event: any) {
        if (event.name === 'onListLoad') {
            this.totalPages = event.data?.totalCount || 0;
        } else if (event.name === 'onListFieldClick') {
            this.navigationService.navigateToPage(event.data?.id);
        } else if (event.name === 'onMenuItemClick') {
            if (event.action === 'add') {
                this.addNewPage();
            } else if (event.action === 'edit') {
                this.navigationService.navigateToPage(event.data?.key);
            }
        }
    }

    // onDIMXProcessDone(event:any) {
    //     this.pagesDataSource = this.setDataSource();
    //     console.log(`DIMXProcessDone: ${JSON.stringify(event)}`);
    // }

    // canAddPage(): boolean {
    //     let res = true;

    //     if (this.totalPages >= this.softLimitPagesNumber) {
    //         res = false;
    //         const content = this.translate.instant('MESSAGES.PAGES_COUNT_LIMIT_MESSAGE');
    //         const title = this.translate.instant('MESSAGES.TITLE_NOTICE');
    //         const dataMsg = new PepDialogData({
    //             title,
    //             content
    //         });

    //         this.dialog.openDefaultDialog(dataMsg);
    //     }

    //     return res;
    // }
    
    addNewPage() {
        // if (this.canAddPage()) {
            this.isAddNewPage = true;
        // }
    }

    // onMenuItemClicked(event: IPepMenuItemClickEvent = null) {
    //     const menuItem = event.source;
    //     switch(menuItem.key) {
    //         case this.IMPORT_KEY: {
    //             if (this.canAddPage()) {
    //                 this.dimxService.import();
    //             }
    //             break;
    //         }
    //     }
    // }
    
    createTemplatePage(template: TempPage) {
        const templateFileName = `${template.type}_${template.name}`
        this.pagesService.createNewPage(this.navigationService.addonUUID, templateFileName, this.totalPages).subscribe((page: Page) => {
            if (page) {
                this.navigationService.navigateToPage(page.Key);
            } else {
                // show error.
                const content = this.translate.instant('MESSAGES.FAILED_TO_CREATE_TEMPLATE');
                const title = this.translate.instant('MESSAGES.TITLE_NOTICE');
                const dataMsg = new PepDialogData({
                    title,
                    content
                });

                this.dialog.openDefaultDialog(dataMsg);
            }
            //console.log(returnedData);
        });
    }

    // duplicatePage(pageId: string) {
    //     this.pagesService.duplicatePage(this.navigationService.addonUUID, pageId).subscribe((res) => {
    //         this.pagesDataSource = this.setDataSource();
    //     });
    // }

    // deletePage(pageId: string) {
    //     const content = this.translate.instant('PAGES_MANAGER.DELETE_PAGE_MSG');
    //     const title = this.translate.instant('PAGES_MANAGER.DELETE_PAGE_DIALOG_TITLE');
    //     const dataMsg = new PepDialogData({title, actionsType: "cancel-delete", content});

    //     this.dialog.openDefaultDialog(dataMsg).afterClosed().subscribe((isDeletePressed) => {
    //         if (isDeletePressed) {
    //             this.pagesService.deletePage(this.navigationService.addonUUID, pageId).subscribe((res) => {
    //                 this.pagesDataSource = this.setDataSource();
    //             });
    //         }
    //     });
    // }

    navigateBackToMainPage() {
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

    // onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){
    //     this.navigationService.navigateToPage(fieldClickEvent.id);
    // }
}
