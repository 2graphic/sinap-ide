// File: point-type.component.ts
// Created by: Daniel James
// Date created: April 5, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";

interface Point {
    x: Value.Value;
    y: Value.Value;
}

export const PointType = new Type.Record(new Map([["x", new Type.Primitive("number")], ["y", new Type.Primitive("number")]]));


@Component({
    selector: "sinap-point-type",
    templateUrl: "./point-type.component.html",
    styleUrls: ["./point-type.component.scss"]
})
export class PointTypeComponent extends BaseTypeComponent<Value.Record> {

    private point: Point;

    set value(v: Value.Record) {
        if (!v.type.equals(PointType)) {
            throw new Error("Passed record is not a Point");
        }

        super.value = v;

        this.point = {
            x: v.value.x,
            y: v.value.y
        };
    }
}
