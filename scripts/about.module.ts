// File: about.module.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AboutComponent } from "./about.component";


@NgModule({
  imports:      [
    BrowserModule
  ],
  declarations: [
    AboutComponent
  ],
  bootstrap:    [ AboutComponent ]
})
export class AboutModule { }
