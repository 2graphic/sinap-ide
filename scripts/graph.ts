// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { DrawableEdge, DrawableGraph, DrawableNode } from "./graph-editor.component";
import { PropertiedEntity, Property, EntityKind, SinapType } from "./properties-panel.component";

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
  generalProperties : Array<[string, SinapType]> = [];

  constructor(properties : Iterable<Property>){
    this._properties = new Map(map(properties, p => 
      [p.name, p] as [string, Property])); // needs cast to tuple type or we'll get a type error
  }
  
  get names(){
    return map(this._properties.values(), (x => x.name));
  }
  get properties() : Iterable<Property>{
    let props = [...this._properties.values()];
    let general_props = this.generalProperties.map(x => 
                           new Property(x[0], EntityKind.General,
                                        x[1], this[x[0]]))
    return props.concat(general_props);
  }
  property(name : string) {
    let res = this._properties.get(name) 
    if (res != undefined){
      return res;
    }
    return this[name];
  }

  toJSON(){
    let generals = new Array();
    let plugind = new Array();
    for (let p of this.properties){
      let v = [p.name, p.type.type, p.value]
      if (p.kind == EntityKind.General){
        generals.push(v);
      } else {
        plugind.push(v);
      }
    }
    return {"general-properties": generals,
            "plugin-properties" : plugind}
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
    let nodes = [...this._nodes]
    let edges = [...this._edges]

    let json = extend(super.toJSON(), 
                      {"nodes" : nodes.map(x => x.toJSON()),
                       "edges" : edges.map(x => x.toJSON())});

    function traverse(root){
      for (let k in root){
        let v = root[k];
        if (v instanceof Node){
          root[k] = {"kind" : "node-reference", "target" : nodes.indexOf(v)};
        } else if (v instanceof Edge){
          root[k] = {"kind" : "edge-reference", "target" : edges.indexOf(v)};
        } else if (v instanceof Object) {
          traverse(v);
        }
      }
    }

    traverse(json);

    return json;
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
  	const node = new Node([new Property("node_prop",
                                        EntityKind.PluginGenerated,
                                        new SinapType("string"),
                                        "")],
                          x, y);
  	this._nodes.push(node);
  	return node;
  }
  createEdge(src : DrawableNode, dest : DrawableNode, like? : DrawableEdge) {
  	const edge = new Edge([new Property("edge_prop",
                                        EntityKind.PluginGenerated,
                                        new SinapType("string"),
                                        "")],
                          src, dest);
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
  label = "an_edge";
  color : string = "#000";
  lineStyle : string = "solid";
  lineWidth : number = 1;
  constructor(properties : Iterable<Property>, public source : DrawableNode, public destination : DrawableNode) { 
    super(properties);
  }

  generalProperties = [["showSourceArrow", new SinapType("boolean")] as [string, SinapType],
                       ["showDestinationArrow", new SinapType("boolean")] as [string, SinapType],
                       ["label", new SinapType("string")] as [string, SinapType],
                       ["color", new SinapType("string")] as [string, SinapType],
                       ["lineStyle", new SinapType("string")] as [string, SinapType],
                       ["lineWidth", new SinapType("number")] as [string, SinapType],
                       ["source", new SinapType("node")] as [string, SinapType],
                       ["destination", new SinapType("node")] as [string, SinapType]]
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

  generalProperties = [["label", new SinapType("string")] as [string, SinapType],
                       ["color", new SinapType("string")] as [string, SinapType],
                       ["borderColor", new SinapType("string")] as [string, SinapType],
                       ["borderStyle", new SinapType("string")] as [string, SinapType],
                       ["borderWidth", new SinapType("number")] as [string, SinapType],
                       ["x", new SinapType("number")] as [string, SinapType],
                       ["y", new SinapType("number")] as [string, SinapType]]

}
