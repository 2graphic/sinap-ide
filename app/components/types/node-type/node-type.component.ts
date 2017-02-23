// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { Type } from "sinap-core";
import { Value } from "./../../../services/plugin.service";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent {
    @Input() value: Value;
    @Input() readonly: boolean = true;

    private getLabel() {
        if (this.value.value.label && this.value.value.label != "") {
            return this.value.value.label;
        } else {
            return "<NO LABEL>";
        }
    }
}
