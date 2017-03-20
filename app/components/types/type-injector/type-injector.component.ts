// File: type-injector.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input, ViewContainerRef, ViewChild, ComponentFactoryResolver, ReflectiveInjector, ComponentRef, OnInit, Type } from "@angular/core";
import { CoreValue, Type as CoreType, isObjectType, PluginTypeEnvironment, isUnionType, CorePrimitiveValue} from "sinap-core";

import { StringTypeComponent } from "./../string-type/string-type.component";
import { BooleanTypeComponent } from "./../boolean-type/boolean-type.component";
import { ObjectTypeComponent } from "./../object-type/object-type.component";
import { NodeTypeComponent } from "./../node-type/node-type.component";
import { ListTypeComponent } from "./../list-type/list-type.component";
import { UnionTypeComponent } from "./../union-type/union-type.component";
import { NumberTypeComponent } from "./../number-type/number-type.component";
import { ColorTypeComponent } from "./../color-type/color-type.component";


/**
 *
 * This class injects a component that knows how to display various core.Type.
 * value can be changed to a new core.Value and a new component will be injected.
 *
 */
@Component({
    selector: "sinap-type",
    entryComponents: [StringTypeComponent, BooleanTypeComponent, ObjectTypeComponent, NodeTypeComponent, ListTypeComponent, UnionTypeComponent, NumberTypeComponent, ColorTypeComponent],
    template: `<template #container></template>`,
})
export class TypeInjectorComponent {
    constructor(private resolver: ComponentFactoryResolver) { }

    @ViewChild('container', { read: ViewContainerRef }) private container: ViewContainerRef;
    private component?: ComponentRef<any>;
    private _value?: CoreValue<PluginTypeEnvironment>;
    private _disabled: boolean = false;

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
    set value(v: CoreValue<PluginTypeEnvironment> | undefined) {
        if (!v) {
            this.container.clear();
            this.component = undefined;
        } else if (this.component && this._value && this.areEqual(this._value, v)) {
            if (this._value !== v) {
                this.component.instance.value = v;
            }
        } else {
            this.inject(v, this.readonly, this._disabled);
        }
    }

    private areEqual(a: CoreValue<PluginTypeEnvironment>, b: CoreValue<PluginTypeEnvironment>) {
        return false; // (a.type.isAssignableTo(b.type) && b.type.isAssignableTo(a.type) && a.type === b.value);
    }

    private inject(value: CoreValue<PluginTypeEnvironment>, readonly: boolean, disabled: boolean) {
        this._value = value;

        let componentType = this.getComponentType(value);
        if (!componentType) {
            return;
        }

        if (!value.mutable) {
            value.mutable = true; // TODO: Fix this
        }

        console.log(value, componentType);

        let injector = ReflectiveInjector.fromResolvedProviders([], this.container.parentInjector);
        let factory = this.resolver.resolveComponentFactory(componentType);

        this.component = factory.create(injector);
        this.component.instance.readonly = readonly;
        this.component.instance.disabled = disabled;
        this.component.instance.value = value;

        this.container.clear();
        this.container.insert(this.component.hostView);

        this.component.changeDetectorRef.detectChanges();

        if (this.focus && this.component.instance.focus && document.activeElement.tagName.toLocaleLowerCase() === "body") {
            // Make sure we're not yanking the focus away from something important
            this.component.instance.focus();
        }
    }

    private getComponentType(value: CoreValue<PluginTypeEnvironment>): Type<any> | undefined {
        try {
            const type = value.type;
            const env = type.env;

            if (type.name === "NFANode[]") {
                return ListTypeComponent;
            }

            if (type.name === "true | false" || type.isAssignableTo(env.getBooleanType())) {
                return BooleanTypeComponent;
            }

            if (isUnionType(type)) {
                return UnionTypeComponent;
            }

            if (type.isAssignableTo(env.lookupPluginType("Nodes"))) {
                return NodeTypeComponent;
            }

            if (type.isAssignableTo(env.lookupPluginType("Error"))) {
                return StringTypeComponent; // TODO: Make error component
            }

            // TODO: fix
            if (type.isAssignableTo(env.lookupSinapType("Color")) || (value instanceof CorePrimitiveValue && value.data !== undefined && (value.data as any).toString().charAt(0) === "#")) {
                return ColorTypeComponent;
            }

            if (type.isAssignableTo(env.getNumberType())) {
                return NumberTypeComponent;
            }

            if (type.isAssignableTo(env.getStringType())) {
                return StringTypeComponent;
            }

            if (isObjectType(type)) {
                return ObjectTypeComponent;
            }

            // if (typeof value.value === "object") {
            //     const members = new Map<string, CoreType>();
            //     Object.keys(value.value).forEach((k) => {
            //         members.set(k, type.env.getBooleanType());
            //     });

            //     (value.type as any).members = members;

            //     return ObjectTypeComponent;
            // }

            console.log("Unknown type for Value: ", value);
            return undefined;
        } catch (e) {
            console.log(e);
            return undefined;
        }

    }
}
