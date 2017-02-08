// File: main-graph.ts
// Created by: Sheyne Anderson
// Date created: January 22, 2017
//
//

import { DrawableGraph, DrawableEdge, DrawableNode, EdgeValidator, DrawableEdgeEventArgs, DrawableNodeEventArgs } from "../components/graph-editor/graph-editor.component"
import { CoreGraph, CoreEdge, CoreNode } from "sinap-core";

export class MainGraph {
    constructor(public drawable: DrawableGraph, public core: CoreGraph){
        drawable.addCreatingNodeListener(this.onCreatingNode);
        drawable.addCreatedNodeListener(this.onCreatedNode);
        drawable.addCreatingEdgeListener(this.onCreatingEdge);
        drawable.addCreatedEdgeListener(this.onCreatedEdge);
        drawable.addPropertyChangedListener(this.onPropertyChanged);
    }

    onCreatedNode(n: DrawableNodeEventArgs){

    }
    onCreatedEdge(e: DrawableEdgeEventArgs){

    }
    onPropertyChanged(a: PropertyChangedEventArgs<any>){
        
    }

    onCreatingNode(n: DrawableNodeEventArgs){

    }
    onCreatingEdge(e: DrawableEdgeEventArgs){

    }
}