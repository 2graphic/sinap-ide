// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, isObjectType, PluginTypeEnvironment, CoreObjectValue, ObjectType } from "sinap-core";

@Component({
    selector: "sinap-object-type",
    templateUrl: "./object-type.component.html",
    styleUrls: ["./object-type.component.scss"]
})
export class ObjectTypeComponent {
    @Input() readonly: boolean = true;

    private values = new Map<string, CoreValue<PluginTypeEnvironment>>();
    private keys: string[] = [];

    @Input()
    set value(v: CoreValue<PluginTypeEnvironment>) {
        const type = v.type as ObjectType;

        // TODO, remove keys that no longer exist.
        type.members.forEach((type, key) => {
            if (key === "__constructor" || key === "states" || key === "toVisit" || key === "input" || key === "output") {
                return;
            }
            let subValue;
            if (typeof v.value[key] === 'boolean') {
                subValue = {
                    get: () => v.value[key],
                    set: (newValue: any) => v.value[key] = newValue,
                    toString: () => v.value[key]
                };
            } else {
                subValue = v.value[key];
            }
            this.values.set(key, new CoreValue(type, subValue));
        });

        this.keys = [...this.values.keys()];
    }
}
