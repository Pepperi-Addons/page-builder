import { Component, OnInit, Renderer2 } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'pages-manager',
    templateUrl: './pages-manager.component.html',
    styleUrls: ['./pages-manager.component.scss']
})
export class PagesManagerComponent implements OnInit {
    
    constructor(
        private renderer: Renderer2,
        private translate: TranslateService,
    ) {
        
    }

    ngOnInit() {
        
    }


}
