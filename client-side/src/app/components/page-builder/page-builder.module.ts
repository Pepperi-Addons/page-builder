import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { NavigationService } from 'src/app/services/navigation.service';
import { PagesService } from 'src/app/services/pages.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
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
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib']),
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
export class PageBuilderModule {}
