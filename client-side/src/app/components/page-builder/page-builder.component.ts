import { ActivatedRoute, Router } from '@angular/router';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from "@angular/core";
import { Observable } from "rxjs";
import { CdkDragDrop, CdkDropList  } from '@angular/cdk/drag-drop';
import { PageBuilderService } from '../../services/page-builder.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'page-builder',
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    // @Input() hostObject: any;
    // @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    @Input() editMode: boolean = false;
    @Input() screenSize: PepScreenSizeType;

    @ViewChild('sectionsCont') sectionsCont: ElementRef;
    

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private renderer: Renderer2,
        private translate: TranslateService,
        private layoutService: PepLayoutService,
        public pageBuilderService: PageBuilderService
    ) {
    }

    ngOnInit() {
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            this.screenSize = size;
        });

        this.pageBuilderService.initPageBuilder();
    }

    addSection(e) {
        this.pageBuilderService.addSection();
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pageBuilderService.onSectionDropped(event);
    }

}
