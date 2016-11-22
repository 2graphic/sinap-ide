// File: node.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016


export class Node implements NodeView{
  color : any;
  label : string;
  constructor(public x : number, public y : number) {
  }
}

export interface NodeView {
  x : number;
  y : number;
  color : any;
  label : string;
}