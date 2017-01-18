// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { DrawableEdge, DrawableGraph, DrawableNode, Drawable } from "../components/graph-editor/graph-editor.component";
import * as Core from "./core";

export class ConcreteGraph implements DrawableGraph {
    activeNodeType: string;
    activeEdgeType: string;
    selection = new Set<Drawable>();

    constructor(public graph: Core.Graph) {

    }

    get nodes() {
        return this.graph.nodes;
    }
    get edges() {
        return this.graph.edges;
    }
    get backgroundColor() {
        return this.graph.backgroundColor;
    }
    createNode() {
        return this.graph.createNode(this.activeNodeType);
    }
    createEdge(src: ConcreteNode, dest: ConcreteNode, like?: ConcreteEdge) {
        return this.graph.createEdge(this.activeEdgeType, src, dest, like);
    }
    canCreateEdge(src: ConcreteNode, dest: ConcreteNode, like?: ConcreteEdge) {
        return this.graph.canCreateEdge(this.activeEdgeType, src, dest, like);
    }
    removeNode(n: ConcreteNode) {
        this.graph.removeNode(n);
    }
    removeEdge(e: ConcreteEdge) {
        this.graph.removeEdge(e);
    }
}

export class ConcreteNode extends Core.Node implements DrawableNode {

}

export class ConcreteEdge extends Core.Edge implements DrawableEdge {

}
