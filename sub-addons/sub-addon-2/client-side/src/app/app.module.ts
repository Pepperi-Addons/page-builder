import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SubAddon2Module } from './sub-addon/sub-addon-2.module';
import { SubAddon2EditorModule } from './sub-addon-editor/sub-addon-2-editor.module';

@NgModule({
  imports: [
    BrowserModule,
    SubAddon2Module
  ],
  declarations: [
    AppComponent

  ],
  providers: [],
  bootstrap: [
      AppComponent
  ]
})
export class AppModule { }
