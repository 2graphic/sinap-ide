// File: node.ts
// Created by: CJ Dimaano
// Date created: November 21, 2016


export class Node implements NodeView{
  label : string = "";
  color : string = "#fff200";
  borderColor: string = "#000";
  borderStyle: string = "solid";
  borderWidth = 1;
  constructor(public x : number, public y : number) { }
}

export function isNodeView(obj : any) : obj is NodeView {
  //
  // TODO:
  // Return false if obj does not have any one of the members in NodeView.
  //
  return obj !== null && obj.x !== undefined && obj.y !== undefined;
}

export interface NodeView {
  x : number;
  y : number;
  label : string;
  
  color : string;
  borderColor: string;
  borderStyle: string; // TODO: enforce "solid" | "dashed" | "dotted"
  borderWidth: number;
  // todo more display properties
}