import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, Renderer2, ViewChild, ViewChildren } from "@angular/core";
import { Observable, of, Subject, timer } from "rxjs";

import { map, tap } from "rxjs/operators";
import { propsSubject } from '@pepperi-addons/ngx-remote-loader';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
@Component({
  selector: 'pep-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {

    @ViewChildren('htmlSections') htmlSections: QueryList<ElementRef>;
    @ViewChildren('htmlBlocks') htmlBlocks: QueryList<ElementRef>;
    editable = false;
    carouselAddon;
    addonsTemp = [];
    addons$: Observable<any[]>;
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    sections$: Observable<any[]>;
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
        private renderer: Renderer2
    ) {
        this.editable = route?.snapshot?.queryParams?.edit === "true" ?? false;


    }

    ngOnInit(){
        this.sections$ = this.getRelations(this.route.snapshot.params.addon_uuid)
            .pipe(
                map( res => {
                    const firstSection = res['relations'].pop();
                    firstSection.layout.block = 0;
                    firstSection.layout.section = 0;
                    const lastSection = res['relations'].pop();
                    lastSection.layout.block = 0;
                    lastSection.layout.section = 2;
                    const middleSection = res['relations'];
                    const sections = [[firstSection], middleSection, [lastSection]];
                    sections.forEach((section, sectionIndex) => {
                        section.forEach((relation, blockIndex) =>  {
                            relation.layout.block = blockIndex;
                            relation.layout.section = sectionIndex;
                        });
                        section.sort((x,y) => x.layout.block - y.layout.block );
                    })
                    propsSubject.next(sections);
                    return sections;

                }));


        propsSubject.subscribe(selectedBlock => {
        if (selectedBlock?.section != null) {
            this.htmlBlocks.forEach(block => {
                this.renderer.setStyle(block.nativeElement, 'border', '2px dashed gold');
            })
            if (selectedBlock?.block != null){
                const selectedBlockElement = this.htmlSections.get(selectedBlock.section).nativeElement.children[selectedBlock.block]
                selectedBlockElement ? this.renderer.setStyle(selectedBlockElement, 'border', '2px solid blue') : null;
            }

            if (selectedBlock?.flex){
                const selectedBlockElement = this.htmlSections.get(selectedBlock.section).nativeElement.children[selectedBlock.block]
                selectedBlockElement ? this.renderer.setStyle(selectedBlockElement, 'flex', selectedBlock.flex) : null;


            }
        }

        });

    }

    onAddonChange(e){
        switch(e.action){
            case 'update-addons':
                propsSubject.next(e);
            break;
        }

    }

    getRelations(addonUUID): Observable<any[]> {

        // debug locally
        return this.http.postHttpCall('http://localhost:4500/api/relations', {RelationName: `PageComponent` });
        // return this.http.postPapiApiCall(`/addons/api/${addonUUID}/api/relations`, {RelationName: `PageComponent` });

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
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    }

}
