// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { DrawableEdge, DrawableGraph, DrawableNode, Drawable } from "../components/graph-editor/graph-editor.component";
import * as Core from "./core";

export class ConcreteDrawableGraph implements DrawableGraph {
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
    createEdge(src: ConcreteDrawableNode, dest: ConcreteDrawableNode, like?: ConcreteDrawableEdge) {
        return this.graph.createEdge(this.activeEdgeType, src, dest, like);
    }
    canCreateEdge(src: ConcreteDrawableNode, dest: ConcreteDrawableNode, like?: ConcreteDrawableEdge) {
        return this.graph.canCreateEdge(this.activeEdgeType, src, dest, like);
    }
    removeNode(n: ConcreteDrawableNode) {
        this.graph.removeNode(n);
    }
    removeEdge(e: ConcreteDrawableEdge) {
        this.graph.removeEdge(e);
    }
}

export class ConcreteDrawableNode extends Core.Node implements DrawableNode {

}

export class ConcreteDrawableEdge extends Core.Edge implements DrawableEdge {

}
