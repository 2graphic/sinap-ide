// File: point-type.component.ts
// Created by: Daniel James
// Date created: April 5, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value } from "sinap-types";

interface Point {
    x: Value.Value;
    y: Value.Value;
}

@Component({
    selector: "sinap-point-type",
    templateUrl: "./point-type.component.html",
    styleUrls: ["./point-type.component.scss"]
})
export class PointTypeComponent extends BaseTypeComponent<Value.Record> {

    private point: Point;

    set value(v: Value.Record) {
        if (v.type.name !== "Point") {
            throw new Error(v.type.name + " is not a Point");
        }

        super.value = v;

        this.point = {
            x: v.value.x,
            y: v.value.y
        };
    }
}
