/**
 * @file `dynamic-panel.ts`
 *   Created on March 21, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html}
 */


import {
    Component,
    ComponentFactoryResolver,
    Directive,
    ElementRef,
    Input,
    Type,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import { ResizeEvent } from 'angular-resizable-element';


@Directive({
    selector: "[dynamic-content]"
})
export class DynamicPanelDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}


@Component({
    selector: "dynamic-panel",
    templateUrl: "./dynamic-panel.component.html",
    styleUrls: ["./dynamic-panel.component.scss"]
})
export class DynamicPanelComponent {
    constructor(private _componentFactoryResolver: ComponentFactoryResolver) { }

    private _panels: DynamicPanelItem[];

    private _currentIndex: number
    = -1;

    public isCollapsed: boolean
    = false;

    private _height: number
    = 0;

    private _width: number
    = 0;

    private _maxHeight?: number;

    private _maxWidth?: number;

    private _minHeight: number
    = 0;

    private _minWidth: number
    = 0;

    @ViewChild("container")
    container: ElementRef;

    @ViewChild(DynamicPanelDirective)
    dynamicContent: DynamicPanelDirective;

    @Input()
    set maximumHeight(value: number | undefined) {
        this._maxHeight = value;
        this.height = this.height;
    }

    @Input()
    set maximumWidth(value: number | undefined) {
        this._maxWidth = value;
        this.width = this.width;
    }

    @Input()
    set minimumHeight(value: number) {
        this._minHeight = value;
        this.height = this.height;
    }

    @Input()
    set minimumWidth(value: number) {
        this._minWidth = value;
        this.width = this.width;
    }

    title: string
    = "";

    get height() {
        return this.isCollapsed ? 0 : this._height;
    }

    set height(value: number) {
        this._height = Math.max(value, this._minHeight);
        if (this._maxHeight)
            this._height = Math.min(this._height, this._maxHeight);
        if (this.container)
            this.container.nativeElement.style.height = this._height + "px";
    }

    get width() {
        return this.isCollapsed ? 0 : this._width;
    }

    set width(value: number) {
        this._width = Math.max(value, this._minWidth);
        if (this._maxWidth)
            this._width = Math.min(this._width, this._maxWidth);
        if (this.container)
            this.container.nativeElement.style.width = this._width + "px";
    }

    @Input()
    isVertical: boolean
    = false;

    isEmpty() {
        return this._panels.length === 0;
    }

    get panels() {
        /**
         * @see {@link https://github.com/angular/angular/issues/6392}
         */
        return Array.from(this._panels);
    }

    get currentPanel() {
        return this._currentIndex < 0 || this._currentIndex >= this._panels.length ?
            null :
            this._panels[this._currentIndex];
    }

    @Input()
    set panels(value: DynamicPanelItem[]) {
        this._panels = value;
        this.updateContent(
            value ?
                this._panels[Math.min(Math.max(0, this._currentIndex), value.length - 1)] :
                null
        );
    }

    titlebarItems?: TitlebarItem[];

    private updateContent(panel: DynamicPanelItem | null) {
        if (this.isCollapsed) {
            this.toggleCollapse();
        }
        if (this.dynamicContent) {
            const containerRef = this.dynamicContent.viewContainerRef;
            containerRef.clear();
            if (panel) {
                this.title = panel.text;
                const factory = this._componentFactoryResolver
                    .resolveComponentFactory(panel.component);
                const componentRef = containerRef.createComponent(factory);
                (componentRef.instance as PanelComponent<any>).data = panel.data;
                this.titlebarItems = componentRef.instance.titlebarItems;
                this._currentIndex = this._panels.findIndex(v => v === panel);
            }
            else {
                this.title = "";
                this._currentIndex = -1;
                this.titlebarItems = undefined;
            }
        }
    }

    private toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    private resizing(evt: ResizeEvent) {
        if (this.isVertical) {
            if (evt.rectangle.height)
                this.height = evt.rectangle.height;
        }
        else {
            if (evt.rectangle.width)
                this.width = evt.rectangle.width;
        }
    }

}


export type TitlebarItem = TitlebarButton | TitlebarSpacer;

export interface PanelComponent<T> {
    data: T;
}

export interface TitleBarItems {
    titlebarItems: TitlebarItem[];
}

export class TitlebarButton {
    constructor(
        public icon: string,
        public title: string,
        isDisabled?: boolean,
        click?: (...args: any[]) => void
    ) {
        if (isDisabled !== undefined)
            this.isDisabled = isDisabled;
        if (click)
            this.click = click;
    }
    readonly kind = "button";
    isDisabled = false;
    click: (sender: TitlebarButton) => void
    = () => { };
}

export class TitlebarSpacer {
    constructor() { }
    readonly kind = "spacer";
}

export class DynamicPanelItem {
    constructor(
        public readonly component: Type<any>,
        public readonly data: any,
        public readonly text: string,
        public readonly icon: string,
    ) { }
}


@Component({
    template: `test panel`
})
export class DynamicTestPanelComponent implements PanelComponent<any> {
    data: any;
}
