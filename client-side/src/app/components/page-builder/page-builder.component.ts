import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { CdkDragDrop  } from '@angular/cdk/drag-drop';
import { IBlockProgress, PagesService } from '../../services/pages.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { Page, PageBlock, PageSection, PageSizeType } from '@pepperi-addons/papi-sdk';
import { NavigationService } from 'src/app/services/navigation.service';

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit, OnDestroy {
    @ViewChild('sectionsCont', { static: true }) sectionsContainer: ElementRef;

    @Input() editMode: boolean = false;
    @Input() sectionsColumnsDropList = [];
    
    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
    }
    get screenSize(): PepScreenSizeType {
        return this._screenSize;
    }

    @HostBinding('style.padding-inline')
    paddingInline = '0';

    @HostBinding('style.padding-top')
    paddingTop = '0';
    @HostBinding('style.padding-bottom')
    paddingBottom = '0';

    sectionsGap: PageSizeType | 'NONE';
    columnsGap: PageSizeType | 'NONE';

    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get sections$(): Observable<PageSection[]> {
        return this._sectionsSubject.asObservable();
    }

    private _pageBlocksMap = new Map<string, PageBlock>();
    get pageBlocksMap(): ReadonlyMap<string, PageBlock> {
        return this._pageBlocksMap;
    }

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

    private convertPageSizeType(size: PageSizeType | 'NONE') {
        let res;

        if (size === 'LG') {
            res = '2rem';
        } else if (size === 'MD') {
            res = '1rem';
        } else if (size === 'SM') {
            res = '0.5rem';
        } else {
            res = '0';
        }

        return res;
    }

    private setPageDataProperties(page: Page) {
        if (page && this.sectionsContainer?.nativeElement) {
            let maxWidth = this.utilitiesService.coerceNumberProperty(page.Layout.MaxWidth, 0);
            const maxWidthToSet = maxWidth === 0 ? 'unset' : `${maxWidth}px`;
            this.renderer.setStyle(this.sectionsContainer.nativeElement, 'max-width', maxWidthToSet);

            this.sectionsGap = page.Layout.SectionsGap || 'NONE';
            this.columnsGap = page.Layout.ColumnsGap || 'NONE';

            this.paddingInline = this.convertPageSizeType(page.Layout.HorizontalSpacing);
            this.paddingBottom = this.paddingTop = this.convertPageSizeType(page.Layout.VerticalSpacing);
        }
    }

    ngOnInit() {
        // TODO: Need to get the addonUUID not from the navigationService.
        const addonUUID = this.navigationService.addonUUID;
        const pageKey = this.route?.snapshot?.params['page_key'];

        this.pageBuilderService.loadPageBuilder(addonUUID, pageKey, this.editMode);

        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.onSectionsChange$.subscribe(res => {
            this._sectionsSubject.next(res);
        });

        this.pageBuilderService.pageBlockProgress$.subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
            // Clear the blocks map and set it again.
            this._pageBlocksMap.clear();
            const pbRelationsNames = [];

            blocksProgress.forEach(bp => {
                if (bp.priority >= this.pageBuilderService.currentBlocksPriority) {
                    // Check that there is no other block with the same relation name that need to load.
                    if (bp.loaded || !pbRelationsNames.some(relationName => relationName === bp.block.Relation.Name)) {
                        
                        // Add to the map only relations that not added yet.
                        if (!bp.loaded) {
                            pbRelationsNames.push(bp.block.Relation.Name);
                        }

                        this._pageBlocksMap.set(bp.block.Key, bp.block);
                    }
                }
            });
        });

        this.pageBuilderService.pageDataChange$.subscribe((page: Page) => {
            this.setPageDataProperties(page);
        });
    }

    ngOnDestroy() {
        this.pageBuilderService.unloadPageBuilder();
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onSectionDropped(event);
    }

}
