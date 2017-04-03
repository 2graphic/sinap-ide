// File: status-bar.component.ts
// Created by: Daniel James
// Date created: December 1, 2016
// Contributors:
// - CJ Dimaano


import { Component, EventEmitter, Output, Input, ElementRef } from "@angular/core";


@Component({
    selector: "sinap-status-bar",
    templateUrl: "./status-bar.component.html",
    styleUrls: ["./status-bar.component.scss"]
})
export class StatusBarComponent {
    constructor(private readonly el: ElementRef) {
        this.zoom = 1;
    }

    @Input() info: StatusBarInfo | undefined;
    @Input() zoom: number;
    @Output() zoomChange = new EventEmitter<number>();

    get offsetHeight() {
        return this.el.nativeElement.offsetHeight;
    }

    get offsetWidth() {
        return this.el.nativeElement.offsetWidth;
    }

    get zoomText() {
        return Math.round(100 * this.zoom) + ' %';
    }

    private onZoomIn() {
        this.zoom = Math.min(this.zoom * 1.05, 8);
        this.onZoomChange();
    }

    private onZoomOut() {
        this.zoom = Math.max(this.zoom / 1.05, 0.125);
        this.onZoomChange();
    }

    private onZoomChange(evt?: Event) {
        if (evt) {
            const target = evt.currentTarget as HTMLInputElement;
            this.zoom = Number.parseFloat(target.value);
        }
        this.zoomChange.emit(this.zoom);
    }

    private updateZoom(evt: FocusEvent) {
        const target = evt.currentTarget as HTMLInputElement;
        let text: string | number = target.value.trim();
        if (text.endsWith("%"))
            text = text.substr(0, text.length - 1).trim();
        let value = Number.parseFloat(text);
        if (Number.isNaN(value))
            target.value = this.zoomText;
        else {
            value = Math.max(12.5, value);
            value = Math.min(800, value);
            this.zoom = value / 100;
            this.onZoomChange();
        }
    }

    private enterZoom(evt: KeyboardEvent) {
        const target = evt.currentTarget as HTMLInputElement;
        if (evt.key === "Enter")
            target.blur();
    }
}

export interface StatusBarInfo {
    title: string;
    items: string[];
}
