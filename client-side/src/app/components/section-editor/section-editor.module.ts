import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionEditorComponent } from './section-editor.component'
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';

@NgModule({
    declarations: [SectionEditorComponent],
    imports: [
        CommonModule,
        PepButtonModule,
        PepTextboxModule,
        PepSelectModule,
        PepCheckboxModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
    ],
    exports: [SectionEditorComponent],
    // providers: [
    //     HttpClient,
    //     TranslateStore,
    //     // PepHttpService,
    //     // PepAddonService,
    //     // PepFileService,
    // ]
})
export class SectionEditorModule { }
