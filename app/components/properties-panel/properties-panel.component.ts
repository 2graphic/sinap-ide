// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component } from "@angular/core";
import { SinapType } from "../../models/types";


@Component({
    selector: "sinap-properties-panel",
    templateUrl: "./properties-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css", "./properties-panel.component.css"]
})

export class PropertiesPanelComponent {
    public selectedEntity: PropertiedEntity | null = null;
    public console = console;

    private isEmpty() {
        if (this.selectedEntity) {
            for (let group of this.groups) {
                let g = (this.selectedEntity as any)[group[1]];
                if (g && g.length > 0) {
                    return false;
                }
            }
        }

        return true;
    }

    private groups = [["General", "pluginProperties"], ["Display", "drawableProperties"]];
}

export interface PropertyList {
    readonly properties: [string, SinapType][];
    get(property: string): any;
    set(property: string, value: any): void;
}

export interface PropertiedEntity {
    readonly drawableProperties: PropertyList;
    readonly pluginProperties: PropertyList;
    readonly entityName: string;
}