import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { CdkDragDrop  } from '@angular/cdk/drag-drop';
import { IBlockProgress, PagesService } from '../../services/pages.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { DataViewScreenSize, Page, PageBlock, PageSection, PageSizeType } from '@pepperi-addons/papi-sdk';
import { NavigationService } from 'src/app/services/navigation.service';

export interface IPageBuilderHostObject {
    pageKey: string;
    pageParams: any;
}

@Component({
    selector: 'page-builder-internal',
    templateUrl: './page-builder-internal.component.html',
    styleUrls: ['./page-builder-internal.component.scss']
})
export class PageBuilderInternalComponent implements OnInit, OnDestroy {
    @ViewChild('sectionsCont', { static: true }) sectionsContainer: ElementRef;

    @Input() editMode: boolean = false;
    @Input() sectionsColumnsDropList = [];
    
    // For loading the page from the client apps.
    private _hostObject: IPageBuilderHostObject;
    @Input()
    set hostObject(value: IPageBuilderHostObject) {
        this._hostObject = value;
    }
    get hostObject(): IPageBuilderHostObject {
        return this._hostObject;
    }

    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
        this.screenType = this.pagesService.getScreenType(value);
    }
    get screenSize(): PepScreenSizeType {
        return this._screenSize;
    }

    // private _selectedScreenType: DataViewScreenSize;
    // @Input()
    // set selectedScreenType(value: DataViewScreenSize) {
    //     // This is HACK for reload the sections when selected screen changed.
    //     if (this._selectedScreenType !== value) {
    //         this._selectedScreenType = value;
    //         const tmp = this._sectionsSubject.value;
    //         this._sectionsSubject.next(null);
    //         setTimeout(() => {
    //             this._sectionsSubject.next(tmp);
    //         }, 0);
    //     }
    // }
    
    @HostBinding('style.padding-inline')
    paddingInline = '0';

    @HostBinding('style.padding-top')
    paddingTop = '0';
    @HostBinding('style.padding-bottom')
    paddingBottom = '0';

    sectionsGap: PageSizeType | 'none';
    columnsGap: PageSizeType | 'none';

    screenType: DataViewScreenSize;

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
        private navigationService: NavigationService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private pagesService: PagesService
    ) {
    }

    private convertPageSizeType(size: PageSizeType | 'none') {
        let res;

        if (size === 'lg') {
            res = '2rem';
        } else if (size === 'md') {
            res = '1rem';
        } else if (size === 'sm') {
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

            this.sectionsGap = page.Layout.SectionsGap || 'md';
            this.columnsGap = page.Layout.ColumnsGap || 'md';

            this.paddingInline = this.convertPageSizeType(page.Layout.HorizontalSpacing);
            this.paddingBottom = this.paddingTop = this.convertPageSizeType(page.Layout.VerticalSpacing);
        }
    }

    ngOnInit() {
        const addonUUID = this.navigationService.addonUUID;
        const pageKey = this.hostObject?.pageKey || this.route.snapshot.data['page_key'] || this.route?.snapshot?.params['page_key'] || '';

        console.log('pageKey - ' + pageKey);
        if (pageKey.length > 0) {
            const queryParams = this.hostObject?.pageParams || this.route?.snapshot?.queryParams;
            this.pagesService.loadPageBuilder(addonUUID, pageKey, this.editMode, queryParams);

            this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
                this.screenSize = size;
            });

            this.pagesService.sectionsChange$.subscribe(res => {
                this._sectionsSubject.next(res);
            });

            this.pagesService.pageBlockProgressMapChange$.subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
                // Clear the blocks map and set it again.
                const pageBlocksMap = new Map<string, PageBlock>();
                // const remoteEntriesMap = new Map<string, boolean>();
                const pbRelationsNames = new Map<string, boolean>();

                blocksProgress.forEach(bp => {
                    if (bp.priority >= this.pagesService.currentBlocksPriority) {
                        // Check that there is no other block with the same relation name that need to load.
                        // if (bp.loaded || !remoteEntriesMap.has(bp.block.Relation.Options?.remoteEntry)) {
                        if (bp.loaded || !pbRelationsNames.has(bp.block.Relation.Name)) {
                            
                            // Add to the map only relations that not added yet.
                            if (!bp.loaded) {
                                // remoteEntriesMap.set(bp.block.Relation.Options?.remoteEntry, true);
                                pbRelationsNames.set(bp.block.Relation.Name, true);
                            }

                            pageBlocksMap.set(bp.block.Key, bp.block);
                        }
                    }
                });

                this._pageBlocksMap = pageBlocksMap;
            });

            this.pagesService.pageDataChange$.subscribe((page: Page) => {
                this.setPageDataProperties(page);
            });
        } else {
            // TODO: Show error message key isn't supply.
        }
    }

    ngOnDestroy() {
        this.pagesService.unloadPageBuilder();
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pagesService.onSectionDropped(event);
    }

}
