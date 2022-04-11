import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionComponent } from './section.component';
import { SectionBlockModule } from '../section-block/section-block.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
// import { ToolbarModule } from '../toolbar/toolbar.module';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { HideInModule } from '../hide-in/hide-in.module';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';

@NgModule({
    declarations: [SectionComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule,
        // ToolbarModule,
        PepRemoteLoaderModule,
        SectionBlockModule,
        HideInModule,
        PepDraggableItemsModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        })
    ],
    exports: [SectionComponent]
})
export class SectionModule { }
