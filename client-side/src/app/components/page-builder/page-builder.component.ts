import { ActivatedRoute, Router } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable, of, Subject, timer } from "rxjs";

import { map, take, tap } from "rxjs/operators";
import { propsSubject } from '@pepperi-addons/ngx-remote-loader';
import { CdkDragDrop, moveItemInArray, transferArrayItem, copyArrayItem, CdkDragExit, CdkDropListGroup, CdkDropList  } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';
export const subject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

@Component({
  selector: 'pep-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss']
})

export class PageBuilderComponent implements OnInit {

    @ViewChild(CdkDropListGroup) listGroup: CdkDropListGroup<CdkDropList>;

    @ViewChildren(CdkDropList) htmlSections: QueryList<CdkDropList>;
    @ViewChildren('htmlBlocks') htmlBlocks: QueryList<ElementRef>;
    editable = false;
    carouselAddon;
    sectionsSubject$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    addonsTemp = [];
    groupButtons;
    pageLayout;
    addons$: Observable<any[]>;
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild('section', { read: TemplateRef }) sectionTemplate:TemplateRef<any>;
    transferringItem: string | undefined = undefined;
    viewportWidth;
    noSections = false;
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

    }

    ngOnInit(){
        this.groupButtons = [
            { key: '', value: 'Desktop', class: 'system', callback: null, icon: null },
            { key: '', value: 'Tablet', class: 'system', callback: null, icon: null },
            { key: '', value: 'Mobile', class: 'system', callback: null, icon: null }
        ];
        this.getPage(this.route.snapshot.params.addon_uuid)
            .subscribe(res => propsSubject.next(res['relations']));


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

    buildSections(sections){
          sections.forEach((section, sectionIndex) => {
                        section.forEach((relation, blockIndex) =>  {
                            relation.layout.block = blockIndex;
                            relation.layout.section = sectionIndex;
                        });
                        section.sort((x,y) => x.layout.block - y.layout.block );
                    });
    }

    onAddonChange(e){
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

    numOfSectionColumnsChange(event){
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
                        'key': block.data.key,
                        'layout':  {
                            section: sectionIndex,
                            block: blockIndex,
                            flex: flex
                        }
                        }
                    }
            ));
          this.pageLayout =  [].concat.apply([], flatLayout);

    }

    remove(section, i){
        this.noSections = section?.length == 1 && section[i]?.length === 0
        section.splice(i, 1);
    }

    addSection(e){
        this.sectionsSubject$.pipe(take(1)).subscribe(val => {
                const sections = [...val, []];
                this.sectionsSubject$.next(sections);
          });
    }

    publishPage(){
        // this.http.postPapiApiCall('/addons/api')
        debugger;
    }

    entered() {
        this.transferringItem = undefined;
    }

    exited(e: CdkDragExit<string>) {
      this.transferringItem = e.item.data;
    }

    changeQueryParam(e){

        const edit = JSON.parse(e);
        this.editable = edit;
        this.router.navigate([], { queryParams: { edit, dev: true }, relativeTo: this.route})
    }
}
