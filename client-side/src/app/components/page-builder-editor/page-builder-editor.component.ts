import { Component, OnInit } from '@angular/core';
import { propsSubject } from '@pepperi-addons/ngx-remote-loader';

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
  supportedPages = ['homepage'];
  twoDArray = [];
  selectedBlock = { section: null, block: null, flex: null};
  addons = [];
  constructor() { }

  ngOnInit(): void {
    propsSubject.subscribe(sections =>  {
        if (sections.length) {
            this.twoDArray = sections;
            this.addons = [].concat.apply([], sections);

            sections.forEach((section, index) => {
                this.sections.push({value: 'Section '+index, key: index});
            })
        }
    })
    this.flexArray.forEach(item => this.options.push({key: item, value: item.toString()}))
    this.supportedPages.forEach(item => this.pageTypes.push({key: item.toString(), value: item.toString()}))
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

}
