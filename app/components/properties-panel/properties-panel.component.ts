// File: properties-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component, Input } from "@angular/core";
import { BridgingProxy } from "../../models/main-graph"
import { Type } from "sinap-core";

@Component({
    selector: "sinap-properties-panel",
    templateUrl: "./properties-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css", "./properties-panel.component.css"],
})
export class PropertiesPanelComponent {
    isEmpty = true;
    fieldNames: string[];
    fields: { [a: string]: [string, Type][] };
    element: { [a: string]: any };
    lookupSinapType: (a: string) => Type;

    @Input()
    set selectedElements(elements: Set<BridgingProxy> | null) {
        if (elements === null) {
            this.isEmpty = true;
            this.fields = {};
            this.fieldNames = [];
        } else {
            this.isEmpty = false;
            const bridge = elements.values().next().value;
            const drawableFields = [...bridge.graph.plugin.typeEnvironment.drawableTypes.get(bridge.core.kind) !.members.entries()];
            const pluginFields = [...bridge.core.type.members.entries()];
            this.lookupSinapType = (a: string) => bridge.graph.plugin.typeEnvironment.lookupSinapType(a);

            this.fields = {
                "General": pluginFields,
                "Drawable": drawableFields
            };
            this.fieldNames = Object.keys(this.fields);
            this.element = bridge.proxy;
        }
    }
}