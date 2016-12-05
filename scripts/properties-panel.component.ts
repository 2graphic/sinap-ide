// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";
import { SinapType } from "./types";


@Component({
  moduleId: module.id,
  selector: "sinap-properties-panel",
  templateUrl: "../html/properties-panel.component.html",
  styleUrls: [ "../styles/side-panel.component.css" ]
})

export class PropertiesPanelComponent {
  private _selectedEntity : PropertiedEntity;
  public get selectedEntity(){
    return this._selectedEntity;
  }
  public set selectedEntity(e){
    console.log(e);


    // READTHIS: to Daniel
    // this tells us when things change
    // may want to change this to just be a field and 
    // use Angular to detect changes to it. 
    this._selectedEntity = e;
  }
}

export interface PropertiedEntity {
  readonly displayProperties : Iterable<[string, SinapType]>;
  readonly pluginProperties : Iterable<[string, SinapType]>;
  readonly propertyValues : Object;
}