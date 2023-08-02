import { Component, Input, OnInit } from "@angular/core";
import { PagesService } from '../../services/pages.service';
import { BaseDestroyerComponent } from "../base/base-destroyer.component";

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss'],
    providers: [ PagesService ]
})
export class PageBuilderComponent extends BaseDestroyerComponent implements OnInit {
    
    @Input() hostObject: any;
    
    editMode: boolean = false;

    constructor(
        private pagesService: PagesService,
    ) {
        super();
        //
        // this.pepAddonService.setShellRouterData({ showSidebar: false, addPadding: false});
    }

    ngOnInit() {
    }
}
