// File: dynamic-component.component.ts
// Created by: Daniel James
// Date created: January 30, 2017
//


import { Component, ViewContainerRef, ViewChild, ComponentFactoryResolver, ComponentRef, OnInit, Type, ReflectiveInjector, Input } from '@angular/core';

export class ComponentInfo<G> {
    constructor(readonly name: string, public readonly type: Type<G>) {
    }

    toString() {
        return this.name;
    }
}

@Component({
    selector: 'sinap-dynamic-component',
    template: `<div #container></div>`,
})
export class DynamicComponent {
    private currentComponent: ComponentRef<any>;

    @ViewChild('container', { read: ViewContainerRef })
    private container: ViewContainerRef;

    @Input()
    set info(info: ComponentInfo<any> | undefined) {
        this.container.clear();

        if (info && info.type) {
            const injector = ReflectiveInjector.fromResolvedProviders([], this.container.parentInjector);

            const factory = this.resolver.resolveComponentFactory(info.type);
            const component = factory.create(injector);
            component.instance.context = info;
            this.container.insert(component.hostView);

            component.changeDetectorRef.detectChanges();
        };
    }

    constructor(private resolver: ComponentFactoryResolver) { }
}
