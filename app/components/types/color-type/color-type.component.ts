// File: color-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";

@Component({
    selector: "sinap-color-type",
    templateUrl: "./color-type.component.html",
    styleUrls: ["./color-type.component.scss"]
})
export class ColorTypeComponent extends BaseTypeComponent<Value.Primitive> {
}
