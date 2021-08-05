import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionEditorComponent } from './section-editor.component'
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';

@NgModule({
    declarations: [SectionEditorComponent],
    imports: [
        CommonModule,
        PepButtonModule,
        PepTextboxModule,
        PepSelectModule,
        PepCheckboxModule,
    ],
    exports: [SectionEditorComponent]
})
export class SectionEditorModule { }
