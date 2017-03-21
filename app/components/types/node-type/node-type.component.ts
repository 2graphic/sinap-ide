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
    private _value: CoreValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    private label: string = "";

    @Input()
    set value(v: CoreValue<PluginTypeEnvironment>) {
        // TODO: Nodes that come from the plugin are just UUID's
        this._value = v;
        this.label = "NOT IMPLEMENTED";
    }
}
