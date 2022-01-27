import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';
import { pepIconDeviceDesktop, pepIconDeviceMobile, pepIconDeviceTablet } from '@pepperi-addons/ngx-lib/icon';
import { TranslateService } from '@ngx-translate/core';
import { DataViewScreenSize, Page } from '@pepperi-addons/papi-sdk';
import { IEditor, PagesService, IPageEditor, ISectionEditor } from '../../services/pages.service';
import { NavigationService } from '../../services/navigation.service';
import { IPepSideBarStateChangeEvent } from '@pepperi-addons/ngx-lib/side-bar';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { UtilitiesService } from 'src/app/services/utilities.service';

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss', './page-manager.component.theme.scss']
})
export class PageManagerComponent implements OnInit {
    @ViewChild('pageBuilderWrapper', { static: true }) pageBuilderWrapper: ElementRef;

    readonly importKey = 'import';
    readonly exportKey = 'export';

    showEditor = true;
    currentEditor: IEditor;
    sectionsColumnsDropList = [];

    screenTypes: Array<PepButton>;
    selectedScreenType: DataViewScreenSize;
    viewportWidth: number;
    screenSize: PepScreenSizeType;
    menuItems: Array<PepMenuItem>;
    pageSize: number;
    pageSizeString: string;

    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private pepUtilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private pagesService: PagesService,
        private navigationService: NavigationService,
        private utilitiesService: UtilitiesService
    ) {
    }

    private setScreenWidth(screenType: DataViewScreenSize) {
        let widthToSet = '100%';

        if (screenType === 'Tablet') {
            widthToSet = '720';
        } else if (screenType === 'Phablet') {
            widthToSet = '360';
        }

        this.selectedScreenType = screenType;
        this.pagesService.setScreenWidth(widthToSet);
    }

    private updateViewportWidth() {
        if (this.pageBuilderWrapper?.nativeElement) {
            setTimeout(() => {
                this.viewportWidth = this.pageBuilderWrapper.nativeElement.clientWidth;
            });
        }
    }
    
    async ngOnInit() {
        this.pagesService.onEditorChange$.subscribe((editor) => {
            this.currentEditor = editor;
        });

        // Get the first translation for load all translations.
        const desktopTitle = await this.translate.get('PAGE_MANAGER.DESKTOP').toPromise();

        this.screenTypes = [
            { key: 'Landscape', value: desktopTitle, callback: () => this.setScreenWidth('Landscape'), iconName: pepIconDeviceDesktop.name, iconPosition: 'end' },
            { key: 'Tablet', value: this.translate.instant('PAGE_MANAGER.TABLET'), callback: () => this.setScreenWidth('Tablet'), iconName: pepIconDeviceTablet.name, iconPosition: 'end' },
            { key: 'Phablet', value: this.translate.instant('PAGE_MANAGER.MOBILE'), callback: () => this.setScreenWidth('Phablet'), iconName: pepIconDeviceMobile.name, iconPosition: 'end' }
        ];

        this.menuItems = [
            { key: this.importKey, text: this.translate.instant('ACTIONS.IMPORT') },
            { key: this.exportKey, text: this.translate.instant('ACTIONS.EXPORT') }
        ];

        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            const screenType = this.pagesService.getScreenType(this.screenSize);
            this.setScreenWidth(screenType);
        });

        this.pagesService.onScreenSizeChange$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pagesService.pageDataChange$.subscribe((page: Page) => {
            if (page) {
                this.pageSize = this.utilitiesService.getObjectSize(page, 'kb');
                this.pageSizeString = `page is approximately ${this.pageSize.toFixed(2)} kb`;
            
                if (this.pageBuilderWrapper?.nativeElement) {
                    let maxWidth = this.pepUtilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
                    const maxWidthToSet = maxWidth === 0 ? '100%' : `${maxWidth}px`;
                    this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'max-width', maxWidthToSet);
                    this.updateViewportWidth();
                }
            }
        });

        this.pagesService.onScreenWidthChange$.subscribe((width: string) => {
            if (this.pageBuilderWrapper?.nativeElement) {
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'width', width);
                this.updateViewportWidth();
            }
        });

       // Get the sections id's into sectionsColumnsDropList for the drag & drop.
       this.pagesService.onSectionsChange$.subscribe(res => {
            // Concat all results into one array.
            this.sectionsColumnsDropList = [].concat(...res.map(section => {
                return section.Columns.map((column, index) => 
                    this.pagesService.getSectionColumnKey(section.Key, index.toString())
                )
            }));
        });
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

    onNavigateBackFromEditor() {
        if (!this.currentEditor || this.currentEditor?.type === 'page-builder') {
            this.navigationService.back();
        } else {
            this.pagesService.navigateBackFromEditor();
        }
    }

    // TODO: Implement
    onMenuItemClick(action: IPepMenuItemClickEvent) {
        if (action.source.key === this.importKey) { // Import page

        } else if (action.source.key === this.exportKey) { // Export page
            
        }
    }

    onSaveClick() {
        this.pagesService.saveCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.OPERATION_SUCCESS'));
        });
    }

    onPublishClick() {
        this.pagesService.publishCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.OPERATION_SUCCESS'));
        });
    }
}