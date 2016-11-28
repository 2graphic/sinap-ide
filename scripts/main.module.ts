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
import { AboutComponent } from "./about.component";
import { PropertiesPanelComponent } from "./properties-panel.component";
import { ToolsPanelComponent } from "./tools-panel.component";
import { REPLComponent } from "./repl.component";
import { FormsModule }   from '@angular/forms';
import { GraphEditorComponent } from "./graph-editor.component";

@NgModule({
  imports:      [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    MainComponent,
    SideBarComponent,
    AboutComponent,
    PropertiesPanelComponent,
    ToolsPanelComponent,
    REPLComponent,
    GraphEditorComponent
  ],
  bootstrap:    [ MainComponent ]
})
export class MainModule { }
