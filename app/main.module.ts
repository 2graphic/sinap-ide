// File: main.module.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application module. It is used to keep track of context
// information for the main application window.
//


import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { FormsModule } from '@angular/forms';

import { MainComponent } from "./components/main/main.component";
import { CollapsibleListComponent } from "./components/collapsible-list/collapsible-list.component";
import { SideBarComponent } from "./components/side-bar/side-bar.component";
import { PropertiesPanelComponent } from "./components/properties-panel/properties-panel.component";
import { ToolsPanelComponent } from "./components/tools-panel/tools-panel.component";
import { FilesPanelComponent } from "./components/files-panel/files-panel.component";
import { REPLComponent } from "./components/repl/repl.component";
import { TestPanelComponent } from "./components/test-panel/test-panel.component";
import { DebugPanelComponent } from "./components/debug-panel/debug-panel.component";
import { GraphEditorComponent } from "./components/graph-editor/graph-editor.component";
import { StatusBarComponent } from "./components/status-bar/status-bar.component";
import { TabBarComponent } from "./components/tab-bar/tab-bar.component";
import { BindingDirective } from "./directives/bind.directive";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        MainComponent,
        CollapsibleListComponent,
        SideBarComponent,
        PropertiesPanelComponent,
        ToolsPanelComponent,
        FilesPanelComponent,
        REPLComponent,
        TestPanelComponent,
        DebugPanelComponent,
        GraphEditorComponent,
        StatusBarComponent,
        TabBarComponent,
        BindingDirective
    ],
    bootstrap: [MainComponent]
})
export class MainModule { }
