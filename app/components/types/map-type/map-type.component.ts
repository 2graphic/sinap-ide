// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value } from "sinap-types";

@Component({
    selector: "sinap-map-type",
    templateUrl: "./map-type.component.html",
    styleUrls: ["./map-type.component.scss"]
})
export class MapTypeComponent extends BaseTypeComponent<Value.MapObject> {
    @Input() readonly: boolean = true;

    private values: [Value.Value, Value.Value][] = [];

    @Input()
    set value(v: Value.MapObject) {
        super.value = v;
        this.values = [];

        this.values = v.simpleRepresentation;
    }
}
