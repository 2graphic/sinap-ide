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
import { GraphEditorComponent } from "./graph-editor.component";
import { GraphEditorCanvasDirective } from "./graph-editor-canvas.directive";


@NgModule({
  imports:      [
    BrowserModule
  ],
  declarations: [
    MainComponent,
    SideBarComponent,
    GraphEditorComponent,
    GraphEditorCanvasDirective
  ],
  bootstrap:    [ MainComponent ]
})
export class MainModule { }
