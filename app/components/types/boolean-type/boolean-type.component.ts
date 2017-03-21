// File: boolean-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CorePrimitiveValue, CoreUnionValue, valueWrap } from "sinap-core";

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
        } else if (v instanceof CoreUnionValue) {
            this._value = v as CoreUnionValue<PluginTypeEnvironment>;
        } else {
            console.log(v, " is not a CorePrimitiveValue or \"true | false\"");
        }
    }

    getLabel() {
        let r: any;

        if (this._value instanceof CorePrimitiveValue) {
            return this._value.data;
        } else if (this._value instanceof CoreUnionValue) {
            return (this._value.value as CorePrimitiveValue<PluginTypeEnvironment>).data;
        }

        return "false";
    }

    setLabel(value: boolean) {
        if (this._value instanceof CorePrimitiveValue) {
            this._value.data = value;
        } else if (this._value instanceof CoreUnionValue) {
            const newValue = valueWrap(this._value.type.env, value, this._value.mutable);
            this._value.value = newValue;
        }
    }
}
