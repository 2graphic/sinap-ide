// File: tab-bar.component.ts
// Created by: Daniel James
// Date created: December 7, 2016


import { Component, Input, ElementRef } from "@angular/core";


@Component({
    selector: "sinap-tab-bar",
    templateUrl: "./tab-bar.component.html",
    styleUrls: ["./tab-bar.component.scss"]
})
export class TabBarComponent {
    constructor(private readonly el: ElementRef) { }

    public delegate: TabDelegate;
    public tabs: Tab[] = [];
    private _active: number;
    private index = 0;

    get offsetHeight() {
        return this.el.nativeElement.offsetHeight;
    }

    get offsetWidth() {
        return this.el.nativeElement.offsetWidth;
    }

    get active() {
        if (this._active) {
            return this._active;
        } else if (this.tabs.length > 0) {
            return this.tabs[0].index;
        } else {
            return -1;
        }
    }

    set active(v: number) {
        let tab = this.findTab(v);
        if (!tab) {
            return;
        }

        this._active = v;
        if (this.delegate) {
            this.delegate.selectedTab(v);
        }
    }

    private findTab(index: number): Tab | null {
        for (let tab of this.tabs) {
            if (tab.index === index) {
                return tab;
            }
        }

        return null;
    }

    // If the current tab is selected, delegate.selectedTab() is called with the new selected tab before delegate.deletedTab()
    deleteTab(index: number) {
        const tab = this.findTab(index);
        if (tab !== null) {
            const f = () => {
                let reselect = false;

                if (this.active === tab.index) {
                    reselect = true;
                }

                let location = this.tabs.indexOf(tab);
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
            };

            if (this.delegate) {
                this.delegate.canDeleteTab(index).then((can) => {
                    if (!can) return;
                    f();
                });
            } else {
                f();
            }
        }
    }

    // This will give you the number to identify this tab with.
    newTab(data: any): number {
        const tab = new Tab(data, this.index++);

        this.tabs.push(tab);
        this._active = tab.index; // bypass the getter to avoid triggering the delegate
        return tab.index;
    }

    createNewTab() {
        if (this.delegate) {
            this.delegate.createNewTab();
        }
    }

    private findPosition(index: number) {
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].index === index) {
                return i;
            }
        }

        return undefined;
    }

    selectPreviousTab() {
        const i = this.findPosition(this.active);
        if (i !== undefined && i > 0) {
            this.active = this.tabs[i - 1].index;
        }
    }

    selectNextTab() {
        const i = this.findPosition(this.active);
        if (i !== undefined && i < this.tabs.length - 1) {
            this.active = this.tabs[i + 1].index;
        }
    }
}

export interface TabDelegate {
    canDeleteTab: (i: number) => Promise<boolean>;
    deletedTab: (i: number) => void;
    selectedTab: (i: number) => void; // -1 = no tabs
    createNewTab: () => void;
}

class Tab {
    constructor(public data: any, public readonly index: number) { };
}
