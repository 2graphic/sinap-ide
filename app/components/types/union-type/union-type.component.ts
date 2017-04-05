// File: union-type.component.ts
// Created by: Daniel James
// Date created: March 20, 2017
//

import { Component, Input, ViewChild, ElementRef } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";

@Component({
    selector: "sinap-union-type",
    templateUrl: "./union-type.component.html",
    styleUrls: ["./union-type.component.scss"]
})
export class UnionTypeComponent extends BaseTypeComponent<Value.Union> {
    private options: [string, Type.Type][];
    private _selected: Type.Type;
    private selectedValue: Value.Value | undefined = undefined;
    private set selected(selected: Type.Type) {
        this.value.value = this.value.environment.make(selected);

        if (this.value.value instanceof Value.Literal) {
            this.selectedValue = undefined;
        } else {
            this.selectedValue = this.value.value;
        }
    }
    private get selected() {
        return this._selected;
    }

    set value(v: Value.Union) {
        console.log(v);

        super.value = v;

        this.options = [];
        v.type.types.forEach((t) => {
            if (v.value.type.equals(t)) {
                this.selected = t;
            }

            this.options.push([this.getName(t), t])
        });
    }

    selectedOption(option: Type.Type) {
        this.selected = option;
    }

    private getName(t: Type.Type) {
        if (t instanceof Type.Literal && /^\".*\"$/.test(t.name)) {
            return t.name.slice(1, t.name.length - 1);
        } else {
            return t.name;
        }
    }
}
