// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component, SimpleChanges } from "@angular/core";
import * as Type from "../../models/types";


@Component({
    selector: "sinap-properties-panel",
    templateUrl: "./properties-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css", "./properties-panel.component.css"],
})
export class PropertiesPanelComponent {
    public selectedEntity: PropertiedEntity | null = null;
    public console = console;

    ngOnChanges(changes: SimpleChanges) {
        console.log("changes");
    }

    private isEmpty() {
        if (this.selectedEntity) {
            for (let group of this.groups) {
                let g = this.selectedEntity[group[1]];
                if (g.properties.length > 0) {
                    return false;
                }
            }
        }

        return true;
    }

    private groups: [string, keyof PropertiedEntityLists][] = [
        ["General", "pluginProperties"],
        ["Display", "drawableProperties"]
    ];
}

export interface PropertyList {
    readonly properties: [string, Type.Type][];
    get(property: string): any;
    set(property: string, value: any): void;
}

export interface PropertiedEntityLists {
    readonly drawableProperties: PropertyList;
    readonly pluginProperties: PropertyList;
}
export interface PropertiedEntity extends PropertiedEntityLists {
    readonly entityName: string;
}