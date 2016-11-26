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
// - Zoom and Pan
// - Something about deep binding for the graph components?
// - Add a selectionChanged event. [Should this be in the GraphView object?]
// - Should the delete key be handled here or higher up the hierarchy UI?
// - Add mouse hover display behavior
//   - Show edge anchor points
//   - etc.
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

//
// TODO:
// Remove Graph import for production.
//
import { GraphView, Graph } from "./graph";
import { NodeView, isNodeView } from "./node";
import { EdgeView, isEdgeView } from "./edge";


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
   *   Determines if the mousedown event is still waiting.
   */
  private isWaiting : boolean = false;

  /**
   * dragObect
   *   The graph component being dragged by the cursor.
   */
  private dragObject : NodeView | EdgeView = null;

  /**
   * replaceEdge
   *   The edge to be replaced once the new edge has been created.
   */
  private replaceEdge : EdgeView = null;

  /**
   * selectedItems
   *   The currently selected graph components.
   */
  private selectedItems : Array<NodeView | EdgeView> = [];

  /**
   * unselectedItems
   *   The currently unselected graph components.
   */
  private unselectedItems : Array<NodeView | EdgeView> = [];

  /**
   * _graph
   *   The active graph being edited.
   */
  private _graph : GraphView = null;

  /**
   * graph
   *   Sets the active graph.
   */
  set graph(value : GraphView) {
    this._graph = value;
    this.clearSelected();
    this.redraw();
  }

  /**
   * graph
   *   Gets the active graph.
   */
  get graph() : GraphView {
    return this._graph;
  }

  /**
   * dragNode
   *   Sets the node being dragged by the cursor.
   */
  set dragNode(value : NodeView) {
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

  // Get position of MouseEvent inside canvas.
  getMousePosition(evt: MouseEvent) {
    let canvas = this.graphEditorCanvas.nativeElement;
    let rect = canvas.getBoundingClientRect();
    let x = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    let y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
    
    return {x, y};
  }

  /**
   * onKeyDown
   *   Handles the delete key.
   * 
   * Note:
   *   I don't like where this is.
   */
  onKeyDown(e : KeyboardEvent) : void {
    if(e.keyCode == 46) {
      let edges : Array<EdgeView> = [];
      let nodes : Array<NodeView> = [];
      while(this.selectedItems.length > 0) {
        let i = this.selectedItems.pop();
        if(isEdgeView(i))
          edges.push(i);
        else if(isNodeView(i))
          nodes.push(i);
      }
      for(let e of edges)
        this._graph.removeEdge(e);
      for(let n of nodes)
        this._graph.removeNode(n);
    }
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

    let ePos = this.getMousePosition(e);
    let downEventPos = this.getMousePosition(this.downEvent);

    //
    // Set a timeout.
    //
    setTimeout(() => {
      //
      // Set the drag object and reset waiting to false if the waiting flag is
      // still set to true.
      //
      if(this.isWaiting) {
        this.isWaiting = false;
        this.dragObject =
          this.hitTest(downEventPos.x, downEventPos.y);
        //
        // Create a new node and set it as the drag object if no drab object was
        // set.
        //
        if(this.dragObject === null) {
          this.dragObject = this._graph.createNode(ePos.x, ePos.y);
          this.drawNode(this.dragObject);
        }
        //
        // Set the drag object to some dummy edge and the replace edge to the
        // original drag object if the drag object was an edge.
        //
        else if(isEdgeView(this.dragObject)) {
          //
          // TODO:
          // Determine which side of the edge the hit test landed on.
          //
          this.replaceEdge = this.dragObject;
          this.dragObject = new GhostEdge(this.replaceEdge.source);
          this.ctx.globalAlpha = 0.3;
          this.drawEdge(this.dragObject, this.downEvent.x, this.downEvent.y);
          this.ctx.globalAlpha = 1;
        }
        //
        // Update the node position if the drag object was set to a node.
        //
        else if(isNodeView(this.dragObject)) {
          this.dragObject.x = downEventPos.x;
          this.dragObject.y = downEventPos.y;
          this.redraw();
        }
      }
    }, 300);
  }

  /**
   * onMouseMove
   *   Handles the mousemove event.
   */
  onMouseMove(e : MouseEvent) : void {
    let ePos = this.getMousePosition(e);
    let downEventPos = (this.downEvent !== null ? this.getMousePosition(this.downEvent) : undefined);

    //
    // Make sure only the left mouse button is down.
    //
    if(e.buttons == 1) {
      //
      // Set the down event if it wasn't previously captured.
      //
      // Note:
      // The only time this should happen is if a node is being dragged from the
      // components panel, in which case, the dragNode method should be called
      // to set the drag object.
      //
      if(this.downEvent === null)
        this.downEvent = e;
      //
      // Get the change in x and y locations of the cursor.
      //
      let dx = downEventPos.x - ePos.x;
      let dy = downEventPos.y - ePos.y;
      //
      // Reset waiting if waiting is still active and the mouse has moved too
      // far.
      //
      if(this.isWaiting && (dx * dx + dy * dy > 3 * 3)) {
        this.isWaiting = false;
        //
        // Update the drag object.
        //
        this.dragObject = this.hitTest(ePos.x, ePos.y);
        //
        // Set the drag object to a dummy edge if the drag object is a node.
        //
        if(isNodeView(this.dragObject))
          this.dragObject = new GhostEdge(this.dragObject);
        //
        // Clear the selected items if the drag object is not a node.
        //
        else
          this.clearSelected();
      }
      //
      // Update the canvas if waiting is not set.
      //
      else if(!this.isWaiting) {
        this.redraw();
        //
        // Update the selection box if selecting.
        //
        if(this.dragObject === null) {
          this.drawSelectionBox(
            downEventPos.x, downEventPos.y,
            ePos.x, ePos.y
          );
          //
          // Add components that are not already in the selected items list to
          // the list.
          //
          for(let u of this.unselectedItems) {
            if(isNodeView(u)) {
              //
              // TODO:
              // If any part of the node is within the selection box,
              // this.addSelectedItem(u);
              //
            }
            else if(isEdgeView(u)) {
              //
              // TODO:
              // If any part of the edge is within the selection box,
              // this.addSelectedItem(u);
              //
            }
          }
        }
        //
        // Update edge endpoint if dragging edge.
        //
        else if(isEdgeView(this.dragObject)) {
          this.ctx.globalAlpha = 0.3;
          this.drawEdge(this.dragObject, ePos.x, ePos.y);
          this.ctx.globalAlpha = 1;
        }
        //
        // Update node position if dragging node.
        //
        else if(isNodeView(this.dragObject)) {
          this.dragObject.x = ePos.x;
          this.dragObject.y = ePos.y;
          //
          // TODO:
          // Put a drop shadow here?
          //
          this.drawNode(this.dragObject);
        }
      }
    }
  }

  /**
   * onMouseUp
   *   Handles the mouseup event.
   */
  onMouseUp(e : MouseEvent) : void {
    let ePos = this.getMousePosition(e);
    let downEventPos = (this.downEvent !== null ? this.getMousePosition(this.downEvent) : undefined);

    //
    // Set the selected graph component if waiting.
    //
    if(this.isWaiting) {
      this.clearSelected();
      let hitComponent = this.hitTest(ePos.x, ePos.y);
      if(hitComponent !== null)
        this.addSelectedItem(hitComponent);
    }
    //
    // Create the edge if one is being dragged.
    //
    else if(isEdgeView(this.dragObject)) {
      //
      // Check that the mouse was released at a node.
      //
      let hit = this.hitTest(ePos.x, ePos.y);
      if(isNodeView(hit)) {
        //
        // TODO:
        // This needs to have some notion of canReplaceEdge from the graph.
        // Note: Consider the case where the user wants to move an edge
        //       destination to some other node, but the selectedEdgeType is not
        //       the same as the replacement edge type. GraphView can either
        //       redefine the replaceEdge method to take in the original edge
        //       plus a source and destination NodeView and either succeed or
        //       fail without warning or error, or we can stick to the pattern
        //       of checking if the operation is valid before performing it
        //       (i.e. canCreateEdge -> createEdge + canReplaceEdge ->
        //       replaceEdge).
        //
        if(this.replaceEdge !== null) {
          this.clearSelected();
          this.replaceEdge.source = this.dragObject.source;
          this.replaceEdge.destination = hit;
          this.addSelectedItem(this.replaceEdge);
        }
        else if(this._graph.canCreateEdge(this.dragObject.source, hit)) {
          this.clearSelected();
          this.selectedItems.push(
            this._graph.createEdge(this.dragObject.source, hit)
          );
        }
      }
    }
    //
    // Drop the node if one is being dragged.
    //
    else if(isNodeView(this.dragObject)) {
      this.clearSelected();
      this.dragObject.x = ePos.x;
      this.dragObject.y = ePos.y;
      this.addSelectedItem(this.dragObject);
    }
    //
    // Reset input states.
    //
    this.downEvent = null;
    this.dragObject = null;
    this.replaceEdge = null;
    this.isWaiting = false;
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
    let pel = (el.parentNode as HTMLElement);
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
    let w = x2 - x1;
    let h = y2 - y1;
    this.ctx.strokeStyle = "#00a2e8";
    this.ctx.fillStyle = "#00a2e8";
    this.ctx.globalAlpha = 0.1;
    this.ctx.fillRect(
      (w < 0 ? x2 : x1), (h < 0 ? y2 : y1),
      (w < 0 ? -1 * w : w), (h < 0 ? -1 * h : h)
    );
    this.ctx.globalAlpha = 1.0;
    this.ctx.strokeRect(
      (w < 0 ? x2 : x1), (h < 0 ? y2 : y1),
      (w < 0 ? -1 * w : w), (h < 0 ? -1 * h : h)
    );
  }

  /**
   * drawNode
   *   Draws a node on the canvas.
   * 
   * TODO:
   *   This needs to be able to handle custom node shapes/images.
   *   Draw the text label.
   */
  drawNode(n : NodeView) : void {
    this.ctx.fillStyle = n.color;
    this.ctx.strokeStyle = n.borderColor;
    this.ctx.lineWidth = n.borderWidth;
    this.setLineStyle(n.borderStyle, n.borderWidth);
    this.ctx.beginPath();
    this.ctx.arc(n.x, n.y, 20, 0, 2 * Math.PI);
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
  drawEdge(e : EdgeView, x? : number, y? : number) : void {
    this.ctx.strokeStyle = e.color;
    this.ctx.lineWidth = e.lineWidth;
    this.setLineStyle(e.lineStyle, e.lineWidth);
    if(x && y)
      this.drawLine(e.source.x, e.source.y, x, y);
    else
      this.drawLine(e.source.x, e.source.y, e.destination.x, e.destination.y);
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
    let el = this.graphEditorCanvas.nativeElement;
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
    // Don't do this.
    //
    if(this._graph === null)
      this._graph = new Graph();
    //
    // TODO:
    // Do we really want to use hardcoded values for selection display properties?
    //
    for(let e of this._graph.getEdgeViews()) {
      let c = e.color;
      let w = e.lineWidth;
      if(e === this.replaceEdge)
        this.ctx.globalAlpha = 0.3;
      else if(this.selectedItems.indexOf(e) > -1) {
        e.color = "red";
        e.lineWidth += 2;
      }
      this.drawEdge(e);
      e.color = c;
      e.lineWidth = w;
      this.ctx.globalAlpha = 1;
    }
    for(let n of this._graph.getNodeViews()) {
      let c = n.borderColor;
      let w = n.borderWidth;
      if(this.selectedItems.indexOf(n) > -1) {
        n.borderColor = "red";
        n.borderWidth += 2;
      }
      this.drawNode(n);
      n.borderColor = c;
      n.borderWidth = w;
    }
  }

  /**
   * clearSelected
   *   Clears the selected items collection.
   */
  clearSelected() : void {
    this.selectedItems = [];
    this.unselectedItems = [];
    if (this._graph) {
      for(let e of this._graph.getEdgeViews())
        this.unselectedItems.push(e);
      for(let n of this._graph.getNodeViews())
        this.unselectedItems.push(n);
    }
  }

  /**
   * addSelectedItem
   *   Adds an item to the selected items collection.
   */
  private addSelectedItem(value : NodeView | EdgeView) : void {
    this.selectedItems.push(value);
    this.unselectedItems.splice(this.unselectedItems.indexOf(value));
  }

  /**
   * hitTest
   *   Gets the first graph component that is hit by x and y.
   * 
   * <p>
   *   Nodes take priority over edges.
   * </p>
   */
  private hitTest(x : number, y : number) : NodeView | EdgeView {
    //
    // TODO:
    // Make sure to handle hit testing of custom shapes.
    // When hit testing edges, hit test only on the end points.
    //   End points will show on mouse hover.
    //
    for(let n of this._graph.getNodeViews()) {
      let dx = n.x - x;
      let dy = n.y - y;
      if(dx * dx + dy * dy <= 20 * 20)
        return n;
    }
    for(let e of this.graph.getEdgeViews()) {
      let lx = e.source.x;
      let ly = e.source.y;
      let rx = e.destination.x;
      let ry = e.destination.y;
      let x1 = (lx < rx ? lx : rx);
      let y1 = (ly < ry ? ly : ry);
      let x2 = (lx < rx ? rx : lx);
      let y2 = (ly < ry ? ry : ly);
      let m = (y2 - y1) / (x2 - x1);
      let b = y1 - m * x1;
      if(Math.abs(y - (m * x + b)) < 10)
        return e;
    }
    return null;
  }

  /**
   * setLineStyle
   *   Sets the line style of the rendering context.
   */
  private setLineStyle(value : string, dotSize : number = 1) {
    if(value == "dashed")
      this.ctx.setLineDash([3 * dotSize, 6 * dotSize]);
    else if(value == "dotted")
      this.ctx.setLineDash([dotSize]);
    else
      this.ctx.setLineDash([1, 0]);
  }

}


/**
 * GhostEdge
 *   Spoopy haunted edge that follows the cursor. *ooOOOoOOooooOOOOooOoOoOoo*
 */
class GhostEdge implements EdgeView {
  showLeftArrow : boolean = false;
  showRightArrow : boolean = false;
  color : string = "#000";
  lineStyle : string = "dotted";
  lineWidth : number = 2;
  destination : NodeView = null;
  constructor(public source : NodeView) { }
}
