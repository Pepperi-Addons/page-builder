import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { pepIconArrowLeftAlt, PepIconModule, pepIconNumberPlus, PepIconRegistry, pepIconSystemBin, pepIconSystemBolt, pepIconSystemClose, pepIconSystemEdit, pepIconSystemMove } from '@pepperi-addons/ngx-lib/icon';
import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { SettingsComponent, SettingsModule } from './components/settings';
import { PageBuilderComponent } from './components/page-builder';

import { config } from './components/addon.config';

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
        SettingsModule,
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
        // const ce = createCustomElement(AppComponent, {injector: this.injector});
        // customElements.define('assets', ce);
    
        customElements.define('settings-element', createCustomElement(SettingsComponent, {injector: this.injector}));
        customElements.define('pages-element', createCustomElement(PageBuilderComponent, {injector: this.injector}));
    }
}