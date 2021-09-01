import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { OverlayModule} from '@angular/cdk/overlay';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';

import { PepNgxLibModule, PepAddonService, PepCustomizationService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
import { PepIconModule, pepIconNumberPlus, PepIconRegistry, pepIconSystemBolt, pepIconSystemClose,
    pepIconSystemEdit, pepIconSystemMove, pepIconSystemBin, pepIconViewCardMd, pepIconSystemView, pepIconDeviceMobile, pepIconDeviceTablet, pepIconDeviceDesktop } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepSideBarModule } from '@pepperi-addons/ngx-lib/side-bar';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';

// import { SectionModule } from '../section/section.module'
// import { ToolbarModule } from '../toolbar/toolbar.module'
import { PageBuilderModule } from '../page-builder/page-builder.module';
import { PageBuilderEditorModule } from '../page-builder-editor/page-builder-editor.module';
import { SectionEditorModule } from '../section-editor/section-editor.module';

import { PageManagerComponent} from './page-manager.component';

const pepIcons = [
    pepIconSystemClose,
    pepIconNumberPlus,
    pepIconSystemBolt,
    pepIconSystemEdit,
    pepIconSystemMove,
    pepIconSystemBin,
    pepIconViewCardMd,
    pepIconDeviceDesktop,
    pepIconDeviceTablet,
    pepIconDeviceMobile,
    pepIconSystemView
];

const routes: Routes = [
    {
      path: '',
      component: PageManagerComponent
    }
  ];

@NgModule({
    declarations: [
        PageManagerComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepAddonLoaderModule,
        PageBuilderModule,
        PageBuilderEditorModule,
        SectionEditorModule,
        PepTopBarModule,
        MatCardModule,
        MatButtonModule,
        PepSideBarModule,
        PepMenuModule,
        PepDialogModule,
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
    exports:[PageManagerComponent],
    providers: [
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService
    ]
})
export class PageManagerModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService

    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
