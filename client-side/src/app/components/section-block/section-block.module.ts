import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBlockComponent } from './section-block.component'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { ToolbarModule } from '../toolbar/toolbar.module';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';

@NgModule({
    declarations: [SectionBlockComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule,
        ToolbarModule,
        PepAddonLoaderModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
    ],
    exports: [SectionBlockComponent],
    // providers: [
    //     HttpClient,
    //     TranslateStore,
    //     // PepHttpService,
    //     // PepAddonService,
    //     // PepFileService,
    // ]
})
export class SectionBlockModule { }
