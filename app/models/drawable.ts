// File: drawable.ts
// Created by: Sheyne Anderson
// Date created: January 22, 2017
//
//

import { DrawableEdge, DrawableGraph, DrawableNode, Drawable } from "../components/graph-editor/graph-editor.component";
import * as Core from "./core";

export class ConcreteGraph implements DrawableGraph {
    activeNodeType: string;
    activeEdgeType: string;
    selection = new Set<Drawable>();

    constructor(public core: Core.Graph) {

    }

    get nodes() {
        return this.core.nodes;
    }
    get edges() {
        return this.core.edges;
    }
    get backgroundColor() {
        return this.core.backgroundColor;
    }
    createNode() {
        return this.core.createNode(this.activeNodeType);
    }
    createEdge(src: ConcreteNode, dest: ConcreteNode, like?: ConcreteEdge) {
        return this.core.createEdge(this.activeEdgeType, src, dest, like);
    }
    canCreateEdge(src: ConcreteNode, dest: ConcreteNode, like?: ConcreteEdge) {
        return this.core.canCreateEdge(this.activeEdgeType, src, dest, like);
    }
    removeNode(n: ConcreteNode) {
        this.core.removeNode(n);
    }
    removeEdge(e: ConcreteEdge) {
        this.core.removeEdge(e);
    }
}

export class ConcreteNode extends Core.Node implements DrawableNode {

}

export class ConcreteEdge extends Core.Edge implements DrawableEdge {

}
