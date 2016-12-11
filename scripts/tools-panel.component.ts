// File: tools-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";


@Component({
  moduleId: module.id,
  selector: "sinap-tools-panel",
  templateUrl: "../html/tools-panel.component.html",
  styleUrls: [ "../styles/side-panel.component.css" ]
})
export class ToolsPanelComponent {
	public activeNodeType : string = "Input";
	public nodeTypes = ["Input", "Fully Connected", "Conv2D", "Max Pooling", "Reshape"];

	public activeGraphType : string = "DFA";
	public graphTypes = ["DFA", "Machine Learning"];
}
