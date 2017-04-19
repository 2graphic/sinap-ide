// File: number-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";

@Component({
    selector: "sinap-number-type",
    templateUrl: "./number-type.component.html",
    styleUrls: ["./number-type.component.scss"]
})
export class NumberTypeComponent extends BaseTypeComponent<Value.Primitive> {
    @ViewChild('input') input: ElementRef;

    focus() {
        if (this.input) {
            this.input.nativeElement.focus();
        }
    }

    private round(n: number) {
        return Math.round(n * 10) / 10;
    }

    private setValue(n: number | null) {
        this.value.value = n ? n : 0;
    }
}
