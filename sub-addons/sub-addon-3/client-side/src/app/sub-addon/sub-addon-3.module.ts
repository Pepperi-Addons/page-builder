import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubAddon3Component } from './sub-addon-3.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepHttpService, PepAddonService, PepFileService, PepCustomizationService, PepNgxLibModule, PepLayoutService } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepImagesFilmstripModule } from '@pepperi-addons/ngx-lib/images-filmstrip';
import { PepRichHtmlTextareaModule } from '@pepperi-addons/ngx-lib/rich-html-textarea';
import {config } from './addon.config';

@NgModule({
    declarations: [SubAddon3Component],
    imports: [
        CommonModule,
        HttpClientModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) => 
                    PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, config.AddonUUID),
                deps: [HttpClient, PepFileService, PepAddonService],
          }, isolate: false
      }),
      PepNgxLibModule,
      PepSelectModule,
      PepImagesFilmstripModule,
      PepRichHtmlTextareaModule
    ],
    exports: [SubAddon3Component],
    providers: [
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService,
        PepDialogService,
        PepLayoutService
    ]
})
export class SubAddon3Module {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
