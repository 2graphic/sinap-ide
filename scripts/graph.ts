// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { EventEmitter } from "@angular/core"
import { DrawableEdge, DrawableGraph, DrawableNode } from "./graph-editor.component";
import { PropertiedEntity } from "./properties-panel.component";
import { SinapType, SinapString, SinapBoolean, SinapNumber, SinapEdge, SinapNode, SinapLineStyles, SinapColor, SinapShape, SinapStructType } from "./types";
import { PluginManager } from "./plugin.service";

let proto_map_func = Array.prototype.map;
function map<T, U>(i : Iterable<T>, f : ((x : T) => U)) : Array<U>{
  return proto_map_func.call(i, f);
}

function proxify(obj, that){
  return new Proxy(obj, {
      get : that.getProperty.bind(that),
      set : that.setProperty.bind(that)
    });
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

  constructor(public entityName : string, public pluginProperties : Array<[string, SinapType]>, public computedProperties : Array<[string, SinapType, (PropertiedEntity)=>void]>, public handler : (() => void), private _propertyValues){
    for (let prop of pluginProperties){
      this._propertyValues[prop[0]] = prop[1].prototypicalStructure();
    }
    this.propertyValues = proxify(this._propertyValues, this);
  }

  private getProperty(target, k : PropertyKey){
    // TODO, this condition is insufficient, arrays too
    if ((! (target[k] instanceof Node)) && target[k] != null && typeof target[k] == 'object'){
      // TODO inefficient, creates tons of Proxy objects
      return proxify(target[k], this);
    }
    return target[k];
  }

  private setProperty(target, k : PropertyKey, v){
    target[k] = v;
    for (let tri of this.computedProperties){
      target[tri[0]] = tri[2](this);
    }
    this.handler();
    return true;
  }

  displayProperties : Array<[string, SinapType]> = [];
  propertyValues = null;

  serialize(){
    return this._propertyValues;
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

export function deserializeGraph(pojo: any, handler: () => void, pluginManager : PluginManager): Graph {
  let result = new Graph([], handler, pluginManager);
  let graph = pojo.graph;
  let nodes: [any] = graph.nodes;
  let createdNodes: [Node] = <[Node]>[];

  for(let node of nodes) {
    const posName = "Position";
    let pos = node[posName];
    let newNode = result.createNode(pos.x, pos.y);
    createdNodes.push(newNode);
    for(let prop of Object.keys(node)) {
      if (prop !== posName) {
        newNode.propertyValues[prop] = node[prop];
      }
    }
  }

  let edges: [any] = graph.edges;
  const destName = "Destination";
  const srcName = "Source";
  function getNode(edge: any, name: string): Node {
    let ind: number = edge[name].location;
    return createdNodes[ind];
  }
  for(let edge of edges) {
    let srcNode = getNode(edge, srcName);
    let destNode = getNode(edge, destName);
    let newEdge = result.createEdge(srcNode, destNode);
    for(let prop of Object.keys(edge)) {
      if (prop !== srcName && prop !== destName) {
        newEdge.propertyValues[prop] = edge[prop];
      }
    }
  }
  
  return result;
}

export class Graph extends Element implements DrawableGraph {
  isGraph(){
    return true;
  }

  constructor(pluginProperties, handler, public pluginManager : PluginManager){
    super("Graph", pluginProperties, [], handler, {
      'Background' : "#ffffff",
    });
  }

  private _nodes : Array<Node> = [];
  private _edges : Array<Edge> = [];
  private _nodeID : number = 0;

  get edges() : Iterable<Edge> {
    //
    // TODO:
    // Send a copy of this.
    //
    return this._edges;
  }
  get nodes() : Iterable<Node> {
    //
    // TODO:
    // Send a copy of this.
    //
    return this._nodes;
  }
  createNode(x=0, y=0) {
  	const node = new Node(this.pluginManager.getEntityName("Node"), this.pluginManager.getNodeProperties(), this.pluginManager.getNodeComputedProperties(), this.handler,
                          x, y);
  	this._nodes.push(node);
    node.label = "q" + this._nodeID;
    this._nodeID++;
  	return node;
  }
  createEdge(src : Node, dest : Node, like? : Edge) {
  	const edge = new Edge(this.pluginManager.getEntityName("Edge"), this.pluginManager.getEdgeProperties(), this.pluginManager.getEdgeComputedProperties(), this.handler,
                          src, dest);
  	this._edges.push(edge);
  	return edge;
  }
  replaceEdge(original : Edge, replacement : Edge) {
    // TODO: in general for several of these methods I do type assertions 
    // to tell the compiler that DrawableEdges and DrawableNodes actually
    // are real Edges and Nodes. Apparently these aren't actually checked
    // at runtime and are meerly making the type system happy. Do we want
    // to do real runtime checks? In this application, nothing else will 
    // ever implement these interfaces, so it seems like a waste (tiny 
    // performance hit, so it probably doesn't matter)
  	this._edges[this._edges.indexOf(original as Edge)] = replacement as Edge;
  }
  removeNode(node : Node) {
    this._nodes.splice(this._nodes.indexOf(node as Node), 1);
  }
  removeEdge(edge : Edge) {
    this._edges.splice(this._edges.indexOf(edge as Edge), 1);
  }
  canCreateEdge(src : Node, dest : Node, like? : Edge) {
    // return Math.random() > 0.1;
    return true;
  }

  displayProperties = [["Background", SinapColor] as [string, SinapType],];

  get backgroundColor(){
    return this.propertyValues['Background'];
  }
  set backgroundColor(nv){
    this.propertyValues['Background'] = nv;
  }

  serialize(){
    let nodes = this._nodes;
    let edges = this._edges;

    function replaceNodesEdges(obj){
      let n = {};
      for (let k in obj){
        let v = obj[k];
        if (v instanceof Edge){
          n[k] = {'proxyto':'Edge', 'location': edges.indexOf(v)};
        } else if (v instanceof Node){
          n[k] = {'proxyto':'Node', 'location': nodes.indexOf(v)};
        } else {
          n[k] = v;
        }
      }
      return n;
    }

    function cleanup(l : Array<Node|Edge>){
      let results = [];
      for (let val of l){
        results.push(replaceNodesEdges(val.serialize()));
      }
      return results;
    }
    return {'nodes': cleanup(this._nodes), 'edges': cleanup(this._edges)};
  }
}


class Edge extends Element implements DrawableEdge{
  isEdge(){
    return true;
  }

  get showSourceArrow(){
    return this.propertyValues['Source Arrow'];
  }
  set showSourceArrow(nv){
    this.propertyValues['Source Arrow'] = nv;
  }
  get showDestinationArrow(){
    return this.propertyValues['Destination Arrow'];
  }
  set showDestinationArrow(nv){
    this.propertyValues['Destination Arrow'] = nv;
  }
  get label(){
    return this.propertyValues['Label'];
  }
  set label(nv){
    this.propertyValues['Label'] = nv;
  }
  get color(){
    return this.propertyValues['Color'];
  }
  set color(nv){
    this.propertyValues['Color'] = nv;
  }
  get lineStyle(){
    return this.propertyValues['Line Style'];
  }
  set lineStyle(nv){
    this.propertyValues['Line Style'] = nv;
  }
  get lineWidth(){
    return this.propertyValues['Line Width'];
  }
  set lineWidth(nv){
    this.propertyValues['Line Width'] = nv;
  }
  get source(){
    return this.propertyValues['Source'];
  }
  set source(nv){
    this.propertyValues['Source'] = nv;
  }
  get destination(){
    return this.propertyValues['Destination'];
  }
  set destination(nv){
    this.propertyValues['Destination'] = nv;
  }


  constructor(entityName : string, properties : Array<[string, SinapType]>, computedProperties : Array<[string, SinapType, (PropertiedEntity)=>void]>, handler, source : Node, destination : Node) { 
    super(entityName, properties, computedProperties, handler, {
      'Source Arrow' : false,
      'Destination Arrow' : true,
      'Label' : "0",
      'Color' : "#000",
      'Line Style' : "solid",
      'Line Width' : 1,
      'Source' : null,
      'Destination' : null,
    });
    this.source = source;
    this.destination = destination;
  }

  displayProperties = [["Source Arrow", SinapBoolean] as [string, SinapType],
                       ["Destination Arrow", SinapBoolean] as [string, SinapType],
                       ["Label", SinapString] as [string, SinapType],
                       ["Color", SinapColor] as [string, SinapType],
                       ["Line Style", SinapLineStyles] as [string, SinapType],
                       ["Line Width", SinapNumber] as [string, SinapType],
                       ["Source", SinapNode] as [string, SinapType],
                       ["Destination", SinapNode] as [string, SinapType]]
}

class Node extends Element implements DrawableNode{
  isNode(){
    return true;
  }

  // ugly and we need to reconsider

  get label(){
    return this.propertyValues['Label'];
  }
  set label(nv){
    this.propertyValues['Label'] = nv;
  }
  get shape() {
    return this.propertyValues['Shape'];
  }
  set shape(nv) {
    this.propertyValues['Shape'] = nv;
  }
  get color(){
    return this.propertyValues['Color'];
  }
  set color(nv){
    this.propertyValues['Color'] = nv;
  }
  get borderColor(){
    return this.propertyValues['Border Color'];
  }
  set borderColor(nv){
    this.propertyValues['Border Color'] = nv;
  }
  get borderStyle(){
    return this.propertyValues['Border Style'];
  }
  set borderStyle(nv){
    this.propertyValues['Border Style'] = nv;
  }
  get borderWidth(){
    return this.propertyValues['Border Width'];
  }
  set borderWidth(nv){
    this.propertyValues['Border Width'] = nv;
  }
  get x(){
    return this.propertyValues['Position'].x;
  }
  set x(nv){
    this.propertyValues['Position'].x = Number(nv.toFixed(1));
  }
  get y(){
    return this.propertyValues['Position'].y;
  }
  set y(nv){
    this.propertyValues['Position'].y = Number(nv.toFixed(1));
  }


  constructor(entityName : string, properties : Array<[string, SinapType]>, computedProperties : Array<[string, SinapType, (PropertiedEntity)=>void]>, handler, x : number, y : number) {
    super(entityName, properties, computedProperties, handler, {
      "Start State" : false,
      "Accept State" : false,
      "Label" : "",
      "Shape" : "circle",
      "Color" : "#fff200",
      "Border Color" : "#000",
      "Border Style" : "solid",
      "Border Width" : 1,
      "Position" : {'x':0,
                    'y':0},
    });
    this.x = x;
    this.y = y;
  }

  displayProperties = [["Label", SinapString] as [string, SinapType],
                       ["Shape", SinapShape] as [string, SinapType],
                       ["Color", SinapColor] as [string, SinapType],
                       ["Border Color", SinapColor] as [string, SinapType],
                       ["Border Style", SinapLineStyles] as [string, SinapType],
                       ["Border Width", SinapNumber] as [string, SinapType],
                       ["Position", new SinapStructType(new Map([['x', SinapNumber],
                                                                 ['y', SinapNumber]]))] as [string, SinapType],]

}
