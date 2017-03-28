// File: list-type.component.ts
// Created by: Daniel James
// Date created: March 6, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CoreArrayValue } from "sinap-core";

@Component({
    selector: "sinap-list-type",
    templateUrl: "./list-type.component.html",
    styleUrls: ["./list-type.component.scss"]
})
export class ListTypeComponent {
    @Input() _value: CoreValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    private values: CoreValue<PluginTypeEnvironment>[] = [];

    @Input()
    set value(v: CoreValue<PluginTypeEnvironment>) {
        if (v instanceof CoreArrayValue) {
            this.values = v.values;
        } else {
            console.log(v, " is not a CoreArrayValue");
        }
    }
}
