// File: list-type.component.ts
// Created by: Daniel James
// Date created: March 6, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value } from "sinap-types";

@Component({
    selector: "sinap-list-type",
    templateUrl: "./list-type.component.html",
    styleUrls: ["./list-type.component.scss"]
})
export class ListTypeComponent extends BaseTypeComponent<Value.ArrayObject> {
    private values: Value.Value[] = [];

    set value(v: Value.ArrayObject) {
        super.value = v;
        this.values = v.simpleRepresentation;
    }
}
