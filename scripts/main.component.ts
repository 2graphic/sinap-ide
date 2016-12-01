// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "./menu.service"
import { GraphEditorComponent, EditorDelegate, DrawableThing } from "./graph-editor.component"
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
export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, EditorDelegate {
  constructor(private menu: MenuService, private pluginService: PluginService) {}
  
  selectedElements = new Set<Element>();
  selectElement(element : DrawableThing) {
    if (!(element instanceof Element))
      throw "Only try to select drawable things made by the main.component";
    this.propertiesPanel.selectedEntity = element;
    this.selectedElements.add(element);
  }
  deselectElement(element : DrawableThing) {
    if (!(element instanceof Element))
      throw "Only try to deselect drawable things made by the main.component";
    this.selectedElements.delete(element);
    if (this.selectedElements.size > 0){
      // TODO: worry about how to allow multiple selection for the properties panel
      // set the "selectedEntity" on the this.propertiesPanel to any of the selected elements
      for(let e of this.selectedElements){
        this.propertiesPanel.selectedEntity = e;
        break;
      }
    }
  }
  clearSelected() {
    this.selectedElements.clear();
  }


  ngOnInit(): void {
    this.repl.delegate = this;
    this.graphEditor.delegate = this;

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
    this.graph = new Graph([new Property("graph_prop",
                                         EntityKind.PluginGenerated,
                                         new SinapType("string"),
                                         "")]);
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
}
