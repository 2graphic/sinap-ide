// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component, Input, ViewChild, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service";
import { CollapsibleListComponent } from "./../../components/collapsible-list/collapsible-list.component";
import { ModalInfo, ModalComponent } from "./../../models/modal-window";
import { PluginData } from "../../services/plugin.service";

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
        const plugins: PluginData[] = modalInfo.data;
        // This code is extremely evil but necessary.
        for (const plugin of plugins) {
            Object.setPrototypeOf(plugin, PluginData.prototype);
        }

        const result: any = {};
        for (const plugin of plugins) {
            const group = plugin.group;
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(plugin);
        }

        this.availablePlugins = Object.keys(result).map((group) => new PluginList(group, result[group]));
    }

    private availablePlugins: PluginList[];
    private selectedPlugin: PluginData;
    @ViewChild(CollapsibleListComponent) firstList: CollapsibleListComponent;
    @ViewChildren(CollapsibleListComponent) lists: QueryList<CollapsibleListComponent>;

    constructor(private windowService: WindowService, private changeDetectorRef: ChangeDetectorRef) { };

    ngAfterViewInit() {
        if (this.firstList) {
            this.firstList.selectedIndex = 0;
            this.selectedPlugin = this.firstList.items[this.firstList.selectedIndex];
            this.changeDetectorRef.detectChanges();
        }
    }

    newSelection(list: CollapsibleListComponent) {
        this.lists.forEach((l) => {
            if (l !== list) {
                l.selectedIndex = -1;
            }
        });
        this.selectedPlugin = list.items[list.selectedIndex];
        this.changeDetectorRef.detectChanges();
    }

    public createNewFile(filename: string) {
        if (filename) {
            this.windowService.closeWindow(new NewFileResult(filename, this.selectedPlugin.path));
        }
    }

    public cancel() {
        this.windowService.closeWindow();
    }
}

class PluginList {
    constructor(public readonly title: string, public readonly plugins: PluginData[]) {
    }
}
