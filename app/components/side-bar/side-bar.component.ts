// File: side-bar.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


import { Component, Input } from "@angular/core";


@Component({
    selector: "sinap-side-bar",
    templateUrl: "./side-bar.component.html",
    styleUrls: ["./side-bar.component.scss"]
})
export class SideBarComponent {
    @Input() icons: SideBarIcon[];
    @Input() vertical: boolean;
    @Input() title: boolean;

    private _active: String;

    get active() {
        if (this._active) {
            return this._active;
        } else {
            return this.icons[0].name;
        }
    }

    set active(v: String) {
        this._active = v;
    }

    setActive(icon: SideBarIcon) {
        this._active = icon.name;
    }

    private getSortedIcons() {
        if (!this.vertical) {
            return this.icons.slice().reverse();
        } else {
            return this.icons;
        }
    }
}

export interface SideBarIcon {
    path: String;
    name: String;
}