// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild } from "@angular/core";
import { MenuService, MenuDelegate } from "./menu.service"
import { GraphEditorComponent } from "./graph-editor.component"
import { PluginService, Interpreter } from "./plugin.service"
import { REPLComponent, REPLDelegate } from "./repl.component"


@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService, PluginService]
})
export class MainComponent implements OnInit, MenuDelegate, REPLDelegate {
  constructor(private menu: MenuService, private pluginService: PluginService) {}
  ngOnInit(): void {
    this.menu.setDelegate(this);
    this.repl.setDelegate(this);
  }

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  @ViewChild(REPLComponent)
  private repl: REPLComponent;


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
    this.graphEditor.graph = null;
  }

  run(input: String):String {
    let interpreter = this.pluginService.getInterpreter("dfa", {});
    return interpreter.run(input)+"";
  }
}
