// File: type-injector.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input, ViewContainerRef, ViewChild, ComponentFactoryResolver, ReflectiveInjector, ComponentRef, OnInit, Type as AngularType, Output, EventEmitter } from "@angular/core";
import * as Core from "sinap-core";
import { Type, Value } from "sinap-types";

import { StringTypeComponent } from "./../string-type/string-type.component";
import { BooleanTypeComponent } from "./../boolean-type/boolean-type.component";
import { ObjectTypeComponent } from "./../object-type/object-type.component";
import { NodeTypeComponent } from "./../node-type/node-type.component";
import { ListTypeComponent } from "./../list-type/list-type.component";
import { UnionTypeComponent } from "./../union-type/union-type.component";
import { NumberTypeComponent } from "./../number-type/number-type.component";
import { ColorTypeComponent } from "./../color-type/color-type.component";
import { MapTypeComponent } from "./../map-type/map-type.component";
import { LiteralTypeComponent } from "./../literal-type/literal-type.component";
import { PointTypeComponent } from "./../point-type/point-type.component";

import { GraphController } from "../../../models/graph-controller";

import { PointType } from "../point-type/point-type.component";

/**
 *
 * This class injects a component that knows how to display various core.Type.
 * value can be changed to a new core.Value and a new component will be injected.
 *
 */
@Component({
    selector: "sinap-type",
    entryComponents: [StringTypeComponent, BooleanTypeComponent, ObjectTypeComponent, ColorTypeComponent, NumberTypeComponent, UnionTypeComponent, LiteralTypeComponent, PointTypeComponent, NodeTypeComponent, ListTypeComponent, MapTypeComponent],
    template: `<ng-template #container></ng-template>`,
})
export class TypeInjectorComponent {
    constructor(private resolver: ComponentFactoryResolver) { }

    @ViewChild('container', { read: ViewContainerRef }) private container: ViewContainerRef;
    private component?: ComponentRef<any>;
    private _value?: Value.Value;
    private _disabled: boolean = false;

    @Input()
    public graph: GraphController;

    @Output()
    injected = new EventEmitter<TypeInjectorComponent>();

    /**
     * Whether the component should be readonly.
     * IE a string that is not readonly is an <input> element, otherwise it's just text.
     */
    @Input() readonly: boolean = true;

    /**
     * Whether the component should try to be focused when injected.
     */
    @Input() focus: boolean = false;

    @Input()
    set disabled(disabled: boolean) {
        this._disabled = disabled;
        if (this.component) {
            this.component.instance.disabled = disabled;
        }
    }

    @Input()
    set value(v: Value.Value | undefined) {
        this.injected.emit(this);

        if (!v) {
            this.container.clear();
            this.component = undefined;
        }
        else if (this.component && this._value) {
            try {
                if (this._value.deepEqual(v) && this._value !== v) {
                    this._value = v;
                    this.component.instance.value = v;
                }
            } catch (e) {
                console.log(e);
                // TODO: Sheyne, deepEqual after a couple recursive calls throws an exception when running dfs.
            }
        }
        else {
            this.inject(v, this.readonly, this._disabled, this.graph);
        }
    }

    get value() {
        if (this.component) {
            return this.component.instance.value as Value.Value;
        } else {
            return this._value;
        }
    }

    private inject(value: Value.Value, readonly: boolean, disabled: boolean, graph: GraphController) {
        this._value = value;

        let componentType = this.getComponentType(value);
        if (!componentType) {
            console.log("unknown type for: ", value);
            return;
        }

        // console.log(value, componentType);

        let injector = ReflectiveInjector.fromResolvedProviders([], this.container.parentInjector);
        let factory = this.resolver.resolveComponentFactory(componentType);

        this.component = factory.create(injector);
        this.component.instance.graph = graph;
        this.component.instance.readonly = readonly;
        this.component.instance.disabled = disabled;
        this.component.instance.value = value;

        this.container.clear();
        this.container.insert(this.component.hostView);

        this.component.changeDetectorRef.detectChanges();

        if (this.focus && this.component.instance.focus && (document.activeElement.tagName.toLocaleLowerCase() === "body"
            || document.activeElement.tagName.toLocaleLowerCase() === "canvas")) {
            // Make sure we're not yanking the focus away from something important

            this.component.instance.focus();
        }
    }

    private getComponentType(value: Value.Value): AngularType<any> | undefined {
        try {
            const type = value.type;

            if (value instanceof Value.Primitive) {
                if (value.type.name === "boolean") {
                    return BooleanTypeComponent;
                }
                if (value.type.name === "string") {
                    return StringTypeComponent;
                }
                if (value.type.name === "color") {
                    return ColorTypeComponent;
                }
                if (value.type.name === "number") {
                    return NumberTypeComponent;
                }
            }

            if (value instanceof Value.CustomObject) {
                if (value.type instanceof Core.ElementType) {
                    return NodeTypeComponent;
                }

                return ObjectTypeComponent;
            }

            if (value instanceof Value.Union) {
                return UnionTypeComponent;
            }

            if (value instanceof Value.Literal) {
                return LiteralTypeComponent;
            }

            if (value instanceof Value.Record) {
                if (value.type.equals(PointType)) {
                    return PointTypeComponent;
                } else {
                    // TODO:
                }
            }

            if (value instanceof Value.ArrayObject) {
                return ListTypeComponent;
            }

            if (value instanceof Value.MapObject) {
                return MapTypeComponent;
            }

            return undefined;
        } catch (e) {
            // TODO: No errors
            console.log(e);
            return undefined;
        }

    }
}