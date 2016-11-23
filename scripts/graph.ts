// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//
// Notes:
//
// There needs to be some notion of canReplaceEdge from the graph.
//   Consider the case where the user wants to move an edge
//   destination to some other node, but the selectedEdgeType is not
//   the same as the replacement edge type. GraphView can either
//   redefine the replaceEdge method to take in the original edge
//   plus a source and destination NodeView which either succeeds or
//   fails without warning or error, or we can stick to the pattern
//   of checking if the operation is valid before performing it
//   (i.e. canCreateEdge -> createEdge + canReplaceEdge ->
//   replaceEdge).
//
// 


import { EdgeView, Edge } from "./edge";
import { NodeView, Node } from "./node";


export class Graph implements GraphView {
  private nodes : Array<NodeView> = [];
  private edges : Array<EdgeView> = [];
  getNodeViews() {
    //
    // TODO:
    // Send a copy of this.
    //
    return this.nodes;
  }
  getEdgeViews() {
    //
    // TODO:
    // Send a copy of this.
    //
    return this.edges;
  }
  createNode(x=0, y=0) {
  	const node = new Node(x, y);
  	this.nodes.push(node);
  	return node;
  }
  createEdge(src : NodeView, dest : NodeView) {
  	const edge = new Edge(src, dest);
  	this.edges.push(edge);
  	return edge;
  }
  replaceEdge(original : EdgeView, replacement : EdgeView) {
  	this.edges[this.edges.indexOf(original)] = replacement;
  }
  removeNode(node : NodeView) {
    this.nodes.splice(this.nodes.indexOf(node), 1);
  }
  removeEdge(edge : EdgeView) {
    this.edges.splice(this.edges.indexOf(edge), 1);
  }
  canCreateEdge(src : NodeView, dest : NodeView) {
  	return Math.random() > 0.1;
  } 

}

export function isGraphView(obj : any) : obj is GraphView {
  //
  // TODO:
  // Return false if obj does not have any one of the members in GraphView.
  //
  return obj !== null;
}

export interface GraphView {
  getNodeViews() : Iterable<NodeView>
  getEdgeViews() : Iterable<EdgeView>
  createNode(x? : number, y? : number) : NodeView
  /* contractually `src` -> `dest` will have been validated by 
  `canCreateEdge`, Graph implementations are not required to test this */
  createEdge(src : NodeView, dest : NodeView) : EdgeView
  /* contractually `original` will be in the list,
  this is not necessarily checked by implementations */
  replaceEdge(original : EdgeView, replacement : EdgeView) : void
  /* contractually `node` will be in the list,
  this is not necessarily checked by implementations */
  removeNode(node : NodeView) : void
  /* contractually `edge` will be in the list,
  this is not necessarily checked by implementations */
  removeEdge(edge : EdgeView) : void
  canCreateEdge(src : NodeView, dest : NodeView) : boolean 
}