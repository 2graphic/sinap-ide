// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";
import { ElementValue } from "sinap-core";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent extends BaseTypeComponent<ElementValue> {
    private label: string = "";

    @Input()
    set value(value: ElementValue) {
        super.value = value;

        const label = this.getPrimitiveAsString(value, "label");

        const index = [...value.environment.values.entries()].map((v) => v[1]).filter((v) => {
            return Type.isSubtype(v.type, value.type);
        }).indexOf(value);

        this.label = label ? label : value.type.pluginType.name + " " + index;
    }

    // TODO: Move this into a util collection
    private getPrimitiveAsString(v: Value.Intersection, key: string): string | undefined {
        if (v.type.members.has(key)) {
            const keyValue = v.get(key);
            if (keyValue instanceof Value.Primitive && typeof keyValue.value === "string") {
                return keyValue.value;
            }
        }

        return undefined;
    }
}
