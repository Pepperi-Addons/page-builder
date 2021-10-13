import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepHttpService, PepFileService, PepNgxLibModule, PepAddonService, PepCustomizationService } from '@pepperi-addons/ngx-lib';
import { SlideshowComponent } from './slideshow.component';
import { SlideModule } from '../slide/slide.module';
// import { PepperiTableComponent } from './pepperi-table.component'
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { config } from '../addon.config';

@NgModule({
    declarations: [
        SlideshowComponent,
        // PepperiTableComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        SlideModule,
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
        PepPageLayoutModule
    ],
    exports:[SlideshowComponent],
    providers: [
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
