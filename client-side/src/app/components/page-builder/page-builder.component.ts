import { Component, Input, OnInit } from "@angular/core";
import { PepAddonService } from "@pepperi-addons/ngx-lib";
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
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,
    ) {
        super();
        //
        this.pepAddonService.setShellRouterData({ addPadding: false });
    }

    ngOnInit() {
    }
}
