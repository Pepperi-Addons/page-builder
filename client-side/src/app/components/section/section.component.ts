import { Component, ElementRef, Input, OnChanges, OnInit, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
    selector: 'page-builder-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnChanges {
    @ViewChildren('htmlSections') htmlSections: QueryList<ElementRef>;
    @ViewChildren('htmlBlocks') htmlBlocks: QueryList<ElementRef>;

    @Input() editable = false;
    @Input() numOfBlocks = 3;
    @Input() sectionBlockArray;

    public numOfBlocksArr = new Array(0);


    @ViewChild('sectionContainer') sectionContainer: ElementRef;

    // @Input() partsNumber: number = 1;
    @Input() splitData: string;

    constructor() {

    }
    
    ngOnInit(): void {
        this.sectionBlockArray = new Array(0);
        for(let i=0;i<this.numOfBlocks;i++){
            this.sectionBlockArray.push({ 'index': i, 'id': 'block_'+ i});
        }

    }

    ngOnChanges(changes: SimpleChanges): void {
        throw new Error('Method not implemented.');
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.sectionBlockArray, event.previousIndex, event.currentIndex);

    }

    removeBlock(id){
        for(let i=0;i<this.sectionBlockArray.length;i++){
            if( this.sectionBlockArray[i].id === id){
                this.sectionBlockArray.splice(i , 1);
            }
        }
    }
    addBlock(event){
        if(this.sectionBlockArray.length < 12){
            this.sectionBlockArray.push({  'id': 'block_'+ this.sectionBlockArray.length+1});
        }
        else{
            alert("reached to maximum columns !")
        }
    }
}
