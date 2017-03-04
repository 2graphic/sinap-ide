// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CoreElement } from "sinap-core";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent {
    @Input() value: CoreValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    private getLabel() {
        if (this.value instanceof CoreElement) {
            return this.value.uuid; // TODO
        } else {
            return "<NO LABEL>";
        }
    }
}
