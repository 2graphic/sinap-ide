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
    fields: [string, Type][];
    element: { [a: string]: any };

    @Input()
    set selectedElements(elements: Set<BridgingProxy> | null) {
        if (elements === null) {
            this.isEmpty = true;
            this.fields = [];
        } else {
            this.isEmpty = false;
            const bridge = elements.values().next().value;
            this.fields = [...bridge.core.type.members.entries()];
            this.element = bridge.proxy;
        }
    }
}