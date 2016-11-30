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
//   the same as the replacement edge type. DrawableGraph can either
//   redefine the replaceEdge method to take in the original edge
//   plus a source and destination NodeView which either succeeds or
//   fails without warning or error, or we can stick to the pattern
//   of checking if the operation is valid before performing it
//   (i.e. canCreateEdge -> createEdge + canReplaceEdge ->
//   replaceEdge).
//
// 


import { DrawableEdge, DrawableGraph, DrawableNode } from "./graph-editor.component";


export class Graph implements DrawableGraph {
  private _nodes : Array<Node> = [];
  private _edges : Array<Edge> = [];
  get edges() : Iterable<DrawableEdge> {
    //
    // TODO:
    // Send a copy of this.
    //
    return this._edges;
  }
  get nodes() : Iterable<DrawableNode> {
    //
    // TODO:
    // Send a copy of this.
    //
    return this._nodes;
  }
  createNode(x=0, y=0) {
  	const node = new Node(x, y);
  	this._nodes.push(node);
  	return node;
  }
  createEdge(src : DrawableNode, dest : DrawableNode) {
  	const edge = new Edge(src, dest);
  	this._edges.push(edge);
  	return edge;
  }
  moveEdge(original : DrawableEdge, replacement : DrawableEdge) {
  	this._edges[this._edges.indexOf(original)] = replacement;
  }
  removeNode(node : DrawableNode) {
    this._nodes.splice(this._nodes.indexOf(node), 1);
  }
  removeEdge(edge : DrawableEdge) {
    this._edges.splice(this._edges.indexOf(edge), 1);
  }
  canCreateEdge(src : DrawableNode, dest : DrawableNode) {
    return Math.random() > 0.1;
  } 
  canMoveEdge(edge : DrawableEdge, src : DrawableNode, dest : DrawableNode) {
    return Math.random() > 0.1;
  } 

}


class Edge implements DrawableEdge{
  showLeftArrow : boolean = false;
  showRightArrow : boolean = false;
  color : string = "#000";
  lineStyle : string = "solid";
  lineWidth : number = 1;
  constructor(public source : DrawableNode, public destination : DrawableNode) { }
}

export class Node implements DrawableNode{
  label : string = "";
  color : string = "#fff200";
  borderColor: string = "#000";
  borderStyle: string = "solid";
  borderWidth = 1;
  constructor(public x : number, public y : number) { }
}
