import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBlockComponent } from './section-block.component'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
// import { ToolbarModule } from '../toolbar/toolbar.module';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { HideInModule } from '../hide-in/hide-in.module';
import { PepDraggableItemModule } from '@pepperi-addons/ngx-composite-lib/draggable-item';

@NgModule({
    declarations: [SectionBlockComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule,
        // ToolbarModule,
        PepAddonLoaderModule,
        HideInModule,
        PepDraggableItemModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
    ],
    exports: [SectionBlockComponent]
})
export class SectionBlockModule { }
