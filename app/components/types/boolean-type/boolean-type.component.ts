// File: boolean-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CorePrimitiveValue, CoreUnionValue } from "sinap-core";

@Component({
    selector: "sinap-boolean-type",
    templateUrl: "./boolean-type.component.html",
    styleUrls: ["./boolean-type.component.scss"]
})
export class BooleanTypeComponent {
    private _value: CorePrimitiveValue<PluginTypeEnvironment> | CoreUnionValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    @Input() set value(v: CoreValue<PluginTypeEnvironment>) {
        if (v instanceof CorePrimitiveValue) {
            this._value = v;
        } if (v.type.name === "true | false") {
            this._value = v as CoreUnionValue<PluginTypeEnvironment>;
        } else {
            console.log(v, " is not a CorePrimitiveValue");
        }
    }
}
