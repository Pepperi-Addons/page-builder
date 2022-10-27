import { Component, Input, OnInit } from "@angular/core";
import { PepAddonService } from "@pepperi-addons/ngx-lib";

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    
    @Input() hostObject: any;
    
    editMode: boolean = false;

    constructor(
        private pepAddonService: PepAddonService
    ) {
        //
        this.pepAddonService.setShellRouterData({ showSidebar: false, addPadding: false});

    }

    ngOnInit() {
        //        
    }
}
