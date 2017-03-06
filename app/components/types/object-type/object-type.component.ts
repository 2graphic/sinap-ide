// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, isObjectType } from "sinap-core";

@Component({
    selector: "sinap-object-type",
    templateUrl: "./object-type.component.html",
    styleUrls: ["./object-type.component.scss"]
})
export class ObjectTypeComponent {
    @Input() readonly: boolean = true;

    private values = new Map<string, CoreValue>();
    private keys: string[] = [];

    @Input()
    set value(v: CoreValue) {
        const type = v.type;

        //console.log(v);

        // TODO, remove keys that no longer exist.
        if (isObjectType(type)) {
            type.members.forEach((type, key) => {
                if (key == "__constructor" || key == "states") {
                    return;
                }
                this.values.set(key, new CoreValue(type, v.value[key]));
            });
        }

        //console.log(this.values);

        this.keys = [...this.values.keys()];
    }
}
