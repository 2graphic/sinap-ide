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
import { Bridge } from "../../models/graph-controller";
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
    private isEmpty = true;

    set data(value: PropertiesPanelData) {
        if (value) {
            value.selectedElementsChanged.asObservable().subscribe(this.updateSelectedElements);
            this.updateSelectedElements(value.selectedElements);
        }
    }

    updateSelectedElements = (elements: Set<Bridge> | undefined) => {
        if (elements === undefined || elements.size === 0) {
            this.isEmpty = true;
        } else {
            const bridge = elements.values().next().value;
            this.isEmpty = false;

            console.log(bridge);
        }
    }
}