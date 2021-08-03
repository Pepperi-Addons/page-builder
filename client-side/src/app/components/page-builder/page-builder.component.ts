import { ActivatedRoute, Router } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable, of, Subject, timer } from "rxjs";

import { map, take, tap } from "rxjs/operators";
import { propsSubject } from '@pepperi-addons/ngx-remote-loader';
import { CdkDragDrop, moveItemInArray, transferArrayItem, copyArrayItem, CdkDragExit, CdkDropListGroup, CdkDropList  } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';
import { pepIconSystemBin } from '@pepperi-addons/ngx-lib/icon';
export const subject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

@Component({
  selector: 'pep-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('section', { read: TemplateRef }) sectionTemplate:TemplateRef<any>;
    @ViewChild('sectionsCont') sectionsCont: ElementRef;

    @ViewChildren(CdkDropList) htmlSections: QueryList<CdkDropList>;
    @ViewChildren('htmlBlocks') htmlBlocks: QueryList<ElementRef>;

    editable = false;
    // carouselAddon;
    // addonsTemp = [];
    sectionsSubject$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    groupButtons;
    pageLayout;
    addons$: Observable<any[]>;

    // transferringItem: string | undefined = undefined;
    viewportWidth;
    // noSections = false;
    addonUUID;

    /* Todo - need to be removed into componnent */
    public sectionColumnArray = new Array(3);
    public numOfSectionColumns = [{key: '1',value: '1'},
                                  {key: '2',value: '2'},
                                  {key: '3',value: '3'},
                                  {key: '4',value: '4'},
                                  {key: '5',value: '5'}];

    constructor(
        private http: PepHttpService,
        private route: ActivatedRoute,
        private router: Router,
        private renderer: Renderer2,
        private vcRef: ViewContainerRef,
        private overlay: Overlay
    ) {
        this.editable = route?.snapshot?.queryParams?.edit === "true" ?? false;
        this.sectionsSubject$ = subject;
        this.viewportWidth = window.innerWidth;

        this.buildSections(null);
    }

    ngOnInit(){
        // debugger;

        this.addonUUID = this.route.snapshot.params.addon_uuid;
        this.groupButtons = [
            { value: 'Desktop', callback: () => this.changeScreenSize('Desktop'), iconName: pepIconSystemBin.name, iconPosition: 'end' },
            { value: 'Tablet', callback: () => this.changeScreenSize('Tablet'), iconName: pepIconSystemBin.name, iconPosition: 'end' },
            { value: 'Mobile', callback: () => this.changeScreenSize('Mobile'), iconName: pepIconSystemBin.name, iconPosition: 'end' }
        ];
        this.getPage(this.addonUUID).subscribe(res => {
            // sessionStorage.setItem('blocks',JSON.stringify(res['relations']));
            propsSubject.next(res['relations']);
        });


        propsSubject.subscribe(selectedBlock => {
            if (selectedBlock?.section != null) {
                this.htmlBlocks.forEach(block => {
                    this.renderer.setStyle(block.nativeElement, 'border', '2px dashed gold');
                })
                if (selectedBlock?.block != null){
                    const selectedBlockElement = this.htmlSections.get(selectedBlock.section).data.children[selectedBlock.block]
                    // selectedBlockElement ? this.renderer.setStyle(selectedBlockElement, 'border', '4px solid blue') : null;
                }

                if (selectedBlock?.flex){
                    // const selectedBlockElement = this.htmlSections.get(selectedBlock.section).nativeElement.children[selectedBlock.block]
                    // selectedBlockElement ? this.renderer.setStyle(selectedBlockElement, 'flex', selectedBlock.flex) : null;


                }
            }
        });

    }

    buildSections(sections) {
        const block = sessionStorage.getItem('blocks');
        if (block){
            const addons = JSON.parse(block);
            let layoutOutput = {};
            addons.forEach(addon => {
                if (layoutOutput[addon.layout.section] != undefined){
                    layoutOutput[addon.layout.section][addon.layout.block] = addon.Block;
                }
                else {
                    layoutOutput[addon.layout.section] = {};
                    layoutOutput[addon.layout.section][addon.layout.block] = addon.Block;
                }
            })


            Object.keys(layoutOutput).forEach((section,i) => this.addSection(null));
            setTimeout(() => {Object.keys(layoutOutput).forEach((section,i) =>{
                const currentSection = this.htmlSections.toArray()[section] ?? null;
                Object.keys(layoutOutput[section]).forEach(block => currentSection?.data?.push(layoutOutput[section][block]));
            })}, 500);

            //   sections.forEach((section, sectionIndex) => {
            //                 section.forEach((relation, blockIndex) =>  {
            //                     relation.layout.block = blockIndex;
            //                     relation.layout.section = sectionIndex;
            //                 });
            //                 section.sort((x,y) => x.layout.block - y.layout.block );
            //             });
        }

    }

    onAddonChange(e) {
        switch(e.action){
            case 'update-addons':
                propsSubject.next(e);
            break;
        }

    }

    getPage(addonUUID): Observable<any[]> {

        // debug locally
        return this.http.postHttpCall('http://localhost:4500/api/init_page', {RelationName: `PageComponent` });
        // return this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/init_page`, {RelationName: `PageComponent` });

    }

    numOfSectionColumnsChange(event) {
        const numOfColumns = parseInt(event);
        const colWidth = 100 / numOfColumns;

        this.sectionColumnArray = new Array(numOfColumns);

        for( let i=0; i<numOfColumns; i++){
            this.sectionColumnArray[i] = { 'id': i, 'width': colWidth};
        }

    }

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else if (event.previousContainer.id == 'availableBlocks'){
            copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        }
        else {
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        }
        const flatLayout = this.htmlSections.toArray()
            .map((section, sectionIndex) => section.getSortedItems()
                .map((block, blockIndex) => {
                    const flex = block.element.nativeElement.style.flexGrow != '' ?
                                block.element.nativeElement.style.flexGrow : '1'
                    return {
                        'Key': block.data.key,
                        'layout':  {
                            section: sectionIndex,
                            block: blockIndex,
                            flex: flex
                        },
                        'Block': block.data
                    }
                }
            ));
          this.pageLayout =  [].concat.apply([], flatLayout);
          sessionStorage.setItem('blocks',JSON.stringify(this.pageLayout));

    }

    removeSection(sections, i) {
        // this.noSections = sections?.length == 1 && sections[i]?.length === 0
        sections.splice(i, 1);

        // this.sectionsSubject$.getValue().splice(i, 1);
    }

    addSection(e) {
        this.sectionsSubject$.pipe(take(1)).subscribe(val => {
                const sections = [...val, []];
                this.sectionsSubject$.next(sections);
          });
    }

    editSection(section){
        section.exposedModue = section.editorModuleName;
        section.compoenntName = section.editorComponentName;
        // blockEditorSubject.next(section);
    }

    removeBlock() {

    }

    editBlock(block){
        block.exposedModue = block.editorModuleName;
        block.compoenntName = block.editorComponentName;
        // blockEditorSubject.next(block);
    }

    async publishPage(addonUUID) {
        // const body = JSON.stringify({RelationName: `PageComponent`, Layout: this.pageLayout });
        // const ans =  await this.http.postHttpCall('http://localhost:4500/api/publish', body).toPromise();
        // console.log(ans)
        // return this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/publish`, {RelationName: `PageComponent` });
        // const blocks = JSON.parse(sessionStorage.getItem('blocks'));
        // blocks.map(block => {
        //     block.layout = this.pageLayout.find(layoutBlock => layoutBlock.Key === block.key)?.layout;
        //     return block;
        // });
        sessionStorage.setItem('blocks',JSON.stringify(this.pageLayout));

    }

    entered() {
        // this.transferringItem = undefined;
    }

    exited(e: CdkDragExit<string>) {
    //   this.transferringItem = e.item.data;
    }

    changeQueryParam(e) {

        const edit = JSON.parse(e);
        this.editable = edit;
        this.router.navigate([], { queryParams: { edit, dev: true }, relativeTo: this.route})
    }

    clearPage() {
        this.sectionsSubject$.next([]);
    }

    changeScreenSize(screenSize) {
        switch(screenSize){
            case 'Desktop':
                this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', '100%');
                this.htmlSections.forEach(section =>  this.renderer.setStyle(section.element.nativeElement, 'flex-direction', 'row'));
                break;
            case 'Tablet':
                this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', '800px');
                this.renderer.setStyle(this.sectionsCont.nativeElement, 'margin', '0 auto');
                this.htmlSections.forEach(section =>  this.renderer.setStyle(section.element.nativeElement, 'flex-direction', 'column'));
                break;
            case 'Mobile':
                this.renderer.setStyle(this.sectionsCont.nativeElement, 'width', '360px');
                this.htmlSections.forEach(section =>  this.renderer.setStyle(section.element.nativeElement, 'flex-direction', 'column'));
                break;

        }

    }
}
