// File: object-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { CoreValue, isObjectType, PluginTypeEnvironment, CoreMapValue, ObjectType } from "sinap-core";

@Component({
    selector: "sinap-map-type",
    templateUrl: "./map-type.component.html",
    styleUrls: ["./map-type.component.scss"]
})
export class MapTypeComponent {
    @Input() readonly: boolean = true;

    private values: [CoreValue<PluginTypeEnvironment>, CoreValue<PluginTypeEnvironment>][] = [];

    @Input()
    set value(v: CoreValue<PluginTypeEnvironment>) {
        this.values.length = 0;
        if (v instanceof CoreMapValue) {
            v.map.forEach((v, k) => {
                this.values.push([k, v]);
            });
        } else {
            console.log(v, " not an instance of CoreMapValue");
        }
    }
}
