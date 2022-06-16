import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings.routes';

import { SettingsComponent } from './index';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { PagesManagerModule } from '../pages-manager/pages-manager.module';
import { PageManagerModule } from '../page-manager/page-manager.module';
import { PagesService } from 'src/app/services/pages.service';
import { NavigationService } from 'src/app/services/navigation.service';
import { UtilitiesService } from 'src/app/services/utilities.service';

import { config } from '../addon.config';
import { RouterModule, Routes } from '@angular/router';


export const routes: Routes = [
    {
        path: '',
        component: SettingsComponent
    }
];

@NgModule({
    declarations: [
        SettingsComponent
    ],
    imports: [
        CommonModule,
        PagesManagerModule,
        PageManagerModule,
        // SettingsRoutingModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib'], config.AddonUUID),
                deps: [PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
        NavigationService,
        UtilitiesService,
        PagesService
    ]
})
export class SettingsModule { }
