import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild, ViewContainerRef } from "@angular/core";
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';
import { pepIconDeviceDesktop, pepIconDeviceMobile, pepIconDeviceTablet } from '@pepperi-addons/ngx-lib/icon';
import { TranslateService } from '@ngx-translate/core';
import { DataViewScreenSize, Page, PageBlock } from '@pepperi-addons/papi-sdk';
import { IEditor, PagesService, IPageEditor, ISectionEditor } from '../../services/pages.service';
import { DIMXService } from '../../services/dimx.service';
import { NavigationService } from '../../services/navigation.service';
import { IPepSideBarStateChangeEvent } from '@pepperi-addons/ngx-lib/side-bar';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { UtilitiesService } from 'src/app/services/utilities.service';
import { PepSnackBarData, PepSnackBarService } from "@pepperi-addons/ngx-lib/snack-bar";
import { PepRemoteLoaderService } from "@pepperi-addons/ngx-lib/remote-loader";

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss', './page-manager.component.theme.scss'],
    providers: [DIMXService]
})
export class PageManagerComponent implements OnInit {
    @ViewChild('pageBuilderWrapper', { static: true }) pageBuilderWrapper: ElementRef;
    
    private readonly RESTORE_TO_LAST_PUBLISH_KEY = 'restore';
    private readonly IMPORT_KEY = 'import';
    private readonly EXPORT_KEY = 'export';
    readonly MIN_PERCENTAGE_TO_SHOW_LIMIT = 80;

    lockScreen = false;
    showEditor = true;
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

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private pepUtilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private pagesService: PagesService,
        private utilitiesService: UtilitiesService,
        private pepSnackBarService: PepSnackBarService,
        public navigationService: NavigationService,
        private viewContainerRef: ViewContainerRef,
        private dimxService: DIMXService,
    ) {
    }

    private setCurrentEditor(): void {
        if (this.currentEditor?.type === 'block') {
            this.currentEditor = this.pagesService.getBlockEditor(this.currentEditor.id);
        }
    }

    private setScreenWidth(screenType: DataViewScreenSize) {
        let widthToSet = '100%';

        if (screenType === 'Tablet') {
            widthToSet = '720';
        } else if (screenType === 'Phablet') {
            widthToSet = '360';
        }

        this.pagesService.setScreenWidth(widthToSet);
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
        this.pagesService.lockScreenChange$.subscribe((lockScreen) => {
            this.lockScreen = lockScreen;
        });

        // For update editor.
        this.pagesService.editorChange$.subscribe((editor) => {
            this.currentEditor = editor;
        });

        // For update editor data in case that the editor is block editor and the id is the updated block key.
        this.pagesService.pageBlockChange$.subscribe((pageBlock: PageBlock) => {
            if (this.currentEditor?.type === 'block' && this.currentEditor.id === pageBlock.Key) {
                this.setCurrentEditor();
            }
        });

        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            const screenType = this.pagesService.getScreenType(size);
            this.setScreenWidth(screenType);
        });

        this.pagesService.screenSizeChange$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            const screenType = this.pagesService.getScreenType(this.screenSize);
            this.selectedScreenType = screenType;
        });

        // For update the page data
        this.pagesService.pageDataChange$.subscribe((page: Page) => {
            if (page) {
                this.currentPage = page;
                const pageSize = this.utilitiesService.getObjectSize(page, 'kb');
                this.pageSizeLimitInPercentage = pageSize * 100 / this.pagesService.PAGE_SIZE_LIMITATION_OBJECT.value;
                this.isOverPageSizeLimit = pageSize >= this.pagesService.PAGE_SIZE_LIMITATION_OBJECT.value;

                if (this.pageBuilderWrapper?.nativeElement) {
                    let maxWidth = this.pepUtilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
                    const maxWidthToSet = maxWidth === 0 ? '100%' : `${maxWidth}px`;
                    this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'max-width', maxWidthToSet);
                    this.updateViewportWidth();
                }
            }
        });

        this.pagesService.screenWidthChange$.subscribe((width: string) => {
            if (this.pageBuilderWrapper?.nativeElement) {
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'width', width);
                this.updateViewportWidth();
            }
        });

       // Get the sections id's into sectionsColumnsDropList for the drag & drop.
       this.pagesService.sectionsChange$.subscribe(res => {
            // Concat all results into one array.
            this.sectionsColumnsDropList = [].concat(...res.map(section => {
                return section.Columns.map((column, index) => 
                    this.pagesService.getSectionColumnKey(section.Key, index.toString())
                )
            }));
        });
    }

    async ngOnInit() {
        this.dimxService.register(this.viewContainerRef, this.onDIMXProcessDone.bind(this));
        
        // Get the first translation for load all translations.
        const desktopTitle = await this.translate.get('PAGE_MANAGER.DESKTOP').toPromise();

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
        this.showEditor = !this.showEditor;
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
                this.pagesService.updateBlockConfiguration(this.currentEditor.id, event.configuration);
                break;
            case 'set-configuration-field':
                this.pagesService.updateBlockConfigurationField(this.currentEditor.id, event.key, event.value);
                break;
            case 'set-page-configuration':
                this.pagesService.updateBlockPageConfiguration(this.currentEditor.id, event.pageConfiguration);
                break;
        }
    }

    async onNavigateBackFromEditor() {
        if (!this.currentEditor || this.currentEditor?.type === 'page-builder') {
            // TODO: We want to save?
            // await this.pagesService.saveCurrentPage(this.navigationService.addonUUID).subscribe(res => {
                this.navigationService.back();
            // });
        } else {
            this.pagesService.navigateBackFromEditor();
        }
    }

    onMenuItemClick(action: IPepMenuItemClickEvent) {
        // Restore to last publish
        if (action.source.key === this.RESTORE_TO_LAST_PUBLISH_KEY) { 
            this.pagesService.restoreToLastPublish(this.navigationService.addonUUID).subscribe(res => {
                this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.PAGE_RESTORED')).afterClosed().subscribe(res => {
                    window.location.reload();
                });
            });
        } else if (action.source.key === this.IMPORT_KEY) { // Import page
            // TODO: Should work only for the same page Key (override this page).
            // this.dimxService.import();
        } else if (action.source.key === this.EXPORT_KEY) { // Export page
            this.dimxService.export(this.currentPage.Key, this.currentPage.Name);
        }
    }
    
    onSaveClick() {
        this.pagesService.saveCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            // this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.OPERATION_SUCCESS'));
            const data: PepSnackBarData = {
                title: this.translate.instant('MESSAGES.PAGE_SAVED'),
                content: '',
            }

            const config = this.pepSnackBarService.getSnackBarConfig({
                duration: 5000,
            });

            this.pepSnackBarService.openDefaultSnackBar(data, config);
        });
    }

    onPublishClick() {
        this.pagesService.publishCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            // this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.OPERATION_SUCCESS'));
            const data: PepSnackBarData = {
                title: this.translate.instant('MESSAGES.PAGE_PUBLISHED'),
                content: '',
            }

            const config = this.pepSnackBarService.getSnackBarConfig({
                duration: 5000,
            });

            this.pepSnackBarService.openDefaultSnackBar(data, config);
        });
    }
}