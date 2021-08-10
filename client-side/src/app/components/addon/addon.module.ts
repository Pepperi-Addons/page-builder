import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { MatCardModule } from '@angular/material/card';
import { AddonService } from './addon.service';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
// import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepHttpService, PepFileService, PepNgxLibModule, PepAddonService, PepCustomizationService } from '@pepperi-addons/ngx-lib';
import { AddonComponent } from './index';
import { MatDialogModule } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

@NgModule({
    declarations: [
        AddonComponent
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
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
        // Example for importing tree-shakeable @pepperi-addons/ngx-lib components to a module
        PepNgxLibModule,
        PepButtonModule,
        PepSelectModule,
        PepTopBarModule,
        PepCheckboxModule
    ],
    exports:[AddonComponent],
    providers: [
        AddonService,
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService,
        PepDialogService
    ]
})
export class AddonModule {
    constructor(
          translate: TranslateService,
          private pepAddonService: PepAddonService
      ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
