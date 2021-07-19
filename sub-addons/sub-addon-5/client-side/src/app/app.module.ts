import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SubAddon5Module } from './sub-addon/index';
import { PepCarouselModule } from '@pepperi-addons/ngx-lib/carousel';

@NgModule({
  imports: [
    BrowserModule,
    SubAddon5Module,
    PepCarouselModule
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
