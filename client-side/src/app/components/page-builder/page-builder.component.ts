import { ActivatedRoute, Router } from '@angular/router';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from "@angular/core";
import { Observable } from "rxjs";
import { CdkDragDrop, CdkDropList  } from '@angular/cdk/drag-drop';
import { PageBuilderService, Section } from '../../services/page-builder.service';
import { pepIconSystemBin } from '@pepperi-addons/ngx-lib/icon';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepButton } from '@pepperi-addons/ngx-lib/button';

// export const subject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    // @ViewChild('section', { read: TemplateRef }) sectionTemplate:TemplateRef<any>;
    @ViewChild('sectionsCont') sectionsCont: ElementRef;

    // @ViewChildren(CdkDropList) htmlSections: QueryList<CdkDropList>;
    // @ViewChildren('htmlBlocks') htmlBlocks: QueryList<ElementRef>;

    // carouselAddon;
    // addonsTemp = [];
    // sectionsSubject$: BehaviorSubject<Section[]>;
    // pageLayout;
    editable = false;
    screenOptions: Array<PepButton>;
    selectedScreenKey: string;
    addons$: Observable<any[]>;
    viewportWidth: number;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private renderer: Renderer2,
        private translate: TranslateService,
        private layoutService: PepLayoutService,
        public pageBuilderService: PageBuilderService
    ) {
        this.editable = route?.snapshot?.queryParams?.edit === "true" ?? false;
        this.viewportWidth = window.innerWidth;
    }

    ngOnInit() {
        this.pageBuilderService.onScreenMaxWidthChange$.subscribe((maxWidth: string) => {
            if (this.sectionsCont?.nativeElement) {
                this.renderer.setStyle(this.sectionsCont.nativeElement, 'max-width', maxWidth);
            }
        });

        this.pageBuilderService.onScreenWidthChange$.subscribe((width: string) => {
            if (this.sectionsCont?.nativeElement) {
                this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', width);
            }
        });

        this.screenOptions = [
            { key:'Desktop', value: 'Desktop', callback: () => this.pageBuilderService.setScreenWidth('100%'), iconName: pepIconSystemBin.name, iconPosition: 'end' },
            { key:'Tablet', value: 'Tablet', callback: () => this.pageBuilderService.setScreenWidth('800'), iconName: pepIconSystemBin.name, iconPosition: 'end' },
            { key:'Mobile', value: 'Mobile', callback: () => this.pageBuilderService.setScreenWidth('360'), iconName: pepIconSystemBin.name, iconPosition: 'end' }
        ];
        this.selectedScreenKey = 'Desktop';
        
        this.pageBuilderService.initPageBuilder();
    }

    addSection(e) {
        // const sections = this.sectionsSubject$.value;
        // sections.push(this.getEmptySection(sections.length))

        // this.sectionsSubject$.next(sections);

        // this.pageBuilderService.sectionsSubject.pipe(take(1)).subscribe(val => {
        //     const sections = [...val, this.getEmptySection(this.pageBuilderService.sectionsSubject.value.length)];
        //     this.pageBuilderService.sectionsSubject.next(sections);
        // });

        // this.pageBuilderService.sectionsSubject.pipe(take(1)).subscribe(val => {
        //     const sections = [...val, []];
        //     this.pageBuilderService.sectionsSubject.next(sections);
        // });

        this.pageBuilderService.addSection();
    }

    async publishPage() {
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

    // entered() {
    //     // this.transferringItem = undefined;
    // }

    // exited(e: CdkDragExit<string>) {
    // //   this.transferringItem = e.item.data;
    // }

    changeQueryParam(e) {
        const edit = JSON.parse(e);
        this.editable = edit;
        this.router.navigate([], { queryParams: { edit }, relativeTo: this.route})
    }

    clearPage() {
        this.pageBuilderService.clearSections();
    }

    // changeScreenSize(screenSize: PepScreenSizeType) {
    //     this.layoutService.onResize(screenSize);

    //     switch(screenSize) {
    //         case PepScreenSizeType.XL:
    //         case PepScreenSizeType.LG: // 'Desktop':
    //             this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', '100%');
    //             // this.htmlSections.forEach(section =>  this.renderer.setStyle(section.element.nativeElement, 'flex-direction', 'row'));
    //             break;
    //         case PepScreenSizeType.MD: // 'Tablet':
    //             this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', '800px');
    //             // this.htmlSections.forEach(section =>  this.renderer.setStyle(section.element.nativeElement, 'flex-direction', 'column'));
    //             break;
    //         case PepScreenSizeType.SM:
    //         case PepScreenSizeType.XS: // 'Mobile':
    //             this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', '360px');
    //             // this.htmlSections.forEach(section =>  this.renderer.setStyle(section.element.nativeElement, 'flex-direction', 'column'));
    //             break;
    //     }
    // }

    onEditSectionClick(section) {
        this.pageBuilderService.navigateToEditor({
            title: this.translate.instant('Section'),
            type : 'section',
            // currentEditableObject: section
        })
    }

    onRemoveSectionClick(sectionId: string) {
        this.pageBuilderService.removeSection(sectionId);
    }

    
    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onSectionDropped(event);
    }

}
