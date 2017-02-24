// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue } from "sinap-core";

@Component({
    selector: "sinap-object-type",
    templateUrl: "./object-type.component.html",
    styleUrls: ["./object-type.component.scss"]
})
export class ObjectTypeComponent {
    @Input() readonly: boolean = true;

    private values = <[string, CoreValue][]> [];

    @Input()
    set value(v: CoreValue) {
        Object.keys(v.data).forEach((key) => {
            this.values.push([key, v.data[key]]);
        });
    }
}
