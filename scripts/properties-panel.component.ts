// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";


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
    // READTHIS: to Daniel
    // this tells us when things change
    // may want to change this to just be a field and 
    // use Angular to detect changes to it. 
    this._selectedEntity = e;
  }
}

export enum EntityKind {
  General,
  PluginGenerated
}

export class SinapType {
  constructor(public type : string){}
}

export class Property{
  readonly name : string;
  readonly kind : EntityKind;
  readonly type : SinapType;
  value : any;

  constructor(name: string, kind: EntityKind, type: SinapType, value : any){
    this.name = name;
    this.kind = kind;
    this.type = type;
    this.value = value;
  }

  static fromJSON(json : {name : string, kind : string, type : string, value : string}){
    return new this(json.name,
                    EntityKind[json.kind],
                    new SinapType(json.type),
                    json.value);
  }

  toJSON(){
    return {"name" : this.name,
            "kind" : EntityKind[this.kind],
            "type" : this.type.type,
            "value" : this.value.v}
  }
}

export interface PropertiedEntity {
  readonly names : Iterable<string>;
  readonly properties : Iterable<Property>;
  property(name : string) : Property;
}