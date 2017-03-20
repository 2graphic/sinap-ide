// File: number-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { CoreValue, PluginTypeEnvironment, CorePrimitiveValue } from "sinap-core";

@Component({
    selector: "sinap-number-type",
    templateUrl: "./number-type.component.html",
    styleUrls: ["./number-type.component.scss"]
})
export class NumberTypeComponent {
    private _value: CorePrimitiveValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;

    @Input() set value(v: CoreValue<PluginTypeEnvironment>) {
        console.log(v);

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

    round(n: number) {
        return Math.round(n * 10 ) / 10;
    }
}
