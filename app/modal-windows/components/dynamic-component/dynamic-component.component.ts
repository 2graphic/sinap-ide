// File: dynamic-component.component.ts
// Created by: Daniel James
// Date created: January 30, 2017
//


import { Component, ViewContainerRef, ViewChild, ComponentFactoryResolver, ComponentRef, OnInit, Type } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { WindowService } from './../../services/window.service';

import { NewFileComponent } from './../../../components/new-file/new-file.component'; //TODO, shorter way to do this...?

/**
 * This component loads one of the components specified in componentMap depending on ModalInfo.kind for this window.
 */
@Component({
    selector: 'sinap-dynamic-component',
    entryComponents: [NewFileComponent],
    template: `<div #container></div>`,
    providers: [WindowService]
})
export class DynamicComponent {
    private currentComponent: ComponentRef<any>;

    @ViewChild('container', { read: ViewContainerRef })
    private container: ViewContainerRef;

    // TODO: I wish there was a better way to do this.
    /**
     * Add the type information for each component you want this component to be able to create.
     */
    private componentMap = new Map<string, [string, Type<any>]>(
        [["sinap-new-file", ["New File", NewFileComponent]]]
        // Preferences, etc...
    );

    constructor(private resolver: ComponentFactoryResolver, private titleService: Title, private windowService: WindowService) { }

    ngAfterViewInit() {
        let windowInfo = this.windowService.windowInfo;
        console.log(windowInfo);
        if (windowInfo) {
            let componentInfo = this.componentMap.get(windowInfo.selector);
            if (componentInfo) {
                let [name, component] = componentInfo;

                this.titleService.setTitle(name);

                let factory = this.resolver.resolveComponentFactory(component);
                this.container.createComponent(factory);
            }
        }
    }
}
