// File: boolean-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value } from "sinap-types";

@Component({
    selector: "sinap-boolean-type",
    templateUrl: "./boolean-type.component.html",
    styleUrls: ["./boolean-type.component.scss"]
})
export class BooleanTypeComponent extends BaseTypeComponent<Value.Primitive> {
}
