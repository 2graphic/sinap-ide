// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { DrawableEdge, DrawableGraph, DrawableNode } from "./graph-editor.component";
import { PropertiedEntity, Property } from "./properties-panel.component";

let proto_map_func = Array.prototype.map;
function map<T, U>(i : Iterable<T>, f : ((x : T) => U)) : Array<U>{
  return proto_map_func.call(i, f);
}

/**
 * Element is a master class that behind-the-scenes, all components of a graph inherit from. 
 * That this class exists should be known only to the main components. All other components
 * will see some subset of the behavior of this class and its subclasses. The things these
 * other classes want will be specified in interfaces this (or it's subclasses implement). 
 */
export class Element implements PropertiedEntity {
  isEdge(){
    return false;
  }
  isNode(){
    return false;
  }
  isGraph(){
    return false;
  }

  // a mapping names for all the properties that this entity has
  // this will include general properties and properties from the 
  // meta language
  _properties : Map<string, Property>

  constructor(properties : Iterable<Property>){
    this._properties = new Map(map(properties, p => 
      [p.name, p] as [string, Property])); // needs cast to tuple type or we'll get a type error
  }
  
  get names(){
    return map(this._properties.values(), (x => x.name));
  }
  get properties(){
    return this._properties.values();
  }
  property(name : string) {
    return this._properties.get(name);
  }

  toJSON(){
    return {"properties": [...this.properties].map(x => x.toJSON())}
  }
}

/**
 * add all the keys of b to a
 */
function extend(a, b){
  for(let k in b){
    if (b.hasOwnProperty(k)){
      a[k] = b[k]
    }
  }
  return a;
}

export class Graph extends Element implements DrawableGraph {
  isGraph(){
    return true;
  }

  private _nodes : Array<Node> = [];
  private _edges : Array<Edge> = [];

  toJSON(){
    return extend(super.toJSON(), 
                  {"nodes" : this._nodes.map(x => x.toJSON()),
                   "edges" : this._edges.map(x => x.toJSON())});
  }

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
  	const node = new Node([new Property("node_prop", null, null, null)], x, y);
  	this._nodes.push(node);
  	return node;
  }
  createEdge(src : DrawableNode, dest : DrawableNode, like? : DrawableEdge) {
  	const edge = new Edge([new Property("edge_prop", null, null, null)], src, dest);
  	this._edges.push(edge);
  	return edge;
  }
  replaceEdge(original : DrawableEdge, replacement : DrawableEdge) {
    // TODO: in general for several of these methods I do type assertions 
    // to tell the compiler that DrawableEdges and DrawableNodes actually
    // are real Edges and Nodes. Apparently these aren't actually checked
    // at runtime and are meerly making the type system happy. Do we want
    // to do real runtime checks? In this application, nothing else will 
    // ever implement these interfaces, so it seems like a waste (tiny 
    // performance hit, so it probably doesn't matter)
  	this._edges[this._edges.indexOf(original as Edge)] = replacement as Edge;
  }
  removeNode(node : DrawableNode) {
    this._nodes.splice(this._nodes.indexOf(node as Node), 1);
  }
  removeEdge(edge : DrawableEdge) {
    this._edges.splice(this._edges.indexOf(edge as Edge), 1);
  }
  canCreateEdge(src : DrawableNode, dest : DrawableNode, like? : DrawableEdge) {
    return Math.random() > 0.1;
  }
}


class Edge extends Element implements DrawableEdge{
  isEdge(){
    return true;
  }

  showSourceArrow : boolean = false;
  showDestinationArrow : boolean = true;
  name = "an_edge";
  color : string = "#000";
  lineStyle : string = "solid";
  lineWidth : number = 1;
  constructor(properties : Iterable<Property>, public source : DrawableNode, public destination : DrawableNode) { 
    super(properties);
  }

  toJSON(){
    // TODO: MIGHT NEED TO FILTER OUT SOME THINGS
    return extend(super.toJSON(), 
                  this);
  }

}

class Node extends Element implements DrawableNode{
  isNode(){
    return true;
  }

  label : string = "";
  color : string = "#fff200";
  borderColor: string = "#000";
  borderStyle: string = "solid";
  borderWidth = 1;
  constructor(properties : Iterable<Property>, public x : number, public y : number) {
    super(properties);
  }

  toJSON(){
    // TODO: MIGHT NEED TO FILTER OUT SOME THINGS
    return extend(super.toJSON(), 
                  this);
  }

}
