import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings.routes';

import { SettingsComponent } from './index';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { config } from '../addon.config';
import { NavigationService } from '../../services/navigation.service';
import { UtilitiesService } from '../../services/utilities.service';
import { PagesService } from '../../services/pages.service';


@NgModule({
    declarations: [
        SettingsComponent
    ],
    imports: [
        CommonModule,
        SettingsRoutingModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib'], config.AddonUUID),
                deps: [PepAddonService]
            }, isolate: false
        }),
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
