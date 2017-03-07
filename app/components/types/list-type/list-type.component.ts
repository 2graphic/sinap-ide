// File: list-type.component.ts
// Created by: Daniel James
// Date created: March 6, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue } from "sinap-core";

@Component({
    selector: "sinap-list-type",
    templateUrl: "./list-type.component.html",
    styleUrls: ["./list-type.component.scss"]
})
export class ListTypeComponent {
    @Input() value: CoreValue;
    @Input() readonly: boolean = true;
}
