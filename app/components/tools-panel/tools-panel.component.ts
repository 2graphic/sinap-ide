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

    get nodes() {
        return this._graph ?
            [...this._graph.plugin.types.edges.types] :
            [];
    }

    get edges() {
        return this._graph ?
            [...this._graph.plugin.types.edges.types] :
            [];
    }

    get shouldDisplay() {
        return this.nodes.length > 1 || this.edges.length > 1;
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

    @ViewChild('nodesList') private nodesList: CollapsibleListComponent;
    @ViewChild('edgesList') private edgesList: CollapsibleListComponent;

    ngAfterViewInit() {
        this.nodesList.selectedIndexChanged.asObservable().subscribe(() => {
            if (this._data && this._data.graph) {
                this._data.graph.activeNodeType
                    = this._data.nodes[this.nodesList.selectedIndex];
            }
        });

        this.edgesList.selectedIndexChanged.asObservable().subscribe(() => {
            if (this._data && this._data.graph) {
                this._data.graph.activeEdgeType
                    = this._data.edges[this.edgesList.selectedIndex];
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
        if (this._data && this._data.graph) {
            this.nodesList.selectedIndex
                = this._data.nodes.indexOf(this._data.graph.activeNodeType);
            this.edgesList.selectedIndex =
                this._data.edges.indexOf(this._data.graph.activeEdgeType);
        } else {
            this.nodesList.selectedIndex = -1;
            this.edgesList.selectedIndex = -1;
        }
    }

}
