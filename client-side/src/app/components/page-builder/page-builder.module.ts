import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { NavigationService } from '../../services/navigation.service';
import { PagesService } from '../../services/pages.service';
import { UtilitiesService } from '../../services/utilities.service';
import { config } from '../addon.config';
import { PageBuilderInternalModule } from '../page-builder-internal';

import { PageBuilderComponent} from './index';

export const routes: Routes = [
    {
        path: '',
        component: PageBuilderComponent
    }
];

@NgModule({
    declarations: [
        PageBuilderComponent,
    ],
    imports: [
        CommonModule,
        PageBuilderInternalModule,
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
    exports:[PageBuilderComponent],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
        NavigationService,
        UtilitiesService,
        PagesService
    ]
})
export class PageBuilderModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
