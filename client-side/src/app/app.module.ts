import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PageBuilderModule } from './components/page-builder/page-builder.module';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { AddonModule } from './components/addon/index';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, NgZone } from '@angular/core';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { MatIconModule } from '@angular/material/icon';
import { pepIconArrowLeftAlt, PepIconModule, pepIconNumberPlus, PepIconRegistry, pepIconSystemBin, pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit, pepIconSystemMove } from '@pepperi-addons/ngx-lib/icon';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PepFileService, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepSideBarModule } from '@pepperi-addons/ngx-lib/side-bar';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { SectionEditorModule } from './components/section-editor/section-editor.module';
import { PageBuilderEditorModule } from './components/page-builder-editor/page-builder-editor.module';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';

const pepIcons = [
    pepIconSystemClose,
    pepIconNumberPlus,
    pepIconSystemBolt,
    pepIconSystemEdit,
    pepIconSystemMove,
    pepIconSystemBin,
    pepIconArrowLeftAlt
];
@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AddonModule,
        PageBuilderModule,
        PageBuilderEditorModule,
        SectionEditorModule,
        AppRoutingModule,
        PepSizeDetectorModule,
        MatIconModule,
        PepIconModule,
        PepTopBarModule,
        PepMenuModule,
        PepButtonModule,
        PepSelectModule,
        PepTextboxModule,
        PepTextareaModule,
        PepPageLayoutModule,
        PepSideBarModule,
        PepAddonLoaderModule,
        DragDropModule,
        MatCardModule,
        MatTabsModule,
        PepCheckboxModule,
        PepGroupButtonsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(private ngZone: NgZone, private pepIconRegistry: PepIconRegistry) {
        (window as any).ngZone = this.ngZone;
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}




