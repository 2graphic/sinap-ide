// File: string-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { PrimitiveTypeComponent } from "../type-injector/base-classes";
import { Value } from "sinap-types";

@Component({
    selector: "sinap-string-type",
    templateUrl: "./string-type.component.html",
    styleUrls: ["./string-type.component.scss"]
})
export class StringTypeComponent extends PrimitiveTypeComponent {
    @ViewChild('input') input: ElementRef;

    focus() {
        if (this.input) {
            this.input.nativeElement.focus();
        }
    }
}
