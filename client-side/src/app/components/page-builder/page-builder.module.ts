import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
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
import { PageBuilderComponent} from './page-builder.component';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { OverlayModule} from '@angular/cdk/overlay';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { SectionModule } from '../section/section.module'
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { DragDropModule } from '@angular/cdk/drag-drop';
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
        PepTopBarModule,
        //// When not using module as sub-addon please remark this for not loading twice resources
        MatCardModule,
        MatButtonModule,
        SectionModule,
        PepPageLayoutModule,
        PepSelectModule,
        PepTextboxModule,
        DragDropModule,
        OverlayModule,
        PepButtonModule,
        PepCheckboxModule,
        PepGroupButtonsModule,
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
    exports:[PageBuilderComponent],
    providers: [
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService
    ]
})
export class PageBuilderModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry

    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
        let userLang = 'en';
        translate.setDefaultLang(userLang);
        userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available

        if (location.href.indexOf('userLang=en') > -1) {
            userLang = 'en';
        }
        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use(userLang).subscribe((res: any) => {
            // In here you can put the code you want. At this point the lang will be loaded
        });
    }
}
