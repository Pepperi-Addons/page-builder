import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionComponent } from './section.component';
import { SectionBlockModule } from '../section-block/section-block.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { ToolbarModule } from '../toolbar/toolbar.module';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';

@NgModule({
    declarations: [SectionComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule,
        ToolbarModule,
        PepAddonLoaderModule,
        SectionBlockModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: PepAddonService.createDefaultMultiTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        })
    ],
    exports: [SectionComponent]
})
export class SectionModule { }
