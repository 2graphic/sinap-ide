// File: graph.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016
//
//

import { DrawableEdge, DrawableGraph, DrawableNode } from "./graph-editor.component";
import { PropertiedEntity, SinapType } from "./properties-panel.component";

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
  	const node = new Node([["accept_state", new SinapType("boolean")],
                           ["start_state", new SinapType("boolean")]],
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
    showSourceArrow : false,
    showDestinationArrow : true,
    label : "0",
    color : "#000",
    lineStyle : "solid",
    lineWidth : 1
  }

  get showSourceArrow(){
    return this.propertyValues.showSourceArrow;
  }
  set showSourceArrow(nv){
    this.propertyValues.showSourceArrow = nv;
  }
  get showDestinationArrow(){
    return this.propertyValues.showDestinationArrow;
  }
  set showDestinationArrow(nv){
    this.propertyValues.showDestinationArrow = nv;
  }
  get label(){
    return this.propertyValues.label;
  }
  set label(nv){
    this.propertyValues.label = nv;
  }
  get color(){
    return this.propertyValues.color;
  }
  set color(nv){
    this.propertyValues.color = nv;
  }
  get lineStyle(){
    return this.propertyValues.lineStyle;
  }
  set lineStyle(nv){
    this.propertyValues.lineStyle = nv;
  }
  get lineWidth(){
    return this.propertyValues.lineWidth;
  }
  set lineWidth(nv){
    this.propertyValues.lineWidth = nv;
  }


  constructor(properties : Array<[string, SinapType]>, public source : Node, public destination : Node) { 
    super(properties);
  }

  displayProperties = [["showSourceArrow", new SinapType("boolean")] as [string, SinapType],
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

  propertyValues = {
    start_state : false,
    accept_state : false,
    label : "",
    color : "#fff200",
    borderColor : "#000",
    borderStyle : "solid",
    borderWidth : 1,
  }

  // ugly and we need to reconsider

  get label(){
    return this.propertyValues.label;
  }
  set label(nv){
    this.propertyValues.label = nv;
  }
  get color(){
    return this.propertyValues.color;
  }
  set color(nv){
    this.propertyValues.color = nv;
  }
  get borderColor(){
    return this.propertyValues.borderColor;
  }
  set borderColor(nv){
    this.propertyValues.borderColor = nv;
  }
  get borderStyle(){
    return this.propertyValues.borderStyle;
  }
  set borderStyle(nv){
    this.propertyValues.borderStyle = nv;
  }
  get borderWidth(){
    return this.propertyValues.borderWidth;
  }
  set borderWidth(nv){
    this.propertyValues.borderWidth = nv;
  }


  constructor(properties : Array<[string, SinapType]>, public x : number, public y : number) {
    super(properties);
  }

  displayProperties = [["start_state", new SinapType("boolean")] as [string, SinapType],
                       ["accept_state", new SinapType("boolean")] as [string, SinapType],
                       ["label", new SinapType("string")] as [string, SinapType],
                       ["color", new SinapType("string")] as [string, SinapType],
                       ["borderColor", new SinapType("string")] as [string, SinapType],
                       ["borderStyle", new SinapType("string")] as [string, SinapType],
                       ["borderWidth", new SinapType("number")] as [string, SinapType],
                       ["x", new SinapType("number")] as [string, SinapType],
                       ["y", new SinapType("number")] as [string, SinapType],]

}
