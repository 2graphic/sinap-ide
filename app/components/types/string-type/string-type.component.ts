// File: string-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CorePrimitiveValue } from "sinap-core";

@Component({
    selector: "sinap-string-type",
    templateUrl: "./string-type.component.html",
    styleUrls: ["./string-type.component.scss"]
})
export class StringTypeComponent {
    private _value: CorePrimitiveValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    @Input() set value(v: CoreValue<PluginTypeEnvironment>) {
        if (v instanceof CorePrimitiveValue) {
            this._value = v;
        } else {
            console.log(v, " is not a CorePrimitiveValue");
        }
    }

    @ViewChild('input') input: ElementRef;

    focus() {
        if (this.input) {
            this.input.nativeElement.focus();
        }
    }
}
