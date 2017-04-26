
import { Component, ViewChild, ChangeDetectorRef, ViewChildren, QueryList, Inject, Input, Output, EventEmitter } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service";
import { CollapsibleListComponent } from "./../../components/collapsible-list/collapsible-list.component";
import { ModalInfo, ModalComponent } from "./../../models/modal-window";
import { PluginInfo } from "sinap-core";
import { PluginService } from "../../services/plugin.service";

@Component({
    selector: "plugins-list",
    templateUrl: "./plugins-list.component.html",
    styleUrls: ["./plugins-list.component.scss"],
    providers: [WindowService]
})
export class PluginListComponent {

    private availablePlugins: PluginList[];
    @Output() pluginSelected = new EventEmitter<PluginInfo>();
    @ViewChild(CollapsibleListComponent) firstList: CollapsibleListComponent;
    @ViewChildren(CollapsibleListComponent) lists: QueryList<CollapsibleListComponent>;

    @Input()
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
        this.changeDetectorRef.detectChanges();
    }

    constructor( @Inject(PluginService) private pluginService: PluginService, private windowService: WindowService, private changeDetectorRef: ChangeDetectorRef) {
    };

    ngAfterViewInit() {
        if (this.firstList) {
            this.firstList.selectedIndex = 0;
            this.changeDetectorRef.detectChanges();
        }
    }

    newSelection(list: CollapsibleListComponent) {
        this.lists.forEach((l) => {
            if (l !== list) {
                l.selectedIndex = -1;
            }
        });
        this.pluginSelected.emit(list.items[list.selectedIndex]);
        this.changeDetectorRef.detectChanges();
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