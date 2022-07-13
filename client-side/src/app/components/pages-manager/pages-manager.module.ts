import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { OverlayModule} from '@angular/cdk/overlay';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PagesManagerComponent} from './pages-manager.component';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';

import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { config } from '../addon.config';

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
        PepTopBarModule,
        //// When not using module as sub-addon please remark this for not loading twice resources
        MatCardModule,
        MatButtonModule,
        MatExpansionModule,
        PepPageLayoutModule,
        PepSelectModule,
        PepTextboxModule,
        PepMenuModule,
        PepNgxCompositeLibModule,
        PepGenericListModule,
        OverlayModule,
        PepButtonModule,
        PepCheckboxModule,
        // PepIconModule,
        MatIconModule,
        // PepRemoteLoaderModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports:[PagesManagerComponent],
    providers: [
        TranslateStore,
        // Add here all used services.
    ]
})
export class PagesManagerModule {
    constructor(
        translate: TranslateService,
        // private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService

    ) {
        // this.pepIconRegistry.registerIcons(pepIcons);
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
