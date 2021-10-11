import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SubAddon3Module } from './sub-addon/sub-addon-3.module';

@NgModule({
  imports: [
    BrowserModule,
    SubAddon3Module
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
