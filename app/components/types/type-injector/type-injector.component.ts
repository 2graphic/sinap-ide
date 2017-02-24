// File: type-injector.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input, ViewContainerRef, ViewChild, ComponentFactoryResolver, ReflectiveInjector, ComponentRef, OnInit, Type } from "@angular/core";
import { Value } from "./../../../services/plugin.service";

import { StringTypeComponent } from "./../string-type/string-type.component";
import { BooleanTypeComponent } from "./../boolean-type/boolean-type.component";
import { ObjectTypeComponent } from "./../object-type/object-type.component";
import { NodeTypeComponent } from "./../node-type/node-type.component";


/**
 *
 * This class injects a component that knows how to display various core.Type.
 * value can be changed to a new core.Value and a new component will be injected.
 *
 */
@Component({
    selector: "sinap-type",
    entryComponents: [StringTypeComponent, BooleanTypeComponent, ObjectTypeComponent, NodeTypeComponent],
    template: `<template #container></template>`,
})
export class TypeInjectorComponent {
    constructor(private resolver: ComponentFactoryResolver) { }

    @ViewChild('container', { read: ViewContainerRef }) private container: ViewContainerRef;
    private component?: ComponentRef<any>;

    private _value: Value;
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


    private componentMap = new Map<string, Type<any>>(
        [
            ["string", StringTypeComponent],
            ["error", StringTypeComponent],
            ["boolean", BooleanTypeComponent],
            ["object", ObjectTypeComponent],
            ["node", NodeTypeComponent],
        ]
    );

    @Input()
    set disabled(disabled: boolean) {
        this._disabled = disabled;
        if (this.component) {
            this.component.instance.disabled = disabled;
        }
    }

    @Input()
    set value(v: Value) {
        this._value = v;
        this.inject(v, this.readonly, this._disabled);
    }

    private inject(value: Value, readonly: boolean, disabled: boolean) {
        if (value) {
            let componentType = this.componentMap.get(value.type);
            if (componentType) {
                let injector = ReflectiveInjector.fromResolvedProviders([], this.container.parentInjector);
                let factory = this.resolver.resolveComponentFactory(componentType);

                this.component = factory.create(injector);
                this.component.instance.value = value;
                this.component.instance.readonly = readonly;
                this.component.instance.disabled = disabled;

                this.container.clear();
                this.container.insert(this.component.hostView);

                this.component.changeDetectorRef.detectChanges();

                if (this.focus && this.component.instance.focus) {
                    this.component.instance.focus();
                }
            }
        }
    }
}
