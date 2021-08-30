import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostBinding, Input, OnInit, Renderer2, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { CdkDragDrop  } from '@angular/cdk/drag-drop';
import { PagesService } from '../../services/pages.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { Page, PageSection, PageSizeType } from '@pepperi-addons/papi-sdk';
import { NavigationService } from 'src/app/services/navigation.service';

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    @ViewChild('sectionsCont', { static: true }) sectionsContainer: ElementRef;

    @Input() editMode: boolean = false;
    @Input() screenSize: PepScreenSizeType;
    @Input() sectionsColumnsDropList = [];

    @HostBinding('style.padding-inline')
    paddingInline = '0';

    @HostBinding('style.padding-top')
    paddingTop = '0';
    @HostBinding('style.padding-bottom')
    paddingBottom = '0';

    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get sections$(): Observable<PageSection[]> {
        return this._sectionsSubject.asObservable();
    }

    sectionsGap: PageSizeType | 'NONE';
    columnsGap: PageSizeType | 'NONE';

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private translate: TranslateService,
        private navigationService: NavigationService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        public pageBuilderService: PagesService
    ) {
    }

    private setPageDataProperties(page: Page) {
        if (page && this.sectionsContainer?.nativeElement) {
            let maxWidth = this.utilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
            const maxWidthToSet = maxWidth === 0 ? 'unset' : `${maxWidth}px`;
            this.renderer.setStyle(this.sectionsContainer.nativeElement, 'max-width', maxWidthToSet);

            this.sectionsGap = page.Layout.SectionsGap || 'NONE';
            this.columnsGap = page.Layout.CoulmnsGap || 'NONE';

            this.paddingInline = '1rem'; // page.Layout.HorizontalSpacing
            this.paddingBottom = this.paddingTop = '1rem'; // page.Layout.VerticalSpacing
        }
    }

    ngOnInit() {
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.onSectionsChange$.subscribe(res => {
            this._sectionsSubject.next(res);
        });

        this.pageBuilderService.pageDataChange$.subscribe((page: Page) => {
            this.setPageDataProperties(page);
        });

        // TODO: Need to get the addonUUID not from the navigationService.
        const addonUUID = this.navigationService.addonUUID;
        const pageKey = this.route?.snapshot?.params['page_key'];
        this.pageBuilderService.initPageBuilder(addonUUID, pageKey, this.editMode);
    }

    addSection(e) {
        this.pageBuilderService.onAddSection();
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onSectionDropped(event);
    }

}
