import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';

import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';

import { pepIconArrowLeftAlt, pepIconNumberPlus, PepIconRegistry, pepIconSystemBin, pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit, pepIconSystemMove } from '@pepperi-addons/ngx-lib/icon';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { PagesManagerModule } from './components/pages-manager/pages-manager.module';
import { PageManagerModule } from './components/page-manager/page-manager.module';
import { SettingsComponent, SettingsModule } from './components/settings';
import { PageBuilderComponent, PageBuilderModule } from './components/page-builder';
import { AppComponent } from './app.component';

import { config } from './components/addon.config';
import { AppRoutingModule } from './app.routes';

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
        SettingsModule,
        PageBuilderModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        })
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ],
    bootstrap: [
        // AppComponent
    ]
})
export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService,
        private pepIconRegistry: PepIconRegistry
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
        this.pepAddonService.setDefaultTranslateLang(translate);
    }

    ngDoBootstrap() {
        customElements.define(`settings-element-${config.AddonUUID}`, createCustomElement(SettingsComponent, {injector: this.injector}));
        customElements.define(`pages-element-${config.AddonUUID}`, createCustomElement(PageBuilderComponent, {injector: this.injector}));
    }
}