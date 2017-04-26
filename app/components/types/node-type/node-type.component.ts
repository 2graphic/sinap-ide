// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";
import { ElementValue, ElementType } from "sinap-core";
import { imap, ifilter } from "sinap-types/lib/util";
import { getPath } from "../../../util";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent extends BaseTypeComponent<ElementValue> {
    private label: string = "";
    private _borderColor?: string;
    private _color?: string;
    private image?: string;
    private square: boolean = false; ;

    private _value: ElementValue;

    private options: [string, Value.Value][] = [];

    get borderColor() {
        return this._borderColor ? this._borderColor : "#000000";
    }

    get color() {
        return this._color ? this._color : "#fff2000";
    }

    @Input()
    set value(value: ElementValue) {
        if (!this.readonly) {
            // TODO: Once graph is the graph controller for the program's model, this can use that instead of environment.
            const matchingValues = ifilter((v) => Type.isSubtype(v.type, value.type), value.environment.values.values());
            this.options = [...imap((n): [string, Value.Value] => [this.getLabel(n as ElementValue), n], matchingValues)];
        } else this.options = [];

        this.selectedOption(value);
    }

    get value() {
        return this._value;
    }

    // TODO: Move this into a util collection
    private getPrimitiveAsString(v: Value.CustomObject, key: string): string | undefined {
        let keyValue: Value.Value | undefined;

        if (v.type instanceof ElementType && v.type.pluginType.methods.has(key)) {
            const r = v.call(key);
            keyValue = r ? r : undefined;
        } else if (!keyValue && v.type.members.has(key)) {
            keyValue = v.get(key);

        }
        if (keyValue instanceof Value.Primitive && typeof keyValue.value === "string") {
            return keyValue.value;
        }

        if (keyValue instanceof Value.Union && (keyValue.value instanceof Value.Primitive || keyValue.value instanceof Value.Literal) && typeof keyValue.value.value === "string") {
            return keyValue.value.value;
        }

        return undefined;
    }

    private getLabel(node: ElementValue) {
        const label = this.getPrimitiveAsString(node, "label");

        const index = [...node.environment.values.entries()].map((v) => v[1]).filter((v) => {
            return Type.isSubtype(v.type, node.type);
        }).indexOf(node);

        return label ? label : node.type.pluginType.name + " " + index;
    }

    selectedOption(option: ElementValue) {
        this._value = option;

        this._borderColor = this.getPrimitiveAsString(option, "borderColor");
        this._color = this.getPrimitiveAsString(option, "color");
        if (this.graph) {
            const image = this.getPrimitiveAsString(option, "image");
            if (image && image !== '') {
                this.image = getPath(this.graph.plugin.pluginInfo.interpreterInfo.directory + "/" + image);
            } else {
                this.image = undefined;
            }
        } else {
            this.image = undefined;
        }

        const shape = this.getPrimitiveAsString(option, "shape");
        if (shape && (shape === "square" || shape === "rectangle")) {
            this.square = true;
        } else {
            this.square = false;
        }

        this.label = this.getLabel(option);
    }

    selectNode(e: Event) {
        if (!this.graph) return;
        const found = [...this.graph.core.nodes.values()].find((n) => n.uuid === this._value.uuid);
        if (found) {
            this.graph.selectElements(found);
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
