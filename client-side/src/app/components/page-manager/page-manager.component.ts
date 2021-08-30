import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';
import { pepIconDeviceDesktop, pepIconDeviceMobile, pepIconDeviceTablet } from '@pepperi-addons/ngx-lib/icon';
import { TranslateService } from '@ngx-translate/core';
import { Page } from '@pepperi-addons/papi-sdk';
import { IEditor, PagesService, IPageEditor, ISectionEditor } from '../../services/pages.service';
import { NavigationService } from '../../services/navigation.service';
import { IPepSideBarStateChangeEvent } from '@pepperi-addons/ngx-lib/side-bar';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';

type ScreenSizeType = 'desktop' | 'tablet' | 'mobile';

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

    screenOptions: Array<PepButton>;
    selectedScreenKey: ScreenSizeType;
    viewportWidth: number;
    screenSize: PepScreenSizeType;
    menuItems: Array<PepMenuItem>;
    
    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private pageBuilderService: PagesService,
        private navigationService: NavigationService,
    ) {
        this.pageBuilderService.onEditorChange$.subscribe((editor) => {
            this.currentEditor = editor;
        });

        // TODO: Block Screen button if the screen width is not enough.
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
            this.selectedScreenKey =
                size < PepScreenSizeType.MD ? 'desktop' :
                (size === PepScreenSizeType.MD || size === PepScreenSizeType.SM ? 'tablet' : 'mobile');

            this.setScreenWidth(this.selectedScreenKey);
        });
    }

    private setScreenWidth(screenWidth: ScreenSizeType) {
        let widthToSet = '100%';

        if (screenWidth === 'tablet') {
            widthToSet = '720';
        } else if (screenWidth === 'mobile') {
            widthToSet = '360';
        }

        this.selectedScreenKey = screenWidth;
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

        this.screenOptions = [
            { key: 'desktop', value: desktopTitle, callback: () => this.setScreenWidth('desktop'), iconName: pepIconDeviceDesktop.name, iconPosition: 'end' },
            { key: 'tablet', value: this.translate.instant('PAGE_MANAGER.TABLET'), callback: () => this.setScreenWidth('tablet'), iconName: pepIconDeviceTablet.name, iconPosition: 'end' },
            { key: 'mobile', value: this.translate.instant('PAGE_MANAGER.MOBILE'), callback: () => this.setScreenWidth('mobile'), iconName: pepIconDeviceMobile.name, iconPosition: 'end' }
        ];

        this.menuItems = [
            { key: this.importKey, text: this.translate.instant('ACTIONS.IMPORT') },
            { key: this.exportKey, text: this.translate.instant('ACTIONS.EXPORT') }
        ];

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
    }

    onPageEditorObjectChange(pageEditor: IPageEditor) {
        this.pageBuilderService.updatePageFromEditor(pageEditor);
    }

    onSectionEditorObjectChange(sectionEditor: ISectionEditor) {
        this.pageBuilderService.updateSectionFromEditor(sectionEditor);
    }

    onBlockEditorObjectChange(event: any) {

    }

    onNavigateBackFromEditor() {
        if (this.currentEditor?.type === 'page-builder') {
            this.navigationService.back();
        } else {
            this.pageBuilderService.navigateBackFromEditor();
        }
    }

    // clearPage() {
    //     this.pageBuilderService.onClearPageSections();
    // }

    // TODO:
    onMenuItemClick(action: IPepMenuItemClickEvent) {
        if (action.source.key === this.importKey) { // Import page

        } else if (action.source.key === this.exportKey) { // Export page
            
        }
    }

    onSaveClick() {
        this.pageBuilderService.saveCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            // TODO: Show message.
        });
    }

    onPublishClick() {
        this.pageBuilderService.publishCurrentPage(this.navigationService.addonUUID).subscribe(res => {
            // TODO: Show message.
        });
    }
}