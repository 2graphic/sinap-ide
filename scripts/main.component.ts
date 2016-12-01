// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "./menu.service"
import { GraphEditorComponent, EditorDelegate, DrawableNode, DrawableGraph, DrawableEdge } from "./graph-editor.component"
import { PluginService, Interpreter } from "./plugin.service"
import { REPLComponent, REPLDelegate } from "./repl.component"
import { PropertiesPanelComponent } from "./properties-panel.component"


@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService, PluginService]
})
export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, EditorDelegate {
  constructor(private menu: MenuService, private pluginService: PluginService) {}
  
  selectedElements : Set<DrawableGraph | DrawableNode | DrawableEdge> =
    new Set<DrawableGraph | DrawableNode | DrawableEdge>();
  selectElement(element : DrawableGraph | DrawableNode | DrawableEdge) {
    this.selectedElements.add(element);
  }
  deselectElement(element : DrawableGraph | DrawableNode | DrawableEdge) {
    this.selectedElements.delete(element);
  }
  clearSelected() {
    this.selectedElements.clear();
  }


  ngOnInit(): void {
    this.repl.delegate = this;
    this.graphEditor.delegate = this;

    this.menu.addEventListener(this);
  }

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  @ViewChild(REPLComponent)
  private repl: REPLComponent;
  
  @ViewChild(PropertiesPanelComponent)
  private propertiesPanel: REPLComponent;


  // Declare icons for the sidebar.
  private icons = [
    {
      path: "properties.svg",
      name: "Properties",
      active: true
    },
    {
      path: "tools.svg",
      name: "Tools",
      active: false
    },
    {
      path: "files.svg",
      name: "Files",
      active: false
    }
  ];
  private propertiesIcon = this.icons[0];
  private toolsIcon = this.icons[1];
  // ------------------------------


  menuEvent(e: MenuEvent) {
    switch (e) {
      case MenuEvent.NEW_FILE:
        this.graphEditor.graph = null;
        break;
    }
  }

  run(input: String):String {
    let interpreter = this.pluginService.getInterpreter("dfa", {});
    return interpreter.run(input)+"";
  }
}
