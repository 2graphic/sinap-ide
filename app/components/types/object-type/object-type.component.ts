// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, ObjectType } from "sinap-core";

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
        const type = v.type;
        if (type instanceof ObjectType) {
            type.members.forEach((type, key) => {
                if (key != "__constructor") {
                    this.values.push([key, new CoreValue(type, v.data[key])]);
                }
            });
        }
    }
}
