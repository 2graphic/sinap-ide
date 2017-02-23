// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { Type } from "sinap-core";
import { Value } from "./../../../services/plugin.service";

@Component({
    selector: "sinap-object-type",
    templateUrl: "./object-type.component.html",
    styleUrls: ["./object-type.component.scss"]
})
export class ObjectTypeComponent {
    @Input() readonly: boolean = true;

    private values = <[string, Value][]>[];

    @Input()
    set value(v: Value) {
        Object.keys(v.value).forEach((key) => {
            this.values.push([key, v.value[key]]);
        });
    }
}
