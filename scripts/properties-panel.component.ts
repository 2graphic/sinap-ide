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
  public console = console;
  // get selectedEntity() {
  //   return this._selectedEntity;
  // }
  // set selectedEntity(e) {
  //   console.log(e);
  //   this._selectedEntity = e;
  // }

  private isEmpty() {
    if (this.selectedEntity) {
      for (let group of this.groups) {
        if (this.selectedEntity[group[1]] && this.selectedEntity[group[1]].length > 0) {
          return false;
        }
      }
    }

    return true;
  }

  private groups = [["General", "pluginProperties"], ["Display", "displayProperties"]];
}

export interface PropertiedEntity {
  readonly displayProperties : Iterable<[string, SinapType]>;
  readonly pluginProperties : Iterable<[string, SinapType]>;
  readonly propertyValues : Object;
}