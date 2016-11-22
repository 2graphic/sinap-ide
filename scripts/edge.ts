// File: edge.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016


import { NodeView } from "./node"


export class Edge implements EdgeView{
  showLeftArrow : boolean;
  showRightArrow : boolean;
  color : any;
  lineStyle : string;
  lineWeight : number;
  constructor(public source : NodeView, public destination : NodeView){

  }
}

export interface EdgeView {
  source : NodeView;
  destination : NodeView;
  showLeftArrow : boolean;
  showRightArrow : boolean;
  color : any;
  lineStyle : string;
  lineWeight : number;
  // todo more display properties
}