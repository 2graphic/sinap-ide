// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016


import { EdgeView, Edge } from "./edge";
import { NodeView, Node } from "./node";


export class Graph implements GraphView {
  nodes : Array<NodeView> = [];
  edges : Array<EdgeView> = [];
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

export interface GraphView {
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