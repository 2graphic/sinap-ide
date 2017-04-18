/**
 * @file `properties-panel.component.ts`
 *   Created on November 26, 2016
 *
 * @author Daniel James
 *   <daniel.s.james@icloud.com>
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html}
 */


import { Component, Input, EventEmitter } from "@angular/core";
import { Bridge, ComputedPropertyContext } from "../../models/graph-controller";
import { ElementValue } from "sinap-core";
import { Value } from "sinap-types";
import { PanelComponent } from "../dynamic-panel/dynamic-panel";


export class PropertiesPanelData {
    private _selectedElements?: Set<Bridge>;

    get selectedElements() {
        return this._selectedElements;
    }

    set selectedElements(value: Set<Bridge> | undefined) {
        this._selectedElements = value;
        this.selectedElementsChanged.emit(value);
    }

    readonly selectedElementsChanged
    = new EventEmitter<Set<Bridge> | undefined>();
}


@Component({
    selector: "sinap-properties-panel",
    templateUrl: "./properties-panel.component.html",
    styleUrls: ["./properties-panel.component.scss"],
})
export class PropertiesPanelComponent implements PanelComponent<PropertiesPanelData> {
    private element?: ElementInfo;

    set data(value: PropertiesPanelData) {
        if (value) {
            value.selectedElementsChanged.asObservable().subscribe(this.updateSelectedElements);
            this.updateSelectedElements(value.selectedElements);
        }
    }

    updateSelectedElements = (elements: Set<Bridge> | undefined) => {
        if (elements === undefined || elements.size === 0) {
            this.element = undefined;
        } else {
            const element = elements.values().next().value.core;
            this.element = new ElementInfo(element);
        }
    }
}

class ElementInfo {
    public pluginProperties: Property[];
    public computedProperties: Property[];
    public drawableProperties: Property[];
    public readonly kind: string;

    constructor(public readonly element: ElementValue) {
        const pluginType = element.type.pluginType;
        const drawableType = element.type.drawableType;

        this.kind = pluginType.name;

        if (element.context instanceof ComputedPropertyContext) {
            const context = element.context;

            const updateComputedProperties = () => {
                this.computedProperties = [...context.properties.entries()].map(([_, [name, value]]) => new Property(name, value));
            };

            element.context.onUpdate = updateComputedProperties;
            updateComputedProperties();
        } else {
            this.computedProperties = [];
        }

        this.pluginProperties = [...pluginType.members.keys()]
            .filter((k) => pluginType.isVisible(k) && !element.type.pluginType.methods.has(k))
            .map((k) => new Property(pluginType.prettyName(k), element.get(k)));
        this.drawableProperties = [...drawableType.members.keys()]
            .filter((k) => !pluginType.members.has(k) && drawableType.isVisible(k) && !element.type.pluginType.methods.has(k))
            .map((k) => new Property(pluginType.prettyName(k), element.get(k)));
    }
}

class Property {
    constructor(public readonly name: string, public readonly value: Value.Value) { };
}