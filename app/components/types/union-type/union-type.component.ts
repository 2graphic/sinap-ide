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
    private _value: Value.Union;
    private _selected: Type.Type;
    private selectedValue: Value.Value | undefined = undefined;
    private set selected(selected: Type.Type) {
        this._selected = selected;

        const previousValue = this.value.value;

        const newValue = this.value.environment.make(selected);

        if (newValue instanceof Value.Literal) {
            this.selectedValue = undefined;
        } else {
            if (previousValue instanceof Value.Literal && newValue instanceof Value.Primitive
                && Type.isSubtype(previousValue.type, newValue.type)) {
                newValue.value = previousValue.value;
            }

            this.selectedValue = newValue;
        }

        this.value.value = newValue;
    }
    private get selected() {
        return this._selected;
    }

    set value(v: Value.Union) {
        this._value = v;

        this.options = [];
        v.type.types.forEach((t) => {
            if (Type.isSubtype(v.value.type, t)) {
                this._selected = t;
                if (this.value.value instanceof Value.Literal) {
                    this.selectedValue = undefined;
                } else {
                    this.selectedValue = this.value.value;
                }
            }

            this.options.push([this.getName(t), t]);
        });
    }

    get value() {
        return this._value;
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
