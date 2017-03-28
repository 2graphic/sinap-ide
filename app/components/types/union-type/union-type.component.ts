// File: union-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CoreUnionValue, isUnionType, valueWrap, makeValue, CorePrimitiveValue } from "sinap-core";

@Component({
    selector: "sinap-union-type",
    templateUrl: "./union-type.component.html",
    styleUrls: ["./union-type.component.scss"]
})
export class UnionTypeComponent {
    private _value: CoreUnionValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    private options = new Array<CorePrimitiveValue<PluginTypeEnvironment>>();

    @Input() set value(v: CoreValue<PluginTypeEnvironment>) {
        if (isUnionType(v.type)) {
            this._value = v as CoreUnionValue<PluginTypeEnvironment>;
            v.type.types.forEach((t) => {
                const option = makeValue(t, undefined, false);
                if (option instanceof CorePrimitiveValue) {
                    this.options.push(option);
                    // TODO: Make this work with none primitive values                    
                } else {
                    console.log(v, "Currently only support union's of primitive values.");
                }
            });
        } else {
            console.log(v, " is not a CoreUnionValue");
        }
    }

    getValue() {
        if (this._value) {
            return (this._value.value as CorePrimitiveValue<PluginTypeEnvironment>).data;
        }

        return "";
    }

    setValue(value: any) {
        const newValue = valueWrap(this._value.type.env, value, this._value.mutable);
        this._value.value = newValue;
    }
}
