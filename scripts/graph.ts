// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { DrawableEdge, DrawableGraph, DrawableNode } from "./graph-editor.component";
import { PropertiedEntity } from "./properties-panel.component";
import { SinapType, SinapString, SinapBoolean, SinapNumber, SinapEdge, SinapNode, SinapLineStyles, SinapColor, SinapStructType } from "./types";


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

  constructor(public pluginProperties : Array<[string, SinapType]>){

  }

  displayProperties : Array<[string, SinapType]> = [];
  propertyValues = {};
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
  	const node = new Node([["Accept State", SinapBoolean],
                           ["Start State", SinapBoolean]],
                          x, y);
  	this._nodes.push(node);
    node.label = "q" + this._nodeID;
    this._nodeID++;
  	return node;
  }
  createEdge(src : Node, dest : Node, like? : Edge) {
  	const edge = new Edge([],
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
    return Math.random() > 0.1;
  }
}


class Edge extends Element implements DrawableEdge{
  isEdge(){
    return true;
  }

  propertyValues = {
    'Source Arrow' : false,
    'Destination Arrow' : true,
    'Label' : "0",
    'Color' : "#000",
    'Line Style' : "solid",
    'Line Width' : 1,
    'Source' : null,
    'Destination' : null,
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
    return this.propertyValues.Label;
  }
  set label(nv){
    this.propertyValues.Label = nv;
  }
  get color(){
    return this.propertyValues.Color;
  }
  set color(nv){
    this.propertyValues.Color = nv;
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


  constructor(properties : Array<[string, SinapType]>, source : Node, destination : Node) { 
    super(properties);
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

  propertyValues = {
    "Start State" : false,
    "Accept State" : false,
    "Label" : "",
    "Color" : "#fff200",
    "Border Color" : "#000",
    "Border Style" : "solid",
    "Border Width" : 1,
    "Position" : {'x':0,
                  'y':0},
  }

  // ugly and we need to reconsider

  get label(){
    return this.propertyValues.Label;
  }
  set label(nv){
    this.propertyValues.Label = nv;
  }
  get color(){
    return this.propertyValues.Color;
  }
  set color(nv){
    this.propertyValues.Color = nv;
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
    return this.propertyValues.Position.x;
  }
  set x(nv){
    this.propertyValues.Position.x = Number(nv.toFixed(1));
  }
  get y(){
    return this.propertyValues.Position.y;
  }
  set y(nv){
    this.propertyValues.Position.y = Number(nv.toFixed(1));
  }


  constructor(properties : Array<[string, SinapType]>, x : number, y : number) {
    super(properties);
    this.x = x;
    this.y = y;
  }

  displayProperties = [["Label", SinapString] as [string, SinapType],
                       ["Color", SinapColor] as [string, SinapType],
                       ["Border Color", SinapColor] as [string, SinapType],
                       ["Border Style", SinapLineStyles] as [string, SinapType],
                       ["Border Width", SinapNumber] as [string, SinapType],
                       ["Position", new SinapStructType(new Map([['x', SinapNumber],
                                                                 ['y', SinapNumber]]))] as [string, SinapType],]

}
