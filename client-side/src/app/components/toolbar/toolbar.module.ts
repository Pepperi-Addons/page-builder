import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './toolbar.component'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';

@NgModule({
    declarations: [ToolbarComponent],
    imports: [
        CommonModule,
        DragDropModule,
        PepButtonModule
    ],
    exports: [ToolbarComponent]
})
export class ToolbarModule { }
