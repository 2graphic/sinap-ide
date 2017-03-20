// File: union-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CoreUnionValue, isUnionType, makeValue } from "sinap-core";

@Component({
    selector: "sinap-union-type",
    templateUrl: "./union-type.component.html",
    styleUrls: ["./union-type.component.scss"]
})
export class UnionTypeComponent {
    private _value: CoreUnionValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    private options = new Array<CoreValue<PluginTypeEnvironment>>();

    @Input() set value(v: CoreValue<PluginTypeEnvironment>) {
        if (isUnionType(v.type)) {
            this._value = v as CoreUnionValue<PluginTypeEnvironment>;
            v.type.types.forEach((t) => {
                this.options.push(makeValue(t, undefined, false));
                // TODO: Make this work with none primitive values
            });
        } else {
            console.log(v, " is not a CoreUnionValue");
        }
    }
}
