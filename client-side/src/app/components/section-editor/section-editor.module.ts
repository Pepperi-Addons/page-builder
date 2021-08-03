import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionEditorComponent } from './section-editor.component'
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';

@NgModule({
    declarations: [SectionEditorComponent],
    imports: [
        CommonModule,
        PepButtonModule
    ],
    exports: [SectionEditorComponent]
})
export class SectionEditorModule { }
