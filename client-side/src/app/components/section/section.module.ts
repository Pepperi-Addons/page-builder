import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionComponent } from './section.component'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { ToolbarModule } from '../toolbar/toolbar.module';
import { PepAddonLoaderModule } from '@pepperi-addons/ngx-remote-loader';

@NgModule({
    declarations: [SectionComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule,
        ToolbarModule,
        PepAddonLoaderModule
    ],
    exports: [SectionComponent]
})
export class SectionModule { }
