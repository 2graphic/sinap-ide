// File: boolean-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, PluginTypeEnvironment } from "sinap-core";

@Component({
    selector: "sinap-boolean-type",
    templateUrl: "./boolean-type.component.html",
    styleUrls: ["./boolean-type.component.scss"]
})
export class BooleanTypeComponent {
    @Input() value: CoreValue<PluginTypeEnvironment>;
    @Input() readonly: boolean = true;
}
