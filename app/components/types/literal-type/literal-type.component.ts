// File: literal-type.component.ts
// Created by: Daniel James
// Date created: April 5, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value } from "sinap-types";

@Component({
    selector: "sinap-literal-type",
    template: "{{value.value}}"
})
export class LiteralTypeComponent extends BaseTypeComponent<Value.Literal> {
}
