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
	get selectedEntity(){
		return this._selectedEntity;
	}
	set selectedEntity(e){
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
	type : string;
}

export class SinapTypedValue {
	v : string;
}

export class Property{
	readonly name : string;
	readonly kind : EntityKind;
	readonly type : SinapType;
	value : SinapTypedValue;

	constructor(name: string, kind: EntityKind, type: SinapType, value : SinapTypedValue){
		this.name = name;
		this.kind = kind;
		this.type = type;
		this.value = value;
	}
}

export interface PropertiedEntity {
	readonly names : Iterable<string>;
	readonly properties : Iterable<Property>;
	property(name : string) : SinapType;
}