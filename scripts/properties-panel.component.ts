// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";
import { SinapType } from "./types";


@Component({
  moduleId: module.id,
  selector: "sinap-properties-panel",
  templateUrl: "../html/properties-panel.component.html",
  styleUrls: [ "../styles/side-panel.component.css", "../styles/properties-panel.component.css" ]
})

export class PropertiesPanelComponent {
  public selectedEntity : PropertiedEntity;

  private groups = [["General", "pluginProperties"], ["Display", "displayProperties"]];
}

export interface PropertiedEntity {
  readonly displayProperties : Iterable<[string, SinapType]>;
  readonly pluginProperties : Iterable<[string, SinapType]>;
  readonly propertyValues : Object;
}