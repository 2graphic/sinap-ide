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


@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService]
})
export class MainComponent implements OnInit, MenuDelegate {
  constructor(private menu: MenuService) {}

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  // Declare icons for the sidebar.
  icons = [
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
  propertiesIcon = this.icons[0];
  toolsIcon = this.icons[1];
  // ------------------------------


  newFile() {
    this.graphEditor.graph = null;
  }

  ngOnInit(): void {
    this.menu.setDelegate(this);
  }
}
