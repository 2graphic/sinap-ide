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
    @Input() value: CoreValue;
    @Input() readonly: boolean = true;

    private getLabel() {
        if (this.value && this.value.value && this.value.value.label && this.value.value.label !== "") {
            return this.value.value.label;
        } else {
            return "<NO LABEL>";
        }
    }
}
