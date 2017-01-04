// File: tools-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";

export interface PluginManagement {
  activeNodeType : string;
  nodeTypes : Array<string>;
}

@Component({
  selector: "sinap-tools-panel",
  templateUrl: "./tools-panel.component.html",
  styleUrls: [ "../../styles/side-panel.component.css" ]
})

export class ToolsPanelComponent {
	public manager : PluginManagement;
	public activeGraphType : string = "DFA";
	public graphTypes = ["DFA", "Machine Learning"];
}
