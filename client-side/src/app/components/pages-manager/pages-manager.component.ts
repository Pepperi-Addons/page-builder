import { NavigationService } from './../../services/navigation.service';
import { IPageRowModel, PagesService } from '../../services/pages.service';
import { AfterViewInit, Component, OnInit, Renderer2, ViewChild } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, PepGenericListService } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { DataViewFieldType, GridDataViewField, Page } from '@pepperi-addons/papi-sdk';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { IPepFormFieldClickEvent } from '@pepperi-addons/ngx-lib/form';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';

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
    // mainMenuItems: Array<PepMenuItem> = null;
    totalPages: 0;
    secondaryMenuItems: Array<PepMenuItem> = null;
    isAddNewPage = false;
    softLimitPagesNumber = 100;
    pagesDataSource: IPepGenericListDataSource;

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

    constructor (
        private renderer: Renderer2,
        private translate: TranslateService,
        private navigationService: NavigationService,
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,
        public dialog: PepDialogService,

    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';
        this.pagesDataSource = this.setDataSource(); 

    }

    private getRegularReadOnlyColumn(columnId: string, columnType: DataViewFieldType = 'TextBox'): GridDataViewField {
        return {
            FieldID: columnId,
            Type: columnType,
            Title: this.translate.instant(`PAGES_MANAGER.GRID_HEADER_${columnId.toUpperCase()}`),
            Mandatory: false,
            ReadOnly: true
        }
    }

    private setDataSource() {
        return {
            init: async (params) => {
                //this.pagesList = this.pagesService.getPages(this.navigationService.addonUUID, null);
                    //this.hasPages = !pages || pages.length < 1 ? false : true;
                    let options = 'order_by=';

                    if (params.sorting) {
                        options += `${params.sorting.sortBy} ${params.sorting?.isAsc ? 'ASC' : 'DESC'}`;
                    } else {
                        options += 'Name ASC';
                    }
                    if (params.searchString?.length > 0) {
                        options += `&where=${params.searchString}`;
                    }
                    
                    const pageList: any = await this.pagesService.getPages(this.navigationService.addonUUID, encodeURI(options)).toPromise().then((pages) => {
                        return pages; 
                    });

                    this.totalPages = pageList.length;

                    return {
                        items:  pageList,
                                totalCount: pageList.length, 
                                dataView: {
                                    Context: {
                                        Name: '',
                                        Profile: { InternalID: 0 },
                                        ScreenSize: 'Landscape'
                                    },
                                    Type: 'Grid',
                                    Title: '',
                                    Fields: [
                                        this.getRegularReadOnlyColumn('Name','Link'),
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
                    } as IPepGenericListInitData;
            }
        }
    } 

    actions: IPepGenericListActions = {        
        get: async (data: PepSelectionData) => {
            if (data?.rows.length === 1 ) {
                return [{
                        title: this.translate.instant("ACTIONS.EDIT"),
                        handler: async (data: PepSelectionData) => {
                            this.navigationService.navigateToPage([data?.rows[0]].toString());
                        }
                        },{
                            title: this.translate.instant("ACTIONS.EXPORT"),
                            handler: async (data: PepSelectionData) => {
                                // TODO - ADD EXPORT PAGES CALL
                                //this.pagesService.exportPage([data?.rows[0]].toString());
                            }
                        },
                        {
                            title: this.translate.instant("ACTIONS.DELETE"),
                            handler: async (data: PepSelectionData) => {
                                if (data?.rows.length > 0) {
                                    this.deletePage(data?.rows[0]);
                                }
                            }
                        }
                    ]
            } 
            else {
                return [];
            }
        }
    }

    ngOnInit() {
        
    }

    canAddPage(): boolean {
        let res = true;

        if (this.totalPages >= this.softLimitPagesNumber) {
            res = false;
            const content = this.translate.instant('MESSAGES.PAGES_COUNT_LIMIT_MESSAGE');
            const title = this.translate.instant('MESSAGES.TITLE_NOTICE');
            const dataMsg = new PepDialogData({
                title,
                content
            });

            this.dialog.openDefaultDialog(dataMsg);
        }

        return res;
    }
    
    addNewPage() {
        if (this.canAddPage()) {
            this.isAddNewPage = true;
        }
    }

    onMenuItemClicked(event: IPepMenuItemClickEvent = null) {
        const menuItem = event.source;
        switch(menuItem.key){
            case 'export': {
                //this.pagesService.exportPage(this.selectedPageID == '');
                break;
            }
            case 'import': {
                if (this.canAddPage()) {
                    // TODO:
                }
                break;
            }
        } 
    };

    createTemplatePage(template: TempPage) {
        this.pagesService.createNewPage(this.navigationService.addonUUID, template.id, this.totalPages).subscribe((page: Page) => {
            if (page) {
                this.navigationService.navigateToPage(page.Key);
            } else {
                // TODO: show error.
            }
            //console.log(returnedData);
        });
    }

    deletePage(pageId: string) {
        const content = this.translate.instant('PAGES_MANAGER.DELETE_PAGE_MSG');
        const title = this.translate.instant('PAGES_MANAGER.DELETE_PAGE_DIALOG_TITLE');
        const dataMsg = new PepDialogData({title, actionsType: "cancel-delete", content});

        this.dialog.openDefaultDialog(dataMsg).afterClosed().subscribe((isDeletePressed) => {
            if (isDeletePressed) {
                this.pagesService.deletePage(this.navigationService.addonUUID, pageId).subscribe((res) => {
                    this.pagesDataSource = this.setDataSource();
                });
            }
        });
    }

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

    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){
        this.navigationService.navigateToPage(fieldClickEvent.id);
    }
}
