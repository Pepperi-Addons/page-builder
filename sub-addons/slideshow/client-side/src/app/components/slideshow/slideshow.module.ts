import { MatCardModule } from '@angular/material/card';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { SlideshowService } from './slideshow.service';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepHttpService, PepFileService, PepNgxLibModule, PepAddonService, PepCustomizationService } from '@pepperi-addons/ngx-lib';
import { SlideshowComponent } from './index';
import {PepperiTableComponent} from './pepperi-table.component'
import { MatDialogModule } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';

import { config } from '../addon.config';

@NgModule({
    declarations: [
        SlideshowComponent,
        PepperiTableComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        MatDialogModule,
        MatCardModule,
        // When not using module as sub-addon please remark this for not loading twice resources
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) => 
                    PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, config.AddonUUID),
                deps: [HttpClient, PepFileService, PepAddonService],
            }, isolate: false
        }),
        PepNgxLibModule,
        PepButtonModule,
        PepSelectModule,
        PepTopBarModule,
        PepListModule,
        PepPageLayoutModule
    ],
    exports:[SlideshowComponent],
    providers: [
        SlideshowService,
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService,
        PepDialogService
    ]
})
export class SlideshowModule {
    constructor(
        translate: TranslateService,
        private addonService: PepAddonService,
    ) {
        this.addonService.setDefaultTranslateLang(translate);
    }
}
