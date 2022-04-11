import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule, PepAddonService, PepCustomizationService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { PageBuilderComponent} from './index';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { SectionModule } from '../section/section.module'
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { RouterModule, Routes } from '@angular/router';
import { PagesService } from 'src/app/services/pages.service';
import { NavigationService } from 'src/app/services/navigation.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';

export const routes: Routes = [
    {
        path: '',
        component: PageBuilderComponent
    }
];

@NgModule({
    declarations: [
        PageBuilderComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepRemoteLoaderModule,
        PepSizeDetectorModule,
        PepDialogModule,
        DragDropModule,
        SectionModule,
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
export class PageBuilderModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
