import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { propsSubject } from '@pepperi-addons/ngx-remote-loader';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'page-builder-editor',
  templateUrl: './page-builder-editor.component.html',
  styleUrls: ['./page-builder-editor.component.scss']
})
export class PageBuilderEditorComponent implements OnInit {
  options: {key:any, value:string}[] = [];
  sections: {key:any, value:string}[] = [];
  blocks: {key:any, value:string}[] = [];
  pageTypes: {key:any, value:string}[] = [];
  flexArray = [0.25, 0.5, 0.75, 1, 2];
  addons$: Observable<any[]> = null;

  supportedPages = ['homepage'];
  twoDArray = [];
  selectedBlock = { section: null, block: null, flex: null};
  addons = [];
  constructor(
    private http: PepHttpService,
    private route: ActivatedRoute

  ) { }

  ngOnInit(): void {
    // const addonUUID = this.route.snapshot.params.addon_uuid
    // this.addons$ = this.http.postPapiApiCall(
    //     `/addons/api/${addonUUID}/api/relations`,
    //     {RelationName: `PageComponent` })
    propsSubject.subscribe( res => { this.initPageEditor(res)});
  }

  sectionSelected(index){
    this.selectedBlock.section = index;
    this.selectedBlock.block = null;
      this.blocks = [];
    this.twoDArray[index].forEach((block, i) => {
        this.blocks.push({key: i, value: block.title})
    })
    propsSubject.next(this.selectedBlock);

  }

  blockSelected(index){
    this.selectedBlock.block = index;
    this.selectedBlock.flex = null;
    propsSubject.next(this.selectedBlock);

  }

  changeBlockSize(size){
    this.selectedBlock.flex = size;
    propsSubject.next(this.selectedBlock);
  }

  initPageEditor(sections) {
    if (sections.length) {
        this.twoDArray = sections;
        // flatten 2d Array
        // this.addons = [].concat.apply([], sections);
        this.addons =  sections;

        sections.forEach((section, index) => {
            this.sections.push({value: 'Section '+index, key: index});
        })
    }
    this.flexArray.forEach(item => this.options.push({key: item, value: item.toString()}))
    this.supportedPages.forEach(item => this.pageTypes.push({key: item.toString(), value: item.toString()}));
    // debug locally
    // return this.http.postHttpCall('http://localhost:4500/api/relations', {RelationName: `PageComponent` });

  }

}
