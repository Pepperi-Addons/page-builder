import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubAddon2Component } from './index';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepHttpService, PepAddonService, PepFileService, PepCustomizationService, PepNgxLibModule, PepLayoutService } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepImagesFilmstripModule } from '@pepperi-addons/ngx-lib/images-filmstrip';

@NgModule({
    declarations: [SubAddon2Component],
    imports: [
        CommonModule,
        HttpClientModule,
        // MatDialogModule,
        // MatCardModule,
        // //// When not using module as sub-addon please remark this for not loading twice resources
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
        // //// Example for importing tree-shakeable @pepperi-addons/ngx-lib components to a module
        PepNgxLibModule,
        // PepButtonModule,
        PepSelectModule,
        PepImagesFilmstripModule
        // PepTopBarModule,
        // PepListModule
    ],
    exports: [SubAddon2Component],
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
export class SubAddon2Module {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {

        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
