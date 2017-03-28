// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CoreElement, CorePrimitiveValue, CoreReferenceValue } from "sinap-core";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent {
    private _value: CoreValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    private label: string = "";

    @Input()
    set value(v: CoreValue<PluginTypeEnvironment>) {
        // TODO: Nodes that come from the plugin are just UUID's
        this._value = v;
        if (v instanceof CoreElement) {
            this.label = (v.get("label") as CorePrimitiveValue<PluginTypeEnvironment>).data as any;
            this.label = this.label ? this.label : "No Label";
        } else {
            console.log(v);
            const vs = v as any;
            if (vs.value && vs.value instanceof CoreReferenceValue) {
                this.label = vs.value.type.name;
            } else {
                this.label = "NOT IMPLEMENTED";
            }
        }
    }
}
