// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component, Input, ViewChild, AfterViewInit, ChangeDetectorRef } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service";
import { CollapsibleListComponent } from "./../../components/collapsible-list/collapsible-list.component";
import { ModalInfo, ModalComponent } from "./../../models/modal-window";

export class NewFileResult {
    constructor(readonly name: string, readonly kind: string[]) {
    }
}

@Component({
    selector: "sinap-new-file",
    templateUrl: "./new-file.component.html",
    styleUrls: ["./new-file.component.scss"],
    providers: [WindowService]
})
export class NewFileComponent implements ModalComponent, AfterViewInit {
    set modalInfo(modalInfo: ModalInfo) {
        let plugins: string[][] = modalInfo.data;
        let availablePlugins: any = { subLists: {} };

        let plugin: string[] | undefined;
        while (plugin = plugins.pop()) {
            let pluginPath = [...plugin.values()];
            let part: string | undefined;
            let next = availablePlugins;
            while (part = plugin.shift()) {
                if (plugin.length === 0) {
                    if (!next.plugins) {
                        next.plugins = [];
                    }
                    next.plugins.push([part, pluginPath]);
                } else {
                    if (!next.subLists) {
                        next.subLists = {};
                    }
                    if (!next.subLists[part]) {
                        next.subLists[part] = {};
                    }
                    next = next.subLists[part];
                }
            }
        }

        this.availablePlugins = Object.keys(availablePlugins.subLists).map((key) => {
            return new PluginList(key, availablePlugins.subLists[key]);
        });
    }

    private availablePlugins: PluginList[];
    private selectedPlugin: string[];
    @ViewChild(CollapsibleListComponent) firstList: CollapsibleListComponent;

    constructor(private windowService: WindowService, private changeDetectorRef: ChangeDetectorRef) { };

    ngAfterViewInit() {
        if (this.firstList) {
            this.firstList.selectedIndex = 0;
            this.selectedPlugin = this.firstList.items[this.firstList.selectedIndex].path;
            this.changeDetectorRef.detectChanges();
        }
    }

    newSelection(list: CollapsibleListComponent) {
        this.selectedPlugin = list.items[list.selectedIndex].path;
    }

    public createNewFile(filename: string) {
        if (filename) {
            this.windowService.closeWindow(new NewFileResult(filename, this.selectedPlugin));
        }
    }

    public cancel() {
        this.windowService.closeWindow();
    }
}

class PluginList {
    subLists: PluginList[] = [];
    plugins: PluginInfo[] = [];

    constructor(public readonly title: string, pluginMap: any) {
        if (pluginMap.plugins) {
            this.plugins = pluginMap.plugins.map((a: [string, string[]]) => {
                return new PluginInfo(a[0], a[1]);
            });
            pluginMap.plugins = undefined;
        }
        if (pluginMap.subLists) {
            this.subLists = Object.keys(pluginMap.subLists).map((key) => {
                return new PluginList(key, pluginMap.subLists[key]);
            });
        }
    }
}

class PluginInfo {
    constructor(public readonly name: string, public readonly path: string[]) { };
    toString() {
        return this.name;
    }
}