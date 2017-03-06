// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue } from "sinap-core";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent {
    private _value: CoreValue;
    @Input() readonly: boolean = true;

    private label: string = "";

    @Input()
    set value(v: CoreValue) {
        this._value = v;
        if (v && v.value && v.value.label && v.value.label !== "") {
            this.label = v.value.label;
        } else {
            this.label = "<NO LABEL>";
        }
    }
}
