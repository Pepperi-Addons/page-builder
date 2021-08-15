import { ActivatedRoute, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AddonService } from './components/addon/addon.service';
import { Component, OnInit } from '@angular/core';
import { PepCustomizationService, PepLoaderService, PepStyleType } from '@pepperi-addons/ngx-lib';
import { Editor, PageBuilderService } from './services/page-builder.service';

@Component({
    selector: 'addon-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    showEditor = false;
    currentEditor: Editor;
    
    constructor(
        public customizationService: PepCustomizationService,
        public loaderService: PepLoaderService,
        public addonService: AddonService,
        private route: ActivatedRoute,
        private router: Router,
        private pageBuilderService: PageBuilderService
    ) {
        this.pageBuilderService.onEditorChange$.subscribe((editor) => {
            this.currentEditor = editor;
        });
    }

    ngOnInit() {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(res => {
            const queryParams = this.route.snapshot.queryParams;
            this.showEditor = queryParams?.edit === "true" ?? false;
        })
    }

    onBlockEditorChange(event: any) {

    }

    triggerPublish() {
    }

    navigateBackFromEditor() {
        this.pageBuilderService.navigateBackFromEditor();
    }
}
