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
        if (v instanceof CoreObjectValue) {
            // TODO, remove keys that no longer exist.
            v.type.members.forEach((_, key) => {
                this.values.set(key, v.get(key));
            });

            this.keys = [...this.values.keys()];
        }
    }
}
