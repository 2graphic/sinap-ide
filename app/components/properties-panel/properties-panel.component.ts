// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";
import { SinapType } from "../../models/types";


@Component({
  selector: "sinap-properties-panel",
  templateUrl: "./properties-panel.component.html",
  styleUrls: [ "../../styles/side-panel.component.css", "./properties-panel.component.css" ]
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
  readonly entityName : string;
}