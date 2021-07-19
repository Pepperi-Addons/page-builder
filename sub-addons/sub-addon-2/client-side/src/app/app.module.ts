import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SubAddon2Module } from './sub-addon/index';

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
