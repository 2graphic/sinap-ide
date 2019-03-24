// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component, Input, ViewChild, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from "@angular/core";
import { CollapsibleListComponent } from "./../../components/collapsible-list/collapsible-list.component";
import { PluginInfo } from "sinap-core";
import { ResizeEvent } from 'angular-resizable-element';
import { PluginService } from "../../services/plugin.service";

export class NewFileResult {
    constructor(readonly name: string, readonly kind: string[]) {
    }
}

@Component({
    selector: "sinap-new-file",
    templateUrl: "./new-file.component.html",
    styleUrls: ["./new-file.component.scss"],
})
export class NewFileComponent implements AfterViewInit {
    private filename: string = "";
    set plugins(plugins: PluginInfo[]) {
        this.filename = "";

        // This code is extremely evil but necessary.
        for (const plugin of plugins) {
            Object.setPrototypeOf(plugin, PluginInfo.prototype);
        }

        const result: any = {};
        for (const plugin of plugins) {
            const group = plugin.pluginKind[0];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(plugin);
        }

        this.availablePlugins = Object.keys(result).map((group) => new PluginList(group, result[group]));
    }

    private availablePlugins: PluginList[];
    private selectedPlugin: PluginInfo;
    private width = 200;
    @ViewChild(CollapsibleListComponent) firstList: CollapsibleListComponent;
    @ViewChild('filenameInput') filenameInput: ElementRef;
    @ViewChildren(CollapsibleListComponent) lists: QueryList<CollapsibleListComponent>;

    constructor(private pluginService: PluginService, private changeDetectorRef: ChangeDetectorRef) {
        this.pluginService.pluginData.then(d => this.plugins = d);
    };

    ngAfterViewInit() {
        if (this.firstList) {
            this.firstList.selectedIndex = 0;
            this.selectedPlugin = this.firstList.items[this.firstList.selectedIndex];
            this.changeDetectorRef.detectChanges();
            if (this.filenameInput) {
                this.filenameInput.nativeElement.focus();
            }
        }

        setTimeout(() => {
            // this.windowService.showWindow(this._modalInfo.id);
        }, 30); // TODO: Figure out how to reliably tell when the component has rendered.
    }

    private resizing(evt: ResizeEvent) {
        if (evt.rectangle.width) {
            this.width = Math.max(Math.min(evt.rectangle.width, 325), 185);
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
        // this.windowService.closeModal(this._modalInfo, new NewFileResult(filename, this.selectedPlugin.pluginKind));
    }

    public cancel() {
        // this.windowService.closeModal(this._modalInfo);
    }
}

class PluginList {
    constructor(public readonly title: string, public readonly plugins: PluginInfo[]) {
        this.plugins.forEach((p) => {
            p.toString = () => {
                return p.pluginKind[p.pluginKind.length - 1];
            };
        });
    }
}
