import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagesService } from '../../services/pages.service';

@Component({
    selector: 'addon-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    providers: [ PagesService ]
})
export class SettingsComponent implements OnInit {

    constructor(
        protected route: ActivatedRoute, 
        private router: Router,
        private pagesService: PagesService,
    ) { }

    ngOnInit(): void {
        
    }

}
