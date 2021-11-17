import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule, PepAddonService, PepCustomizationService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { PageBuilderComponent} from './page-builder.component';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { SectionModule } from '../section/section.module'
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { RouterModule, Routes } from '@angular/router';
import { PagesService } from 'src/app/services/pages.service';
import { NavigationService } from 'src/app/services/navigation.service';

export const routes: Routes = [
    // {
    //     path: '',
    //     redirectTo: 'block'
    // },
    // {
    //     path: 'block',
    //     component: BlockComponent
    // },
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
        PepAddonLoaderModule,
        PepSizeDetectorModule,
        DragDropModule,
        SectionModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports:[PageBuilderComponent],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
        NavigationService,
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
