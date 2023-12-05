import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild, ViewContainerRef } from "@angular/core";
import { PepAddonService, PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';
import { pepIconDeviceDesktop, pepIconDeviceMobile, pepIconDeviceTablet } from '@pepperi-addons/ngx-lib/icon';
import { TranslateService } from '@ngx-translate/core';
import { DataViewScreenSize, Page, PageBlock, PageSection } from '@pepperi-addons/papi-sdk';
import { IEditor, PagesService, IPageEditor, ISectionEditor } from '../../services/pages.service';
import { DIMXService } from '../../services/dimx.service';
import { NavigationService } from '../../services/navigation.service';
import { IPepSideBarStateChangeEvent } from '@pepperi-addons/ngx-lib/side-bar';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { UtilitiesService } from 'src/app/services/utilities.service';
import { PepSnackBarData, PepSnackBarService } from "@pepperi-addons/ngx-lib/snack-bar";
import { WebComponentWrapperOptions } from "@angular-architects/module-federation-tools";
import { coerceNumberProperty } from "@angular/cdk/coercion";
import { PepDialogActionButton, PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { BaseDestroyerComponent } from "../base/base-destroyer.component";

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss', './page-manager.component.theme.scss'],
    providers: [DIMXService]
})
export class PageManagerComponent extends BaseDestroyerComponent implements OnInit {
    @ViewChild('pageBuilderWrapper', { static: true }) pageBuilderWrapper: ElementRef;
    
    private readonly RESTORE_TO_LAST_PUBLISH_KEY = 'restore';
    private readonly IMPORT_KEY = 'import';
    private readonly EXPORT_KEY = 'export';
    readonly MIN_PERCENTAGE_TO_SHOW_LIMIT = 80;

    lockScreen = false;
    previewMode = false;
    currentEditor: IEditor;
    sectionsColumnsDropList = [];

    viewportWidth: number;
    screenTypes: Array<PepButton>;

    private _selectedScreenType: DataViewScreenSize;
    set selectedScreenType(value: DataViewScreenSize) {
        this._selectedScreenType = value;
        this.setCurrentEditor();
    }
    get selectedScreenType(): DataViewScreenSize {
        return this._selectedScreenType;
    }

    screenSize: PepScreenSizeType;
    menuItems: Array<PepMenuItem>;
    // pageSize: number = 0;
    pageSizeLimitInPercentage: number = 0;
    isOverPageSizeLimit = false;
    currentPage: Page;

