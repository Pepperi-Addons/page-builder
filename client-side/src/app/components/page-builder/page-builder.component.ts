import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Observable, of, Subject, timer } from "rxjs";

import { map, tap } from "rxjs/operators";
@Component({
  selector: 'pep-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {

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
        private route: ActivatedRoute
    ) {



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
                    return sections;
                }));
    }

    onAddonChange(e){
        // switch(e.action){
        //     case 'addon-loaded':


        // }
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

}
