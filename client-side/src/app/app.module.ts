import { NgModule, NgZone } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { shareNgZone } from '@angular-architects/module-federation-tools';

import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { pepIconArrowLeftAlt, PepIconModule, pepIconNumberPlus, PepIconRegistry, pepIconSystemBin, pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit, pepIconSystemMove } from '@pepperi-addons/ngx-lib/icon';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PepFileService, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepSideBarModule } from '@pepperi-addons/ngx-lib/side-bar';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { PagesManagerModule } from './components/pages-manager/pages-manager.module';
import { PageManagerModule } from './components/page-manager/page-manager.module';
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
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        PagesManagerModule,
        PageManagerModule,
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
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(private ngZone: NgZone, private pepIconRegistry: PepIconRegistry) {
        // (window as any).ngZone = this.ngZone;
        shareNgZone(ngZone);
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}