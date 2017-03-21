// File: color-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CorePrimitiveValue } from "sinap-core";

@Component({
    selector: "sinap-color-type",
    templateUrl: "./color-type.component.html",
    styleUrls: ["./color-type.component.scss"]
})
export class ColorTypeComponent {
    private _value: CorePrimitiveValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    @Input() set value(v: CoreValue<PluginTypeEnvironment>) {
        if (v instanceof CorePrimitiveValue) {
            this._value = v;
        } else {
            console.log(v, " is not a CorePrimitiveValue");
        }
    }
}
