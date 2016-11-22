// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
//
// Notes:
//
// It may be better to have an overall graph container type with its own list of
// nodes and list of edges.
//
// The canvas element needs to have its height and width properties updated in
// order for its rendering context to be resized properly. Using css to handle
// resizing for the canvas will stretch the image on the cavas as well as its
// "pixels" rather than having the canvas map 1:1 with the screen.
//
//
// TODO:
// - Add a selectionChanged event.
// - Should the delete key be handled here or higher up the hierarchy UI?
//
//


import {
  AfterViewInit,
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from "@angular/core";

import { Graph } from "./graph";
import { Node } from "./node";
import { Edge } from "./edge";


@Component({
  moduleId: module.id,
  selector: "sinap-graph-editor",
  templateUrl: "../html/graph-editor.component.html",
  styleUrls: [
    "../styles/graph-editor.component.css"
  ]
})
/**
 * GraphEditorComponent
 *   Angular2 component that provides a canvas for drawing nodes and edges.
 */
export class GraphEditorComponent implements AfterViewInit, AfterViewChecked {

  /**
   * graphEditorCanvas
   *   Reference to the canvas child element.
   */
  @ViewChild("sinapGraphEditorCanvas") graphEditorCanvas : ElementRef;

  /**
   * ctx
   *   The 2D rendering context from the canvas element.
   */
  private ctx : CanvasRenderingContext2D;

  /**
   * downEvent
   *   The previous mousedown event payload.
   */
  private downEvent : MouseEvent = null;

  /**
   * isWaiting
   *   Flag to determine if the moustdown event is waiting for a timeout.
   */
  private isWaiting : boolean = false;

  /**
   * isSelecting
   *   Flag to determine if the selection box is active.
   */
  private isSelecting : boolean = false;

  /**
   * dragObect
   *   The graph component being dragged by the cursor.
   */
  private dragObject : Node | Edge = null;

  /**
   * selectedItems
   *   The currently selected graph components.
   */
  private selectedItems : Array<Node | Edge> = [];

  /**
   * _graph
   *   The active graph being edited.
   */
  private _graph : Graph = null;

  /**
   * graph
   *   Sets the active graph.
   */
  set graph(value : Graph) {
    this._graph = value;
    this.redraw();
  }

  /**
   * graph
   *   Gets the active graph.
   */
  get graph() : Graph {
    return this._graph;
  }

  /**
   * dragNode
   *   Sets the node being dragged by the cursor.
   */
  set dragNode(value : Node) {
    this.dragObject = value;
  }

  /**
   * ngAfterViewInit
   *   Gets the canvas rendering context and resizes the canvas element.
   */
  ngAfterViewInit() {
    this.ctx = this.graphEditorCanvas.nativeElement.getContext("2d");
    this.resize();
  }

  /**
   * ngAfterViewChecked
   *   [Temporary] Updates the size of the canvas.
   */
  ngAfterViewChecked() {
    //
    // TODO:
    // Figure out a more efficient way to handle resizing.
    //
    // this.resize();
  }

  /**
   * onMouseDown
   *   Handles the mousedown event.
   */
  onMouseDown(e : MouseEvent) : void {
    //
    // Save the event payload and set waiting to true.
    //
    this.downEvent = e;
    this.isWaiting = true;
    //
    // Set a timeout.
    //
    setTimeout(() => {
      //
      // Set the drag object and reset waiting to false if the waiting flag is
      // still set to true.
      //
      if(this.isWaiting) {
        this.dragObject =
          this.hitTest(this.downEvent.clientX, this.downEvent.clientY);
        if(this.dragObject === null) {
          //
          // [Temporary] Create a new node and set it as the drag object.
          //
          let n = new Node(e.clientX, e.clientY);
          this.dragObject = n;
          this.drawNode(n);
        }
        else if(this.dragObject instanceof Node) {
          this.dragObject.x = this.downEvent.clientX;
          this.dragObject.y = this.downEvent.clientY;
          this.redraw();
        }
        else if(this.dragObject instanceof Edge) {
          this.drawEdge(this.dragObject, this.downEvent.x, this.downEvent.y);
        }
        this.isWaiting = false;
      }
    }, 300);
  }

  /**
   * onMouseMove
   *   Handles the mousemove event.
   */
  onMouseMove(e : MouseEvent) : void {
    //
    // Make sure only the left mouse button is down.
    //
    if(e.buttons == 1) {
      //
      // Set the down event if it wasn't previously captured.
      //
      if(this.downEvent === null)
        this.downEvent = e;
      //
      // Get the change in x and y locations of the cursor.
      //
      var dx = this.downEvent.clientX - e.clientX;
      var dy = this.downEvent.clientY - e.clientY;
      //
      // Cancel waiting if waiting is still active and the mouse has moved too
      // far.
      //
      if(this.isWaiting && (dx * dx + dy * dy > 3 * 3)) {
        this.isWaiting = false;
        //
        // Update the drag object.
        //
        this.dragObject = this.hitTest(e.clientX, e.clientY);
        //
        // Activate the selection box if no drag object was set.
        //
        if(this.dragObject === null)
          this.isSelecting = true;
        //
        // Create a new edge and update the drag object if the drag object was
        // set to a node.
        //
        else if(this.dragObject instanceof Node) {
          //
          // [Temporary] Create a new edge and set it as the drag object.
          //
          var edge = new Edge();
          edge.left = this.dragObject as Node;
          this.dragObject = edge;
        }
      }
      //
      // Update the canvas if waiting is not set.
      //
      else if(!this.isWaiting) {
        this.redraw();
        if(this.isSelecting) {
          this.drawSelectionBox(
            this.downEvent.clientX, this.downEvent.clientY,
            e.clientX, e.clientY
          );
        }
        else if(this.dragObject instanceof Node) {
          var n = this.dragObject as Node;
          n.x = e.clientX;
          n.y = e.clientY;
          this.drawNode(n);
        }
        else if(this.dragObject instanceof Edge) {
          var ed = this.dragObject as Edge;
          this.drawEdge(ed, e.clientX, e.clientY);
        }
      }
    }
  }

  /**
   * onMouseUp
   *   Handles the mouseup event.
   */
  onMouseUp(e : MouseEvent) : void {
    //
    // Set the selected graph component if waiting is set.
    //
    this.selectedItems = [];
    if(this.isWaiting) {
      var hitComponent = this.hitTest(e.clientX, e.clientY);
      if(hitComponent !== null)
        this.selectedItems.push(hitComponent);
    }
    //
    // Set the selected components if selecting is set.
    //
    else if(this.isSelecting) {
      //
      // TODO:
      // Iterate through all components.
      // Add every component that is within the selection box to the selection list. 
      //
    }
    //
    // Drop the node if one is being dragged.
    //
    else if(this.dragObject instanceof Node) {
      //
      // TODO:
      // If default creation node is not set, drop context menu for creating a node.
      // Drop node at location.
      // Set selected.
      //
      this._graph.nodes.push(this.dragObject);
    }
    //
    // Update the edge if one is being dragged.
    //
    else if(this.dragObject instanceof Edge) {
      //
      // Check that the mouse was released at a node.
      //
      var hit = this.hitTest(e.clientX, e.clientY);
      if(hit instanceof Node) {
        //
        // TODO:
        // If default creation edge is not set, drop context menu for creating an edge.
        // Set endpoint of edge.
        // Set selected.
        //
        if(this.dragObject.left)
          this.dragObject.right = hit;
        else
          this.dragObject.left = hit;
        this._graph.edges.push(this.dragObject);
      }
    }
    //
    // Reset input states.
    //
    this.downEvent = null;
    this.isWaiting = false;
    this.isSelecting = false;
    this.dragObject = null;
    //
    // Redraw the canvas.
    //
    this.redraw();
  }

  /**
   * resize
   *   Resizes the canvas.
   */
  resize() : void {
    let el = this.graphEditorCanvas.nativeElement;
    var pel = (el.parentNode as HTMLElement);
    let h = pel.offsetHeight;
    let w = pel.offsetWidth;
    // if(el.height != h || el.width != w) {
    //   setTimeout(
    //     () => {
          el.height = h;
          el.width = w;
          this.redraw();
    //     },
    //     0
    //   );
    // }
  }

  /**
   * drawSelectionBox
   *   Draws the selection box.
   */
  drawSelectionBox(x1 : number, y1 : number, x2 : number, y2 : number) : void {
    var w = x2 - x1;
    var h = y2 - y1;
    this.ctx.strokeStyle = "#00a2e8";
    this.ctx.fillStyle = "#00a2e8";
    this.ctx.globalAlpha = 0.1;
    if(w < 0 && h < 0)
      this.ctx.fillRect(x2, y2, w * -1, h * -1);
    else if(w < 0 && h >= 0)
      this.ctx.fillRect(x2, y1, w * -1, h);
    else if(w >= 0 && h < 0)
      this.ctx.fillRect(x1, y2, w, h * -1);
    else
      this.ctx.fillRect(x1, y1, w, h);
    this.ctx.globalAlpha = 1.0;
    if(w < 0 && h < 0)
      this.ctx.strokeRect(x2, y2, w * -1, h * -1);
    else if(w < 0 && h >= 0)
      this.ctx.strokeRect(x2, y1, w * -1, h);
    else if(w >= 0 && h < 0)
      this.ctx.strokeRect(x1, y2, w, h * -1);
    else
      this.ctx.strokeRect(x1, y1, w, h);
  }

  /**
   * drawNode
   *   Draws a node on the canvas.
   * 
   * TODO:
   *   This needs to be able to handle custom node shapes/images.
   */
  drawNode(n : Node) : void {
    this.ctx.fillStyle = "#fff200";
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    this.ctx.arc(n.x, n.y, 20, 0, 2 * Math.PI, false);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * drawEdge
   *   Draws an edge on the canvas.
   * 
   * TODO:
   *   This needs to be able to handle custom edge drawing.
   */
  drawEdge(e : Edge, x? : number, y? : number) : void {
    this.ctx.strokeStyle = "black";
    if(x && y) {
      if(e.left === null)
        this.drawLine(x, y, e.right.x, e.right.y);
      else
        this.drawLine(e.left.x, e.left.y, x, y);
    }
    else
      this.drawLine(e.left.x, e.left.y, e.right.x, e.right.y);
  }

  /**
   * drawLine
   *   Draws a line.
   */
  drawLine(x1 : number, y1 : number, x2 : number, y2 : number) : void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * clear
   *   Clears the canvas.
   */
  clear() : void {
    var el = this.graphEditorCanvas.nativeElement;
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, el.width, el.height);
    //
    // TODO:
    // Draw the grid.
    //
  }

  /**
   * redraw
   *   Redraws the graph.
   */
  redraw() : void {
    this.clear();
    //
    // TODO:
    // Don't actually do this.
    //
    if(this._graph === null) {
      this._graph = new Graph();
    }
    //
    // TODO:
    // Draw selected components differently.
    //
    for(let e of this._graph.edges)
      this.drawEdge(e);
    for(let n of this._graph.nodes)
      this.drawNode(n);
  }

  /**
   * hitTest
   *   Gets the first graph component that is hit by x and y.
   * 
   * <p>
   *   Nodes take priority over edges.
   * </p>
   */
  private hitTest(x : number, y : number) : Node | Edge {
    //
    // TODO:
    // Make sure to handle hit testing of custom shapes.
    //
    for(let n of this._graph.nodes) {
      var dx = n.x - x;
      var dy = n.y - y;
      if(dx * dx + dy * dy <= 20 * 20)
        return n;
    }
    for(let e of this.graph.edges) {
      var lx = e.left.x;
      var ly = e.left.y;
      var rx = e.right.x;
      var ry = e.right.y;
      var x1 = (lx < rx ? lx : rx);
      var y1 = (ly < ry ? ly : ry);
      var x2 = (lx < rx ? rx : lx);
      var y2 = (ly < ry ? ry : ly);
      var m = (y2 - y1) / (x2 - x1);
      var b = y1 - m * x1;
      if(Math.abs(y - (m * x + b)) < 5)
        return e;
    }
    return null;
  }

}
