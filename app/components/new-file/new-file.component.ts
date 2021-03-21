// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component, Input, ViewChild, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from "@angular/core";
import { CollapsibleListComponent } from "./../../components/collapsible-list/collapsible-list.component";
import { PluginInfo } from "sinap-core";
import { ResizeEvent } from 'angular-resizable-element';
import { PluginService } from "../../services/plugin.service";
import { ComponentInfo } from '../dynamic-component/dynamic-component.component';

export class NewFileResult {
    constructor(readonly name: string, readonly kind: string[]) {
    }
}

export class NewFileComponentInfo extends ComponentInfo<NewFileComponent> {
    // TODO: use RXJS once updated
    onResult?: (result?: NewFileResult) => void;
    filename: string = "";
    selectedPlugin?: PluginInfo;
}

@Component({
    selector: "sinap-new-file",
    templateUrl: "./new-file.component.html",
    styleUrls: ["./new-file.component.scss"],
})
export class NewFileComponent implements AfterViewInit {
    @Input() context: NewFileComponentInfo;


    set plugins(plugins: PluginInfo[]) {

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
    @ViewChild(CollapsibleListComponent) firstList: CollapsibleListComponent;
    @ViewChild('filenameInput') filenameInput: ElementRef;
    @ViewChildren(CollapsibleListComponent) lists: QueryList<CollapsibleListComponent>;

    private intialized = this.pluginService.pluginData.then(d => {
        this.plugins = d;
        this.changeDetectorRef.detectChanges();
    });

    constructor(private pluginService: PluginService, private changeDetectorRef: ChangeDetectorRef) {
    };

    async ngAfterViewInit() {
        await this.intialized;

        if (this.firstList) {
            this.firstList.selectedIndex = Math.max(this.firstList.items.indexOf(this.context.selectedPlugin), 0);
            this.context.selectedPlugin = this.firstList.items[this.firstList.selectedIndex];
            this.changeDetectorRef.detectChanges();

            if (this.filenameInput) {
                this.filenameInput.nativeElement.focus();
            }
        }
    }

    newSelection(list: CollapsibleListComponent) {
        this.lists.forEach((l) => {
            if (l !== list) {
                l.selectedIndex = -1;
            }
        });
        this.context.selectedPlugin = list.items[list.selectedIndex];
        this.changeDetectorRef.detectChanges();
    }

    public createNewFile(filename: string) {
        if (this.context && this.context.onResult && this.context.selectedPlugin) {
            this.context.onResult(new NewFileResult(filename, this.context.selectedPlugin.pluginKind));
        }
    }

    public cancel() {
        if (this.context && this.context.onResult) {
            this.context.onResult();
        }
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
