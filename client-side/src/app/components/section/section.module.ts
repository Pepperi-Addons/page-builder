import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionComponent } from './section.component'
import {DragDropModule} from '@angular/cdk/drag-drop';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';


@NgModule({
  declarations: [SectionComponent],
  imports: [
    CommonModule,
    DragDropModule,
    PepButtonModule
  ],
  exports: [SectionComponent]
})
export class SectionModule { }
