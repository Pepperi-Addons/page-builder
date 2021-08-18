import { CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepHttpService } from '@pepperi-addons/ngx-lib';
import { Observable, ReplaySubject } from 'rxjs';
import { AvailableBlock, PageBuilderService } from '../../services/page-builder.service';
// import { subject } from '../page-builder/page-builder.component';
import { config } from '../addon.config';

@Component({
    selector: 'page-builder-editor',
    templateUrl: './page-builder-editor.component.html',
    styleUrls: ['./page-builder-editor.component.scss']
})
export class PageBuilderEditorComponent implements OnInit {
    @ViewChild('availableBlocksContainer', { read: ElementRef }) availableBlocksContainer: ElementRef;
    
    @Input() pageName: string = '';
    @Input() pageDescription: string = '';

    isFullWidth: boolean = true;
    maxWidth = '0';

    availableBlocks: AvailableBlock[] = [];
    sectionsDropList = [];
    sizesGroupButtons;
    addonUUID: string;

    constructor(
        private pageBuilderService: PageBuilderService,
        private http: PepHttpService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // const addonUUID = this.route.snapshot.params.addon_uuid
        // this.addons$ = this.http.postPapiApiCall(
        //     `/addons/api/${addonUUID}/api/init_page`,
        //     {RelationName: `PageBlock` })
        this.addonUUID = this.route.snapshot.params.addon_uuid || config.AddonUUID;
        this.pageBuilderService.sectionsSubject$.subscribe(res => {
            this.sectionsDropList = res.map(section => section.Key);
        })

        this.pageBuilderService.initPageEditor(this.addonUUID);
        this.pageBuilderService.availableBlocksLoadedSubject$.subscribe(availableBlocks => {
            this.availableBlocks = availableBlocks;
        });

        this.sizesGroupButtons = [
            { key: 'None', value: 'None', callback: () => this.setScreenSpacing() },
            { key: 'SM', value: 'SM', callback: () => this.setScreenSpacing() },
            { key: 'MD', value: 'MD', callback: () => this.setScreenSpacing() },
            { key: 'LG', value: 'LG', callback: () => this.setScreenSpacing() }
        ];
    }

    setScreenSpacing() {

    }


    isFullWidthChange(isChecked: boolean) {
        this.isFullWidth = isChecked;

        if (this.isFullWidth) {
            this.setScreenMaxWidth('');
        } else {
            this.setScreenMaxWidth(this.maxWidth);
        }
    }

    onMaxWidthChange(maxWidth: string) {
        this.maxWidth = maxWidth;
        this.setScreenMaxWidth(maxWidth);
    }

    setScreenMaxWidth(maxWidth) {
        this.pageBuilderService.setScreenMaxWidth(maxWidth);
    }

}
