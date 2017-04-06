/**
 * @file `tools-panel.component.ts`
 *   Created on November 26, 2016
 *
 * @author Daniel James
 *   <daniel.s.james@icloud.com>
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html}
 */


import { Component, ViewChild, AfterViewInit, EventEmitter } from "@angular/core";
import { GraphController } from "../../models/graph-controller";
import { CollapsibleListComponent } from "./../collapsible-list/collapsible-list.component";
import { ElementType } from "sinap-core";
import { PanelComponent } from "../dynamic-panel/dynamic-panel";


export interface PluginManagement {
    activeNodeType: string;
    nodeTypes: Array<string>;
}


export class ToolsPanelData {
    private _graph: GraphController | undefined
    = undefined;

    get graph() {
        return this._graph;
    }

    set graph(value: GraphController | undefined) {
        this._graph = value;
        this.graphChanged.emit(value);
    }

    get shouldDisplay() {
        return this._graph && (this._graph.plugin.types.nodes.types.size > 1 || this._graph.plugin.types.edges.types.size > 1);
    }

    readonly graphChanged
    = new EventEmitter<GraphController | undefined>();
}


@Component({
    selector: "sinap-tools-panel",
    templateUrl: "./tools-panel.component.html",
    styleUrls: ["./tools-panel.component.scss"]
})
export class ToolsPanelComponent implements AfterViewInit, PanelComponent<ToolsPanelData> {
    private _data?: ToolsPanelData;
    private nodes: TypeInfo[] = [];
    private edges: TypeInfo[] = [];

    @ViewChild('nodesList') private nodesList: CollapsibleListComponent;
    @ViewChild('edgesList') private edgesList: CollapsibleListComponent;

    ngAfterViewInit() {
        this.nodesList.selectedIndexChanged.asObservable().subscribe(() => {
            if (this._data && this._data.graph) {
                this._data.graph.activeNodeType
                    = this.nodes[this.nodesList.selectedIndex].type;
            }
        });

        this.edgesList.selectedIndexChanged.asObservable().subscribe(() => {
            if (this._data && this._data.graph) {
                this._data.graph.activeEdgeType
                    = this.edges[this.edgesList.selectedIndex].type;
            }
        });
    }

    set data(value: ToolsPanelData) {
        this._data = value;
        if (value)
            value.graphChanged.asObservable().subscribe(this.updateContent);
        this.updateContent();
    }

    private updateContent = () => {
        this.nodes = [];
        this.edges = [];
        this.nodesList.selectedIndex = -1;
        this.edgesList.selectedIndex = -1;

        if (this._data && this._data.graph) {
            const graph = this._data.graph;

            this.nodes = [...graph.plugin.types.nodes.types].map((e, i) => {
                if (e === graph.activeNodeType) {
                    this.nodesList.selectedIndex = i;
                }
                return new TypeInfo(e);
            });
            this.edges = [...graph.plugin.types.edges.types].map((e, i) => {
                if (e === graph.activeEdgeType) {
                    this.edgesList.selectedIndex = i;
                }
                return new TypeInfo(e);
            });
        };
    }

}

class TypeInfo {
    constructor(public readonly type: ElementType) { };

    toString() {
        return this.type.pluginType.name;
    }
}