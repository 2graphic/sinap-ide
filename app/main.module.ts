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

import { InlineSVGModule } from 'ng-inline-svg';
import { ResizableModule } from 'angular-resizable-element';

import { MainComponent } from "./components/main/main.component";
import { CollapsibleListComponent } from "./components/collapsible-list/collapsible-list.component";
import { DynamicPanelComponent, DynamicPanelDirective } from "./components/dynamic-panel/dynamic-panel";
import { PropertiesPanelComponent } from "./components/properties-panel/properties-panel.component";
// import { ToolsPanelComponent } from "./components/tools-panel/tools-panel.component";
import { FilesPanelComponent } from "./components/files-panel/files-panel.component";
import { InputPanelComponent } from "./components/input-panel/input-panel.component";
import { TestPanelComponent } from "./components/test-panel/test-panel.component";
import { GraphEditorComponent } from "./components/graph-editor/graph-editor.component";
import { StatusBarComponent } from "./components/status-bar/status-bar.component";
import { TabBarComponent } from "./components/tab-bar/tab-bar.component";

import { TypeInjectorComponent } from "./components/types/type-injector/type-injector.component";
import { StringTypeComponent } from "./components/types/string-type/string-type.component";
import { BooleanTypeComponent } from "./components/types/boolean-type/boolean-type.component";
import { ObjectTypeComponent } from "./components/types/object-type/object-type.component";
// import { NodeTypeComponent } from "./components/types/node-type/node-type.component";
// import { ListTypeComponent } from "./components/types/list-type/list-type.component";
import { UnionTypeComponent } from "./components/types/union-type/union-type.component";
import { NumberTypeComponent } from "./components/types/number-type/number-type.component";
import { ColorTypeComponent } from "./components/types/color-type/color-type.component";
// import { MapTypeComponent } from "./components/types/map-type/map-type.component";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        InlineSVGModule,
        ResizableModule,
    ],
    declarations: [
        MainComponent,
        CollapsibleListComponent,
        DynamicPanelComponent,
        DynamicPanelDirective,
        PropertiesPanelComponent,
        // ToolsPanelComponent,
        FilesPanelComponent,
        InputPanelComponent,
        TestPanelComponent,
        GraphEditorComponent,
        StatusBarComponent,
        TabBarComponent,
        TypeInjectorComponent,
        StringTypeComponent,
        BooleanTypeComponent,
        ObjectTypeComponent,
        // NodeTypeComponent,
        // ListTypeComponent,
        UnionTypeComponent,
        NumberTypeComponent,
        ColorTypeComponent,
        // MapTypeComponent,
        // ListTypeComponent,
    ],
    entryComponents: [
        CollapsibleListComponent,
        FilesPanelComponent,
        PropertiesPanelComponent,
        // ToolsPanelComponent,
        TestPanelComponent,
        InputPanelComponent,
    ],
    bootstrap: [MainComponent]
})
export class MainModule { }
