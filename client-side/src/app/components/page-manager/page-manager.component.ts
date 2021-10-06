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

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss']
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
    
    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private dialogService: PepDialogService,
        private pageBuilderService: PagesService,
        private navigationService: NavigationService,
    ) {
        this.pageBuilderService.onEditorChange$.subscribe((editor) => {
            this.currentEditor = editor;
        });
    }

    private setScreenWidth(screenType: DataViewScreenSize) {
        let widthToSet = '100%';

        if (screenType === 'Tablet') {
            widthToSet = '720';
        } else if (screenType === 'Phablet') {
            widthToSet = '360';
        }

        this.selectedScreenType = screenType;
        this.pageBuilderService.setScreenWidth(widthToSet);
    }

    private updateViewportWidth() {
        if (this.pageBuilderWrapper?.nativeElement) {
            setTimeout(() => {
                this.viewportWidth = this.pageBuilderWrapper.nativeElement.clientWidth;
            });
        }
    }
    
    async ngOnInit() {
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

        // TODO: Block Screen button if the screen width is not enough.
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            const screenType = this.pageBuilderService.getScreenType(this.screenSize);
            this.setScreenWidth(screenType);
        });

        this.pageBuilderService.onScreenSizeChange$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.pageDataChange$.subscribe((page: Page) => {
            if (page && this.pageBuilderWrapper?.nativeElement) {
                let maxWidth = this.utilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
                const maxWidthToSet = maxWidth === 0 ? '100%' : `${maxWidth}px`;
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'max-width', maxWidthToSet);
                this.updateViewportWidth();
            }
        });

        this.pageBuilderService.onScreenWidthChange$.subscribe((width: string) => {
            if (this.pageBuilderWrapper?.nativeElement) {
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'width', width);
                this.updateViewportWidth();
            }
        });

       // Get the sections id's into sectionsColumnsDropList for the drag & drop.
       this.pageBuilderService.onSectionsChange$.subscribe(res => {
            // Concat all results into one array.
            this.sectionsColumnsDropList = [].concat(...res.map(section => {
                return section.Columns.map((column, index) => 
                    this.pageBuilderService.getSectionColumnKey(section.Key, index.toString())
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
        this.pageBuilderService.updatePageFromEditor(pageEditor);
    }

    onSectionEditorObjectChange(sectionEditor: ISectionEditor) {
        this.pageBuilderService.updateSectionFromEditor(sectionEditor);
    }

    onBlockEditorHostEvents(event: any) {
        switch(event.action){
            case 'set-configuration':
                this.pageBuilderService.updateBlockConfiguration(this.currentEditor.id, event.configuration);
                break;
        }
        
        // TODO: Implement configuration data change.
    }

    onNavigateBackFromEditor() {
        if (!this.currentEditor || this.currentEditor?.type === 'page-builder') {
            this.navigationService.back();
        } else {
            this.pageBuilderService.navigateBackFromEditor();
        }
    }

    // TODO:
    onMenuItemClick(action: IPepMenuItemClickEvent) {
        if (action.source.key === this.importKey) { // Import page

        } else if (action.source.key === this.exportKey) { // Export page
            
        }
    }

    private showDialogMsg(message: string) {
        const title = this.translate.instant('MESSAGES.TITLE_NOTICE');
        const data = new PepDialogData({
            title,
            content: message,
        });
        this.dialogService.openDefaultDialog(data);
    }

    onSaveClick() {
        this.pageBuilderService.saveCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            this.showDialogMsg(this.translate.instant('MESSAGES.OPERATION_SUCCESS'));
        });
    }

    onPublishClick() {
        this.pageBuilderService.publishCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            this.showDialogMsg(this.translate.instant('MESSAGES.OPERATION_SUCCESS'));
        });
    }
}