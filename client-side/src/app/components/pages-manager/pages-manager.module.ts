import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PepIconModule, pepIconNumberPlus, PepIconRegistry,
    pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit,
pepIconSystemMove, pepIconSystemBin, pepIconViewCardMd } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule, PepAddonService, PepCustomizationService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { PagesManagerComponent} from './pages-manager.component';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { OverlayModule} from '@angular/cdk/overlay';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { RouterModule, Routes } from '@angular/router';

const pepIcons = [
    pepIconSystemClose,
    pepIconNumberPlus,
    pepIconSystemBolt,
    pepIconSystemEdit,
    pepIconSystemMove,
    pepIconSystemBin,
    pepIconViewCardMd
];

const routes: Routes = [
    {
      path: '',
      component: PagesManagerComponent
    }
  ];

@NgModule({
    declarations: [
        PagesManagerComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepAddonLoaderModule,
        PepTopBarModule,
        //// When not using module as sub-addon please remark this for not loading twice resources
        MatCardModule,
        MatButtonModule,
        PepPageLayoutModule,
        PepSelectModule,
        PepTextboxModule,
        OverlayModule,
        PepButtonModule,
        PepCheckboxModule,
        PepIconModule,
        MatIconModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports:[PagesManagerComponent],
    providers: [
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService
    ]
})
export class PagesManagerModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService

    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
