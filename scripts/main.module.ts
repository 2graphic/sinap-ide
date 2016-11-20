// File: main.module.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application module. It is used to keep track of context
// information for the main application window.
//


import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { MainComponent }    from "./main.component";
import { SideBarComponent } from "./side-bar.component";
import {REPLComponent} from "./repl.component";
import { FormsModule }   from '@angular/forms';

@NgModule({
  imports:      [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    MainComponent,
    SideBarComponent,
    REPLComponent
  ],
  bootstrap:    [ MainComponent, REPLComponent ]
})
export class MainModule { }
