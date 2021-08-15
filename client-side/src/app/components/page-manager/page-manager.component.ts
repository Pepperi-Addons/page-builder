import { ActivatedRoute, Router } from '@angular/router';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
import { Editor, PageBuilderService, Section } from '../../services/page-builder.service';
import { PepCustomizationService, PepLayoutService, PepLoaderService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';
import { pepIconSystemBin } from '@pepperi-addons/ngx-lib/icon';

type ScreenSizeType = 'desktop' | 'tablet' | 'mobile';

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss']
})
export class PageManagerComponent implements OnInit {
    @ViewChild('pageBuilderWrapper') pageBuilderWrapper: ElementRef;
    
    showEditor = false;
    currentEditor: Editor;
    
    screenOptions: Array<PepButton>;
    selectedScreenKey: ScreenSizeType;
    viewportWidth: number;
    screenSize: PepScreenSizeType;
    // PepScreenSizeType = PepScreenSizeType;

    constructor(
        public customizationService: PepCustomizationService,
        public loaderService: PepLoaderService,
        private renderer: Renderer2,
        private route: ActivatedRoute,
        private router: Router,
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

        this.viewportWidth = window.innerWidth;
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

    ngOnInit() {
        // TODO: Get the value (showEditor) from server.
        this.showEditor = this.route?.snapshot?.queryParams?.edit === "true" ?? false;
        
        // TODO: Translate the value.
        this.screenOptions = [
            { key: 'desktop', value: 'Desktop', callback: () => this.setScreenWidth('desktop'), iconName: pepIconSystemBin.name, iconPosition: 'end' },
            { key: 'tablet', value: 'Tablet', callback: () => this.setScreenWidth('tablet'), iconName: pepIconSystemBin.name, iconPosition: 'end' },
            { key: 'mobile', value: 'Mobile', callback: () => this.setScreenWidth('mobile'), iconName: pepIconSystemBin.name, iconPosition: 'end' }
        ];

        this.pageBuilderService.onScreenSizeChange$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.onScreenMaxWidthChange$.subscribe((maxWidth: string) => {
            if (this.pageBuilderWrapper?.nativeElement) {
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'max-width', maxWidth);
            }
        });

        this.pageBuilderService.onScreenWidthChange$.subscribe((width: string) => {
            if (this.pageBuilderWrapper?.nativeElement) {
                this.renderer.setStyle(this.pageBuilderWrapper.nativeElement, 'width', width);
            }
        });
    }

    togglePreviewMode() {
        this.showEditor = !this.showEditor;
    }

    onBlockEditorChange(event: any) {

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

        this.pageBuilderService.publish();
    }

    clearPage() {
        this.pageBuilderService.clearSections();
    }

    navigateBackFromEditor() {
        this.pageBuilderService.navigateBackFromEditor();
    }
}
