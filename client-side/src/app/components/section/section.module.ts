import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionComponent } from './section.component'
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [SectionComponent],
  imports: [
    CommonModule,
    DragDropModule
  ],
  exports: [SectionComponent]
})
export class SectionModule { }
