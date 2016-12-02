// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "./menu.service"
import { GraphEditorComponent, Drawable } from "./graph-editor.component"
import { PluginService, Interpreter } from "./plugin.service"
import { REPLComponent, REPLDelegate } from "./repl.component"
import { PropertiesPanelComponent, Property, EntityKind, SinapType } from "./properties-panel.component"
import { Element, Graph } from "./graph"

@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService, PluginService]
})
export class MainComponent implements OnInit, MenuEventListener, REPLDelegate {
  constructor(private menu: MenuService, private pluginService: PluginService) {}
  

  ngOnInit(): void {
    this.repl.delegate = this;
    this.menu.addEventListener(this);
  }

  ngAfterViewInit() {
    this.newFile();    
  }

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  @ViewChild(REPLComponent)
  private repl: REPLComponent;
  
  @ViewChild(PropertiesPanelComponent)
  private propertiesPanel: PropertiesPanelComponent;


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

  graph : Graph;

  newFile() {
    if (this.graph != null){
      console.log(JSON.stringify(this.graph.toJSON()))
    }
    this.graph = new Graph([]);
    this.graphEditor.graph = this.graph;
  }

  menuEvent(e: MenuEvent) {
    switch (e) {
      case MenuEvent.NEW_FILE:
        this.newFile();
        break;
    }
  }

  run(input: String):String {
    let interpreter = this.pluginService.getInterpreter("dfa", {});
    return interpreter.run(input)+"";
  }

  graphSelectionChanged(selected) {
    let newSelectedEntity : Element;
    if (selected.size > 0){
      for (let x of selected){
        // this cast is safe because we know that the only Drawables that we
        // ever give the `graphEditor` are `Element`s
        newSelectedEntity = x as Element;
        break;
      }
    } else {
      newSelectedEntity = this.graph;
    } 
    // ugly trick to silence the fact that things seem to get emitted too often
    // TODO, reduce the frequency things are emitted
    if (this.propertiesPanel.selectedEntity != newSelectedEntity){
      this.propertiesPanel.selectedEntity = newSelectedEntity;
    }
  }
}
