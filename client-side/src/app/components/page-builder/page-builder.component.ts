import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { CdkDragDrop  } from '@angular/cdk/drag-drop';
import { PageBuilderService } from '../../services/page-builder.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { Page, PageSection } from '@pepperi-addons/papi-sdk';

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    @ViewChild('sectionsCont', { static: true }) sectionsContainer: ElementRef;

    @Input() editMode: boolean = false;
    @Input() screenSize: PepScreenSizeType;
    
    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get sections$(): Observable<PageSection[]> {
        return this._sectionsSubject.asObservable();
    }

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private translate: TranslateService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        public pageBuilderService: PageBuilderService
    ) {
    }

    ngOnInit() {
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.onSectionsChange$.subscribe(res => {
            this._sectionsSubject.next(res);
        });

        this.pageBuilderService.pageDataChange$.subscribe((page: Page) => {
            if (page && this.sectionsContainer?.nativeElement) {
                let maxWidth = this.utilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
                const maxWidthToSet = maxWidth === 0 ? 'unset' : `${maxWidth}px`;
                this.renderer.setStyle(this.sectionsContainer.nativeElement, 'max-width', maxWidthToSet);
            }
        });

        const pageKey = this.route?.snapshot?.params['page_key'] || '';
        this.pageBuilderService.initPageBuilder(pageKey);
    }

    addSection(e) {
        this.pageBuilderService.addSection();
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onSectionDropped(event);
    }

}
