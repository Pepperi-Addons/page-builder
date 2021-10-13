import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlideComponent } from './slide.component'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { TranslateModule, TranslateLoader, TranslateService, TranslateStore } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { PepFileService, PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { config } from '../addon.config';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { PepColorModule } from '@pepperi-addons/ngx-lib/color';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
import { PepImageModule } from '@pepperi-addons/ngx-lib/image';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';

@NgModule({
    declarations: [SlideComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule,
        PepMenuModule,
        PepTextboxModule,
        PepCheckboxModule,
        PepPageLayoutModule,
        PepNgxLibModule,
        PepSelectModule,
        MatDialogModule,
        //PepPageLayoutModule,
        PepGroupButtonsModule,
        PepColorModule,
        PepImageModule,
        PepTextareaModule,
        MatSliderModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) => 
                    PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, config.AddonUUID),
                deps: [HttpClient, PepFileService, PepAddonService],
            }, isolate: false
        }),
    ],
    exports: [SlideComponent]
})
export class SlideModule { }
