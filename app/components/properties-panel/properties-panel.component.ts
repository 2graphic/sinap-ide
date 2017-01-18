// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component, SimpleChanges, Output, EventEmitter } from "@angular/core";
import * as Type from "../../models/types";

@Component({
    selector: "sinap-properties-panel",
    templateUrl: "./properties-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css", "./properties-panel.component.css"],
})
export class PropertiesPanelComponent {
    public selectedEntity: PropertiedEntity | null = null;
    public console = console;

    @Output() propertyChanged = new EventEmitter();

    // TODO: 
    // discuss with Daniel
    // I want to wrap up this functionality into bind.directive
    // so that we can just do:
    // <input [snpBind]="selectedEntity" [group]="..." [key]="..." [keyPath]="...">
    // I've mostly got it, but it needs to somehow link in the forms module
    // I'll talk more in person.
    doChange(entity: PropertiedEntity, group: keyof PropertiedEntityLists, key: string, newValue: any, keyPath?: string[]) {
        if (keyPath) {
            // TODO: put this logic in a helper function

            // given some old object obj
            // and a keypath ['a', 'b', 'c']
            // and a new value 'nv'
            // perform obj.a.b.c = 'nv'

            // get the old value from the model
            const value = entity[group].get(key);

            // walk through keys in the key path, so if keyPath = ['a', 'b', 'c']
            // get el = value.a.b
            let el = value;
            for (let pathEl of keyPath.slice(0, -1)) {
                el = el[pathEl];
            }
            const lastOfKeyPath = keyPath[keyPath.length - 1];
            // for the last key in the path, assign it the new value, so:
            // in the above example, el.c = newValue
            el[lastOfKeyPath] = newValue;

            // make the newValue equal to the old value with the key path updated
            newValue = value;
        }

        this.propertyChanged.emit([entity, group, key, keyPath]);

        entity[group].set(key, newValue);
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