import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { MatTabsModule } from '@angular/material/tabs';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
import { PepIconModule, pepIconNumberPlus, PepIconRegistry,
    pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit,
pepIconSystemMove, pepIconSystemBin, pepIconViewCardLg, pepIconViewCardMd } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule  } from '@pepperi-addons/ngx-lib';
import { PageBuilderEditorComponent} from  './page-builder-editor.component';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { OverlayModule} from '@angular/cdk/overlay';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { SectionEditorModule } from '../section-editor/section-editor.module';

const pepIcons = [
    pepIconSystemClose,
    pepIconNumberPlus,
    pepIconSystemBolt,
    pepIconSystemEdit,
    pepIconSystemMove,
    pepIconSystemBin,
    pepIconViewCardMd
];

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
        PepIconModule,
        PepTextareaModule,
        SectionEditorModule
    ],
    exports:[PageBuilderEditorComponent],
    providers: [

    ]
})
export class PageBuilderEditorModule {
    constructor(private pepIconRegistry: PepIconRegistry) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
