// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";

@Component({
    selector: "sinap-object-type",
    templateUrl: "./object-type.component.html",
    styleUrls: ["./object-type.component.scss"]
})
export class ObjectTypeComponent extends BaseTypeComponent<Value.CustomObject> {
    private values = new Map<string, Value.Value>();
    private keys: string[] = [];

    @Input()
    set value(v: Value.CustomObject) {
        // TODO, remove keys that no longer exist.
        v.type.members.forEach((type, key) => {
            if (v.type.isVisible(key)) {
                this.values.set(key, v.get(key));
            }
        });

        this.keys = [...this.values.keys()];
    }
}
