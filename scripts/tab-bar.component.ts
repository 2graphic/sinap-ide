// File: tab-bar.component.ts
// Created by: Daniel James
// Date created: December 7, 2016


import { Component, Input } from "@angular/core";


@Component({
    moduleId: module.id,
    selector: "sinap-tab-bar",
    templateUrl: "../html/tab-bar.component.html",
    styleUrls: ["../styles/tab-bar.component.css"]
})
export class TabBarComponent {
    public delegate: TabDelegate;
    public tabs: Tab[] = [];
    private _active: Number;
    private index = 0;

    get active() {
        if (this._active) {
            return this._active;
        } else if (this.tabs.length > 0) {
            return this.tabs[0].index;
        } else {
            return -1;
        }
    }

    set active(v: Number) {
        var tab = this.findTab(v);
        if (!tab) {
            return;
        }

        this._active = v;
        if (this.delegate) {
            this.delegate.selectedTab(v);
        }
    }

    private findTab(index: Number):Tab {
        for (let tab of this.tabs) {
            if (tab.index == index) {
                return tab;
            }
        }

        return undefined;
    }

    // If the current tab is selected, delegate.selectedTab() is called with the new selected tab before delegate.deletedTab()
    deleteTab(index: Number) {
        var tab = this.findTab(index);
        if (!tab) {
            return;
        }

        var reselect = false;
        
        if (this.active == tab.index) {
            reselect = true;
        }

        var location = this.tabs.indexOf(tab);
        if (location >= 0) {
            this.tabs.splice(location, 1);

            if (reselect) {
                if (this.tabs.length > 0) {
                    this.active = this.tabs[0].index;
                } else {
                    if (this.delegate) {
                        this.delegate.selectedTab(-1);
                    }
                }
            }

            if (this.delegate) {
                this.delegate.deletedTab(index);
            }
        }
    }

    // This will give you the number to identify this tab with.
    newTab(name: String):Number {
        let tab = {
            'name': name,
            'index': this.index++,
        }

        this.tabs.push(tab);
        this._active = tab.index; // bypass the getter to avoid triggering the delegate
        return tab.index;
    }

    createNewTab() {
        if (this.delegate) {
            this.delegate.createNewTab();
        }
    }
}

export interface TabDelegate {
    deletedTab:(i: Number)=>void;
    selectedTab:(i: Number)=>void; // -1 = no tabs
    createNewTab:()=>void;
}

interface Tab {
    name: String;
    index: Number; // tabs can have the same name, so you must reference them by number
}
