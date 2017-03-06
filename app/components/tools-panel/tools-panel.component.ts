// File: tools-panel.component.ts
// Created by: Daniel James
// Date created: November 26, 2016


import { Component, ViewChild, AfterViewInit } from "@angular/core";
import { GraphController } from "../../models/graph-controller";
import { CollapsibleListComponent } from "./../collapsible-list/collapsible-list.component";
import { CoreElementKind } from "sinap-core";

export interface PluginManagement {
    activeNodeType: string;
    nodeTypes: Array<string>;
}

@Component({
    selector: "sinap-tools-panel",
    templateUrl: "./tools-panel.component.html",
    styleUrls: ["./tools-panel.component.scss"]
})

export class ToolsPanelComponent implements AfterViewInit {
    private _graph?: GraphController;

    private nodes: string[] = [];
    private edges: string[] = [];

    @ViewChild('nodesList') private nodesList: CollapsibleListComponent;
    @ViewChild('edgesList') private edgesList: CollapsibleListComponent;

    ngAfterViewInit() {
        this.nodesList.selectedIndexChanged.asObservable().subscribe(() => {
            if (this._graph) {
                this._graph.activeNodeType = this.nodes[this.nodesList.selectedIndex];
            }
        });

        this.edgesList.selectedIndexChanged.asObservable().subscribe(() => {
            if (this._graph) {
                this._graph.activeEdgeType = this.edges[this.edgesList.selectedIndex];
            }
        });
    }

    set graph(graph: GraphController | undefined) {
        this._graph = graph;
        if (graph) {
            this.nodes = [...graph.plugin.elementTypes(CoreElementKind.Node)];
            this.edges = [...graph.plugin.elementTypes(CoreElementKind.Edge)];
            this.nodesList.selectedIndex = this.nodes.indexOf(graph.activeNodeType);
            this.edgesList.selectedIndex = this.edges.indexOf(graph.activeEdgeType);
        } else {
            this.nodes = [];
            this.edges = [];
            this.nodesList.selectedIndex = -1;
            this.edgesList.selectedIndex = -1;
        }
    }

    shouldDisplay() {
        return (this.nodes.length > 1 || this.edges.length > 1);
    }
}
