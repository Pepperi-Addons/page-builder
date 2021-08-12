import { CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { Observable, ReplaySubject } from 'rxjs';
import { PageBuilderService } from '../../services/page-builder.service';
// import { subject } from '../page-builder/page-builder.component';

@Component({
    selector: 'page-builder-editor',
    templateUrl: './page-builder-editor.component.html',
    styleUrls: ['./page-builder-editor.component.scss']
})
export class PageBuilderEditorComponent implements OnInit {
    @ViewChild('availableBlocksContainer', { read: ElementRef }) availableBlocksContainer: ElementRef;

    // options: {key:any, value:string}[] = [];
    // sections: {key:any, value:string}[] = [];
    // blocks: {key:any, value:string}[] = [];
    // pageTypes: {key:any, value:string}[] = [];
    // flexArray = [0.25, 0.5, 0.75, 1, 2];
    // addons$: Observable<any[]> = null;
    // supportedPages = ['homepage'];
    // twoDArray = [];
    // selectedBlock = { section: null, block: null, flex: null};
    // tabs = ['General', 'Design'];
    availableBlocks = [];
    sectionsDropList = [];
    sizesGroupButtons;

    constructor(
        private pageBuilderService: PageBuilderService,
        private http: PepHttpService,
        private route: ActivatedRoute
    ) { }

    private initPageEditor(availableBlocks) {
        if (availableBlocks.length) {
            // this.twoDArray = blocks;
            // flatten 2d Array
            // this.addons = [].concat.apply([], sections);

            // const firstBlock = Object.create(availableBlocks[0]);
            // Object.assign(availableBlocks[0], firstBlock);
            // firstBlock.title = 'slideshow copy';
            // this.availableBlocks = [...availableBlocks, firstBlock];
            
            this.availableBlocks = availableBlocks;

            // blocks.forEach((section, index) => {
            //     this.sections.push({value: 'Section '+index, key: index});
            // })
        }

        // this.flexArray.forEach(item => this.options.push({key: item, value: item.toString()}))
        // this.supportedPages.forEach(item => this.pageTypes.push({key: item.toString(), value: item.toString()}));
        // debug locally
        // return this.http.postHttpCall('http://localhost:4500/api/init_page', {RelationName: `PageBlock` });
    }

    ngOnInit(): void {
        // const addonUUID = this.route.snapshot.params.addon_uuid
        // this.addons$ = this.http.postPapiApiCall(
        //     `/addons/api/${addonUUID}/api/init_page`,
        //     {RelationName: `PageBlock` })
        this.pageBuilderService.sectionsSubject$.subscribe(res => {
            this.sectionsDropList = res.map(section => section.id);
        })

        this.pageBuilderService.availableBlocksLoadedSubject$.subscribe(availableBlocks => {
            this.initPageEditor(availableBlocks);
        });

        this.sizesGroupButtons = [
            { key: 'None', value: 'None', callback: () => this.setScreenSpacing() },
            { key: 'SM', value: 'SM', callback: () => this.setScreenSpacing() },
            { key: 'MD', value: 'MD', callback: () => this.setScreenSpacing()},
            { key: 'LG', value: 'LG', callback: () => this.setScreenSpacing()}
        ];
    }

    setScreenSpacing() {

    }

    sectionSelected(index) {
        // this.selectedBlock.section = index;
        // this.selectedBlock.block = null;
        // this.blocks = [];
        // this.twoDArray[index].forEach((block, i) => {
        //     this.blocks.push({key: i, value: block.title})
        // })
        // propsSubject.next(this.selectedBlock);

        // this.pageBuilderService.SelectSection
    }

    blockSelected(index) {
        // this.selectedBlock.block = index;
        // this.selectedBlock.flex = null;
        // propsSubject.next(this.selectedBlock);

        // this.pageBuilderService.SelectBlock
    }

    // changeBlockSize(size) {
    //     this.selectedBlock.flex = size;
    //     propsSubject.next(this.selectedBlock);
    // }

    // currentIndex: any;
    // currentField: any;
    dragStart(event: CdkDragStart) {
        // this.currentIndex = this.availableBlocks.indexOf(event.source.data); // Get index of dragged type
        // this.currentField = this.availableBlocksContainer.nativeElement.children[this.currentIndex]; // Store HTML field
    }

    moved(event: CdkDragMove) {
        // // Check if stored HTML field is as same as current field
        // if (this.availableBlocksContainer.nativeElement.children[this.currentIndex] !== this.currentField) {
        //     // Replace current field, basically replaces placeholder with old HTML content
        //     this.availableBlocksContainer.nativeElement.replaceChild(this.currentField, this.availableBlocksContainer.nativeElement.children[this.currentIndex]);
        // }
    }
}
