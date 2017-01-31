import { Component, ViewContainerRef, ViewChild, ComponentFactoryResolver, ComponentRef, OnInit } from '@angular/core';
import { WindowService } from './../../services/window.service';

import { NewFileComponent } from './../../../components/new-file/new-file.component'; //TODO, shorter way to do this...?

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
    private componentMap = new Map(
        [["sinap-new-file", NewFileComponent]]
    );

    constructor(private resolver: ComponentFactoryResolver, private windowService: WindowService) { }

    ngAfterViewInit() {
        let windowInfo = this.windowService.windowInfo;
        if (windowInfo) {
            let component = this.componentMap.get(windowInfo.kind);
            if (component) {
                let factory = this.resolver.resolveComponentFactory(NewFileComponent);
                this.container.createComponent(factory);
            }
        }
    }
}
