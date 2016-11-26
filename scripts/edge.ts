// File: edge.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016


import { NodeView } from "./node"


export class Edge implements EdgeView{
  showLeftArrow : boolean = false;
  showRightArrow : boolean = false;
  color : string = "#000";
  lineStyle : string = "solid";
  lineWidth : number = 1;
  constructor(public source : NodeView, public destination : NodeView) { }
}

export function isEdgeView(obj : any) : obj is EdgeView {
  //
  // TODO:
  // Return false if obj does not have any one of the members in EdgeView.
  //
  return obj !== null && obj.source !== undefined && obj.destination !== undefined;
}

export interface EdgeView {
  source : NodeView;
  destination : NodeView;
  showLeftArrow : boolean;
  showRightArrow : boolean;
  color : string;
  lineStyle : string;
  lineWidth : number;
  // todo more display properties
}