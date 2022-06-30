import { Component, Input, OnInit } from "@angular/core";

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    
    @Input() hostObject: any;
    
    editMode: boolean = false;

    constructor() {
        //
    }

    ngOnInit() {
        //        
    }
}
