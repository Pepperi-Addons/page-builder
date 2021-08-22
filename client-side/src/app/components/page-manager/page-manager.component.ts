import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from "@angular/core";
import { Editor, PageBuilderService, PageEditor, SectionEditor } from '../../services/page-builder.service';
import { PepCustomizationService, PepLayoutService, PepLoaderService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';
import { pepIconDeviceDesktop, pepIconDeviceMobile, pepIconDeviceTablet, pepIconSystemBin } from '@pepperi-addons/ngx-lib/icon';
import { TranslateService } from '@ngx-translate/core';
import { Page } from '@pepperi-addons/papi-sdk';

type ScreenSizeType = 'desktop' | 'tablet' | 'mobile';

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss']
})
export class PageManagerComponent implements OnInit {
    @ViewChild('pageBuilderWrapper', { static: true }) pageBuilderWrapper: ElementRef;

    showEditor = false;
    currentEditor: Editor;
    sectionsColumnsDropList = [];

    screenOptions: Array<PepButton>;
    selectedScreenKey: ScreenSizeType;
    viewportWidth: number;
    screenSize: PepScreenSizeType;
    // PepScreenSizeType = PepScreenSizeType;

    constructor(
        public customizationService: PepCustomizationService,
        public loaderService: PepLoaderService,
        private translate: TranslateService,
        private renderer: Renderer2,
        private route: ActivatedRoute,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private pageBuilderService: PageBuilderService
    ) {
        this.pageBuilderService.onEditorChange$.subscribe((editor) => {
            this.currentEditor = editor;
        });

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
            widthToSet = '800';
        } else if (screenWidth === 'mobile') {
            widthToSet = '360';
        }

        this.selectedScreenKey = screenWidth;
        this.pageBuilderService.setScreenWidth(widthToSet);
    }

    private updateViewportWidth() {
        if (this.pageBuilderWrapper?.nativeElement) {
            this.viewportWidth = this.pageBuilderWrapper.nativeElement.clientWidth;
        }
    }

    ngOnInit() {
        // TODO: Get the value (showEditor) from server.
        this.showEditor = this.route?.snapshot?.queryParams?.edit === "true" ?? false;

        // TODO: Translate the value.
        this.screenOptions = [
            { key: 'desktop', value: this.translate.instant('Desktop'), callback: () => this.setScreenWidth('desktop'), iconName: pepIconDeviceDesktop.name, iconPosition: 'end' },
            { key: 'tablet', value: this.translate.instant('Tablet'), callback: () => this.setScreenWidth('tablet'), iconName: pepIconDeviceTablet.name, iconPosition: 'end' },
            { key: 'mobile', value: this.translate.instant('Mobile'), callback: () => this.setScreenWidth('mobile'), iconName: pepIconDeviceMobile.name, iconPosition: 'end' }
        ];

        this.pageBuilderService.onScreenSizeChange$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.pageDataChange$.subscribe((page: Page) => {
            if (page && this.pageBuilderWrapper?.nativeElement) {
                let maxWidth = this.utilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
                const maxWidthToSet = maxWidth === 0 ? 'unset' : `${maxWidth}px`;
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'max-width', maxWidthToSet);
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

    togglePreviewMode() {
        this.showEditor = !this.showEditor;
    }

    onPageEditorObjectChange(pageEditor: PageEditor) {
        this.pageBuilderService.updatePageFromEditor(pageEditor);
    }

    onSectionEditorObjectChange(sectionEditor: SectionEditor) {
        this.pageBuilderService.updateSectionFromEditor(sectionEditor);
    }

    onBlockEditorObjectChange(event: any) {

    }

    publishPage() {
        // const body = JSON.stringify({RelationName: `PageBlock`, Layout: this.pageLayout });
        // const ans =  await this.http.postHttpCall('http://localhost:4500/api/publish', body).toPromise();
        // console.log(ans)
        // return this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/publish`, {RelationName: `PageBlock` });
        // const blocks = JSON.parse(sessionStorage.getItem('blocks'));
        // blocks.map(block => {
        //     block.layout = this.pageLayout.find(layoutBlock => layoutBlock.Key === block.key)?.layout;
        //     return block;
        // });
        // sessionStorage.setItem('blocks',JSON.stringify(this.pageLayout));

        this.pageBuilderService.publishPage();
    }

    // clearPage() {
    //     this.pageBuilderService.onClearSections();
    // }

    navigateBackFromEditor() {
        this.pageBuilderService.navigateBackFromEditor();
    }
}
