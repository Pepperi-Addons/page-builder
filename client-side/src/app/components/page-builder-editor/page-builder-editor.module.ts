import { MatTabsModule } from '@angular/material/tabs';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
// import { PepIconModule, pepIconNumberPlus, PepIconRegistry,
//     pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit,
// pepIconSystemMove, pepIconSystemBin, pepIconViewCardLg, pepIconViewCardMd } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepAddonService, PepFileService, PepHttpService, PepNgxLibModule  } from '@pepperi-addons/ngx-lib';
import { PageBuilderEditorComponent} from  './page-builder-editor.component';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { OverlayModule} from '@angular/cdk/overlay';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule, } from '@pepperi-addons/ngx-lib/textarea';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { SectionEditorModule } from '../section-editor/section-editor.module';
import { ToolbarModule } from '../toolbar/toolbar.module'
import { TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepColorModule } from '@pepperi-addons/ngx-lib/color';
// const pepIcons = [
//     pepIconSystemClose,
//     pepIconNumberPlus,
//     pepIconSystemBolt,
//     pepIconSystemEdit,
//     pepIconSystemMove,
//     pepIconSystemBin,
//     pepIconViewCardMd
// ];

@NgModule({
    declarations: [
        PageBuilderEditorComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepAddonLoaderModule,
        PepSelectModule,
        PepTextboxModule,
        DragDropModule,
        OverlayModule,
        MatTabsModule,
        PepButtonModule,
        PepCheckboxModule,
        PepGroupButtonsModule,
        PepColorModule,
        PepTextareaModule,
        SectionEditorModule,
        ToolbarModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
    ],
    exports:[PageBuilderEditorComponent],
    providers: [
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
    ]
})
export class PageBuilderEditorModule {
    constructor(
        // private pepIconRegistry: PepIconRegistry
        ) {
        // this.pepIconRegistry.registerIcons(pepIcons);
    }
}
