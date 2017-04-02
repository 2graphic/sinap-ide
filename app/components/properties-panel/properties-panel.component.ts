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
import { BridgingProxy } from "../../models/graph-controller";
import { Type, UnionType, WrappedScriptObjectType, isUnionType } from "sinap-core";
import { PanelComponent } from "../dynamic-panel/dynamic-panel";


export class PropertiesPanelData {
    private _selectedElements: Set<BridgingProxy> | null
    = null;

    get selectedElements() {
        return this._selectedElements;
    }

    set selectedElements(value: Set<BridgingProxy> | null) {
        this._selectedElements = value;
        this.selectedElementsChanged.emit(value);
    }

    readonly selectedElementsChanged
    = new EventEmitter<Set<BridgingProxy> | null>();
}


@Component({
    selector: "sinap-properties-panel",
    templateUrl: "./properties-panel.component.html",
    styleUrls: ["./properties-panel.component.scss"],
})
export class PropertiesPanelComponent implements PanelComponent<PropertiesPanelData> {
    private isEmpty = true;
    private fieldNames: string[];
    private fields: { [a: string]: [string, string, Type][] };
    private element: { [a: string]: any };
    private lookupSinapType: (a: string) => Type;
    private lookupPluginType: (a: string) => Type;
    private isUnionType = isUnionType;


    set data(value: PropertiesPanelData) {
        if (value) {
            value.selectedElementsChanged.asObservable().subscribe(this.updateSelectedElements);
            this.updateSelectedElements(value.selectedElements);
        }
    }


    private unionValues(t: UnionType) {
        // substring necessary to strip the quote marks off the types
        // that is, the union.types looks like ['"option a"', '"option b"', ...]
        return [...t.types].map(t => t.name.substring(1, t.name.length - 1));
    }

    private clear() {
        this.isEmpty = true;
        this.fields = {};
        this.fieldNames = [];
    }

    updateSelectedElements = (elements: Set<BridgingProxy> | null) => {
        if (elements === null) {
            this.clear();
        } else {
            this.isEmpty = false;
            const bridge = elements.values().next().value;
            const drawableType = bridge.graph.plugin.typeEnvironment.drawableTypes.get(bridge.core.kind)!;

            if (bridge.core.type instanceof WrappedScriptObjectType) {
                const pluginType = bridge.core.type;

                // TODO: move this to function
                const pluginFields = [...pluginType.members.entries()].map(([n, t]) => [n, pluginType.prettyNames.get(n), t] as [string, string, Type]);
                const drawableFields = [...drawableType.members.entries()]
                    .filter(([n, _]) => !pluginType.members.has(n))
                    .map(([n, t]) => [n, drawableType.prettyNames.get(n), t] as [string, string, Type]);

                this.fields = {
                    "General": pluginFields,
                    "Drawable": drawableFields
                };
                this.fieldNames = Object.keys(this.fields);
                this.element = bridge.proxy;

                this.lookupSinapType = (a: string) => bridge.graph.plugin.typeEnvironment.lookupSinapType(a);
                this.lookupPluginType = (a: string) => bridge.graph.plugin.typeEnvironment.lookupPluginType(a);
            } else {
                this.clear();
            }
        }
    }
}