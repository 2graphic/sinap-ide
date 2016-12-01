// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild } from "@angular/core";
import { MenuService, MenuDelegate } from "./menu.service"
import { GraphEditorComponent, EditorDelegate, DrawableThing } from "./graph-editor.component"
import { PluginService, Interpreter } from "./plugin.service"
import { REPLComponent, REPLDelegate } from "./repl.component"
import { PropertiesPanelComponent, Property } from "./properties-panel.component"
import { Element, Graph } from "./graph"

@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService, PluginService]
})
export class MainComponent implements OnInit, MenuDelegate, REPLDelegate, EditorDelegate {
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
    this.menu.setDelegate(this);
    this.repl.setDelegate(this);
    this.graphEditor.delegate = this;
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


  newFile() {
    this.graphEditor.graph = new Graph([new Property("graph_property", null, null, null)]);
  }

  run(input: String):String {
    let interpreter = this.pluginService.getInterpreter("dfa", {});
    return interpreter.run(input)+"";
  }
}
