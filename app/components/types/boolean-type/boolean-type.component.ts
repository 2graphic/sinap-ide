// File: boolean-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { Type } from "sinap-core";
import { Value } from "./../../../services/plugin.service";

@Component({
    selector: "sinap-boolean-type",
    templateUrl: "./boolean-type.component.html",
    styleUrls: ["./boolean-type.component.scss"]
})
export class BooleanTypeComponent {
    @Input() value: Value;
    @Input() readonly: boolean = true;
}