    onBlockEditorHostEventsCallback: (event: CustomEvent) => void;

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private dialogService: PepDialogService,
        private pepAddonService: PepAddonService,
        private layoutService: PepLayoutService,
        private pagesService: PagesService,
        private utilitiesService: UtilitiesService,
        public navigationService: NavigationService,
        private viewContainerRef: ViewContainerRef,
        private dimxService: DIMXService,
    ) {
        super();
        this.pepAddonService.setShellRouterData({ showSidebar: false, addPadding: false});
        this.dimxService.register(this.viewContainerRef, this.onDIMXProcessDone.bind(this));
        this.onBlockEditorHostEventsCallback = (event: CustomEvent) => {
            this.onBlockEditorHostEvents(event.detail);
        }
    }

    private setCurrentEditor(): void {
        if (this.currentEditor?.type === 'block') {
            this.currentEditor = this.pagesService.getBlockEditor(this.currentEditor.id);
        }
    }

    private setScreenWidth(screenType: DataViewScreenSize) {
        this.pagesService.setScreenWidth(screenType);
    }

    private updateViewportWidth() {
        if (this.pageBuilderWrapper?.nativeElement) {
            setTimeout(() => {
                this.viewportWidth = this.pageBuilderWrapper.nativeElement.clientWidth;
            });
        }
    }
    
    get pageSizeString(): string {
        return `${this.pageSizeLimitInPercentage.toFixed(1)}%`;
    }

    private subscribeEvents() {
        this.pagesService.previewModeChange$.pipe(this.getDestroyer()).subscribe((previewMode: boolean) => {
            this.previewMode = previewMode;
        });

        this.pagesService.lockScreenChange$.pipe(this.getDestroyer()).subscribe((lockScreen: boolean) => {
            this.lockScreen = lockScreen;
        });

        // For update editor.
        this.pagesService.editorChange$.pipe(this.getDestroyer()).subscribe((editor: IEditor) => {
            this.currentEditor = editor;
        });

        // When block change update the editor cause it can be changed.
        this.pagesService.pageBlockChange$.pipe(this.getDestroyer()).subscribe((pageBlockKey: string) => {
            if (this.currentEditor?.id === pageBlockKey) {
                // Don't update the editor cause if the user is still editing the focus field will be blur and the entered data will be lose.
                // this.setCurrentEditor();
            }
        });

        this.pagesService.screenSizeChange$.pipe(this.getDestroyer()).subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            const screenType = this.pagesService.getScreenType(this.screenSize);
            this.selectedScreenType = screenType;
        });

        // For update the page data
        this.pagesService.pageDataForEditorChange$.pipe(this.getDestroyer()).subscribe((page: Page) => {
            if (page) {
                this.currentPage = page;
                const pageSize = this.utilitiesService.getObjectSize(page, 'kb');
                this.pageSizeLimitInPercentage = pageSize * 100 / this.pagesService.PAGE_SIZE_LIMITATION_OBJECT.value;
                this.isOverPageSizeLimit = pageSize >= this.pagesService.PAGE_SIZE_LIMITATION_OBJECT.value;

                if (this.pageBuilderWrapper?.nativeElement) {
                    let maxWidth = coerceNumberProperty(page.Layout.MaxWidth, 0);
                    const maxWidthToSet = maxWidth === 0 ? '100%' : `${maxWidth}px`;
                    this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'max-width', maxWidthToSet);
                    this.updateViewportWidth();
                }
            }
        });

        this.pagesService.screenWidthChange$.pipe(this.getDestroyer()).subscribe((width: string) => {
            if (this.pageBuilderWrapper?.nativeElement) {
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'width', width);
                this.updateViewportWidth();
            }
        });

       // Get the sections id's into sectionsColumnsDropList for the drag & drop.
       this.pagesService.sectionsChange$.pipe(this.getDestroyer()).subscribe((sections: PageSection[]) => {
            // Concat all results into one array.
            this.sectionsColumnsDropList = [].concat(...sections.map(section => {
                return section.Columns.map((column, index) => 
                    this.pagesService.getSectionColumnKey(section.Key, index.toString())
                )
            }));
        });
    }

    async ngOnInit() {
        // Get the first translation for load all translations.
        const desktopTitle = await this.translate.get('PAGE_MANAGER.DESKTOP').toPromise();
        
        this.pagesService.defaultSectionTitle = this.translate.instant('PAGE_MANAGER.SECTION');

        this.screenTypes = [
            { key: 'Landscape', value: desktopTitle, callback: () => this.setScreenWidth('Landscape'), iconName: pepIconDeviceDesktop.name, iconPosition: 'end' },
            { key: 'Tablet', value: this.translate.instant('PAGE_MANAGER.TABLET'), callback: () => this.setScreenWidth('Tablet'), iconName: pepIconDeviceTablet.name, iconPosition: 'end' },
            { key: 'Phablet', value: this.translate.instant('PAGE_MANAGER.MOBILE'), callback: () => this.setScreenWidth('Phablet'), iconName: pepIconDeviceMobile.name, iconPosition: 'end' }
        ];

        this.menuItems = [
            { key: this.RESTORE_TO_LAST_PUBLISH_KEY, text: this.translate.instant('ACTIONS.RESTORE_TO_LAST_PUBLISH') },
            // TODO: { key: this.IMPORT_KEY, text: this.translate.instant('ACTIONS.IMPORT') },
            { key: this.EXPORT_KEY, text: this.translate.instant('ACTIONS.EXPORT') }
        ];

        this.subscribeEvents();
    }

    onDIMXProcessDone(dimxEvent: any) {
        console.log(`DIMXProcessDone: ${JSON.stringify(dimxEvent)}`);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event): void {
        this.updateViewportWidth();
    }

    onSidebarStateChange(event: IPepSideBarStateChangeEvent) {
        this.updateViewportWidth();
    }

    togglePreviewMode() {
        this.pagesService.notifyPreviewModeChange(!this.previewMode);
        this.updateViewportWidth();
    }

    onPageEditorObjectChange(pageEditor: IPageEditor) {
        this.pagesService.updatePageFromEditor(pageEditor);
    }

    onSectionEditorObjectChange(sectionEditor: ISectionEditor) {
        this.pagesService.updateSectionFromEditor(sectionEditor);
    }

    onBlockEditorHostEvents(event: any) {
        // Implement editors events.
        switch(event.action){
            case 'set-configuration':
                this.pagesService.onBlockEditorSetConfiguration(this.currentEditor.id, event.configuration);
                break;
            case 'set-configuration-field':
                this.pagesService.onBlockEditorConfigurationField(this.currentEditor.id, event.key, event.value);
                break;
            case 'set-page-configuration':
                this.pagesService.onBlockEditorSetPageConfiguration(this.currentEditor.id, event.pageConfiguration);
                break;
        }
    }

    onNavigateBackFromEditor() {
        if (!this.currentEditor || this.currentEditor?.type === 'page-builder') {
            if (this.pagesService.doesCurrentPageHasChanges()) {
                const title = this.translate.instant('MESSAGES.TITLE_NOTICE');
                const content = this.translate.instant('MESSAGES.CHANGES_ARE_NOT_SAVED');
                let dataMsg: PepDialogData;
                let actionButtons: PepDialogActionButton[];
                actionButtons = [
                    new PepDialogActionButton(
                        this.translate.instant('ACTIONS.CANCEL'),
                        '',
                        () => { /* Do nothing */ }),
                    new PepDialogActionButton(
                        this.translate.instant('ACTIONS.LEAVE_PAGE'),
                        'strong',
                        () => this.navigationService.back())
                ];
                dataMsg = new PepDialogData({
                    title,
                    actionsType: 'custom',
                    content: content,
                    actionButtons
                });
                this.dialogService.openDefaultDialog(dataMsg).afterClosed()
                    .subscribe((isActionButtonClicked) => {
                        // If user pressed on cancel (X button) or clicked outside
                        if (!isActionButtonClicked) {
                            // Do nothing.
                        }
                });
            } else {
                this.navigationService.back();
            }
        } else {
            this.pagesService.navigateBackFromEditor();
        }
    }

    // onMenuItemClick(action: IPepMenuItemClickEvent) {
    //     // Restore to last publish
    //     if (action.source.key === this.RESTORE_TO_LAST_PUBLISH_KEY) { 
    //         this.pagesService.restoreToLastPublish(this.navigationService.addonUUID).subscribe(res => {
    //             this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.PAGE_RESTORED')).afterClosed().subscribe(res => {
    //                 window.location.reload();
    //             });
    //         });
    //     } else if (action.source.key === this.IMPORT_KEY) { // Import page
    //         // TODO: Should work only for the same page Key (override this page).
    //         // this.dimxService.import();
    //     } else if (action.source.key === this.EXPORT_KEY) { // Export page
    //         this.dimxService.export(this.currentPage.Key, this.currentPage.Name);
    //     }
    // }
    
    onSaveClick() {
        this.pagesService.saveCurrentPage(this.navigationService.addonUUID);
    }

    onPublishClick() {
        this.pagesService.publishCurrentPage(this.navigationService.addonUUID);
    }
}