import { Component, Input, OnInit } from "@angular/core";
import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { PagesService } from '../../services/pages.service';

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss'],
    providers: [ PagesService ]
})
export class PageBuilderComponent implements OnInit {
    
    @Input() hostObject: any;
    
    editMode: boolean = false;

    constructor(
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,
    ) {
        //
        // this.pepAddonService.setShellRouterData({ showSidebar: false, addPadding: false});

    }

    ngOnInit() {
        //        
    }
}
