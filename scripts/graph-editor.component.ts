// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
//
// Notes:
//
// For deleting graph components, it would be better to have a global keybinding
// with the keybind activation event calling some method to delete the selected
// components. It may be better to have such functionality outside of this
// graph-editor-component.
//
// The canvas element needs to have its height and width properties updated in
// order for its rendering context to be resized properly. Using css to handle
// resizing for the canvas will stretch the image on the cavas as well as its
// "pixels" rather than having the canvas map 1:1 with the screen.
//
//
// TODO:
// - Zoom and Pan
// - Draw edge arrows
// - Make it so that if any part of a component is caught within the selection
//   box, it is selected
// - Something about deep binding for the graph components? [For now, use redraw]
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
   * downEvt
   *   The previous mousedown event payload.
   */
  private downEvt : MouseEvent = null;

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
      for(let n of nodes) {
        for(let u of this.unselectedItems)
          if(isEdgeView(u) && (u.source === n || u.destination === n))
            edges.push(u);
        this._graph.removeNode(n);
      }
      for(let e of edges)
        this._graph.removeEdge(e);
      this.clearSelected();
      this.redraw();
    }
  }

  /**
   * onMouseDown
   *   Handles the mousedown event.
   */
  onMouseDown(e : MouseEvent) : void {

    // Make sure only the left mouse button is down.
    if(e.buttons == 1) {

      // Save mouse click canvas coordinates and set waiting to true.
      this.downEvt = e;
      this.isWaiting = true;

      // Set a timeout.
      setTimeout(() => {

        // Set the drag object and reset waiting to false if the waiting flag is
        // still set to true.
        if(this.isWaiting) {
          let downPt = this.getMousePt(this.downEvt);
          this.isWaiting = false;
          this.dragObject =
            this.hitTest(downPt.x, downPt.y);

          // Create a new node and set it as the drag object if no drag object
          // was set.
          if(this.dragObject === null) {
            this.dragObject = this._graph.createNode(downPt.x, downPt.y);
            //
            // TODO:
            // The graph service should be doing this.
            //
            this.dragObject.label = "q0";
            this.drawNode(this.dragObject);
          }

          // Set the drag object to some dummy edge and the replace edge to the
          // original drag object if the drag object was an edge.
          else if(isEdgeView(this.dragObject)) {
            //
            // TODO:
            // Determine which side of the edge the hit test landed on.
            //
            this.replaceEdge = this.dragObject;
            this.dragObject = new GhostEdge(this.replaceEdge.source);
            this.ctx.globalAlpha = 0.3;
            this.drawEdge(this.dragObject, downPt.x, downPt.y);
            this.ctx.globalAlpha = 1;
          }

          // Update the node position if the drag object was set to a node.
          else if(isNodeView(this.dragObject)) {
            this.dragObject.x = downPt.x;
            this.dragObject.y = downPt.y;
            this.redraw();
          }
        }
      }, 300);
    }
  }

  /**
   * onMouseMove
   *   Handles the mousemove event.
   */
  onMouseMove(e : MouseEvent) : void {

    // Make sure only the left mouse button is down.
    if(e.buttons == 1) {

      // Set the down event if it wasn't previously captured.
      //
      // Note:
      //   The only time this should happen is if a node is being dragged from
      //   the components panel, in which case, the dragNode method should be
      //   called to set the drag object.
      if(this.downEvt === null)
        this.downEvt = e;

      // Get the change in x and y locations of the cursor.
      let downPt = this.getMousePt(this.downEvt);
      let ePt = this.getMousePt(e);
      let dx = downPt.x - ePt.x;
      let dy = downPt.y - ePt.y;

      // Reset waiting if waiting is still active and the mouse has moved too
      // far.
      //
      // Note:
      //   The radius is hardcoded to 3 for now.
      if(this.isWaiting && (dx * dx + dy * dy > 3 * 3)) {
        this.isWaiting = false;

        // Check the drag object.
        this.dragObject = this.hitTest(ePt.x, ePt.y);

        // Set the drag object to a dummy edge if the drag object is a node.
        if(isNodeView(this.dragObject))
          this.dragObject = new GhostEdge(this.dragObject);

        // Clear the selected items if the drag object is not a node.
        else
          this.clearSelected();
      }

      // Update the canvas if waiting is not set.
      else if(!this.isWaiting) {

        // Update the selection box if selecting.
        if(this.dragObject === null) {
          let rect = this.makeRect(downPt.x, downPt.y, ePt.x, ePt.y);

          // Update the selected components.
          let swap = [];
          this.clearSelected();
          for(let u of this.unselectedItems) {
            if(this.rectHitTest(u, rect))
              swap.push(u);
          }
          while(swap.length > 0)
            this.addSelectedItem(swap.pop());
  
          this.redraw();
          this.drawSelectionBox(rect);
        }

        // Update edge endpoint if dragging edge.
        else if(isEdgeView(this.dragObject)) {
          this.redraw();
          this.ctx.globalAlpha = 0.3;
          this.drawEdge(this.dragObject, ePt.x, ePt.y);
          this.ctx.globalAlpha = 1;
        }

        // Update node position if dragging node.
        else if(isNodeView(this.dragObject)) {
          this.redraw();
          this.dragObject.x = ePt.x;
          this.dragObject.y = ePt.y;
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

    // Make sure a mousedown event was previously captured.
    if(this.downEvt !== null) {
      let ePt = this.getMousePt(e);

      // Set the selected graph component if waiting.
      if(this.isWaiting) {
        this.clearSelected();
        let hitComponent = this.hitTest(ePt.x, ePt.y);
        if(hitComponent !== null)
          this.addSelectedItem(hitComponent);
      }

      // Create the edge if one is being dragged.
      else if(isEdgeView(this.dragObject)) {

        // Check that the mouse was released at a node.
        let hit = this.hitTest(ePt.x, ePt.y);
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
            let edge = this._graph.createEdge(this.dragObject.source, hit)
            //
            // TODO:
            // The plugin should handle this.
            // Rename showRightArrow to showDestinationArrow, and same for left.
            //
            edge.showLeftArrow = true;
            this.clearSelected();
            this.addSelectedItem(edge);
          }
        }
      }

      // Drop the node if one is being dragged.
      else if(isNodeView(this.dragObject)) {
        //
        // TODO:
        // Pevent nodes from being dropped on top of eachother.
        //
        this.clearSelected();
        this.dragObject.x = ePt.x;
        this.dragObject.y = ePt.y;
        this.addSelectedItem(this.dragObject);
      }

      // Reset input states.
      this.downEvt = null;
      this.dragObject = null;
      this.replaceEdge = null;
      this.isWaiting = false;

      // Redraw the canvas.
      this.redraw();
    }
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
  drawSelectionBox(rect) : void {
    this.ctx.strokeStyle = "#00a2e8";
    this.ctx.fillStyle = "#00a2e8";
    this.ctx.globalAlpha = 0.1;
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    this.ctx.globalAlpha = 1.0;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  /**
   * drawNode
   *   Draws a node on the canvas.
   * 
   * TODO:
   *   This needs to be able to handle custom node shapes/images.
   */
  drawNode(n : NodeView) : void {
    this.ctx.fillStyle = n.color;
    this.ctx.strokeStyle = n.borderColor;
    this.ctx.lineWidth = n.borderWidth;
    this.setLineStyle(n.borderStyle, n.borderWidth);
    this.ctx.beginPath();
    //
    // TODO:
    // For now the radius of a node is hardcoded as 20.
    //
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
    if(e.showLeftArrow)
      this.drawArrow(e.destination, e.source);
    if(e.showRightArrow)
      this.drawArrow(e.source, e.destination);
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
   * drawArrow
   *   Draws an arrow towards the destination node.
   */
  drawArrow(src : NodeView, dst : NodeView) : void {
    //
    // TODO:
    // Either NodeView or EdgeView needs to define anchor points, and the
    // EdgeView must specify which anchor it is attached to for src and dst.
    //

    // Get the vector from src to dst.
    let v = [
      dst.x - src.x,
      dst.y - src.y
    ];

    // Get the distance from src to dst.
    let d = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

    // Get the unit vector from src to dst.
    //
    // TODO:
    // Node radius is hardcoded to 20.
    //
    let u = [
      v[0] / (d - 20),
      v[1] / (d - 20)
    ]

    // Get the point where the edge meets the node border.
    v[0] = u[0] + src.x;
    v[1] = u[1] + src.y;
    //
    // TODO:
    // Figure out how to draw the arrow.
    //
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
        e.color = "#00a2e8";
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
        n.borderColor = "#00a2e8";
        n.borderWidth += 2;
      }
      this.drawNode(n);
      n.borderColor = c;
      n.borderWidth = w;
    }
    //
    // TODO:
    // Text location options.
    //   Top, Left, Bottom, Right, Center
    //   Inside, Outside, Center
    //
    this.ctx.font = "bold 12pt serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.lineWidth = 1.25;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "white";
    //
    // TODO:
    // Add label field to EdgeView.
    //
    // for(let e of this._graph.getEdgeViews()) {
    //   let rect = this.makeRect(
    //     e.source.x, e.source.y,
    //     e.destination.x, e.destination.y
    //   );
    //   this.ctx.strokeText(e.label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    //   this.ctx.fillText(e.label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    // }
    for(let n of this._graph.getNodeViews()) {
      this.ctx.strokeText(n.label, n.x, n.y);
      this.ctx.fillText(n.label, n.x, n.y);
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
    this.moveItem(this.unselectedItems, this.selectedItems, value);
  }

  /**
   * removeSelectedItem
   *   Removes an item from the selected items collection.
   */
  private removeSelectedItem(value : NodeView | EdgeView) : void {
    this.moveItem(this.selectedItems, this.unselectedItems, value);
  }

  /**
   * moveItem
   *   Moves an item from one array to the other.
   */
  private moveItem(
    src : Array<NodeView | EdgeView>,
    dst : Array<NodeView | EdgeView>,
    itm : NodeView | EdgeView
  ) : void {
    dst.push(itm);
    src.splice(src.indexOf(itm));
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

  private rectHitTest(c : EdgeView | NodeView, rect) : boolean {
    //
    // TODO:
    // If any part of the component is within the selection box,
    // this.addSelectedItem(u);
    //
    // Note:
    //   For now, a node is added to the selection if its node is within the
    //   selection box, and an edge is added if either of its nodes' center is
    //   within the selection box.
    //
    return (isNodeView(c) &&
            c.x >= rect.x && c.x <= rect.x + rect.w &&
            c.y >= rect.y && c.y <= rect.y + rect.h) ||
           (isEdgeView(c) && (this.rectHitTest(c.source, rect) ||
            this.rectHitTest(c.destination, rect)));
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

  /**
   * getMousePt
   *   Gets the canvas coordinates from a mouse event.
   */
  private getMousePt(e: MouseEvent) {
    let canvas = this.graphEditorCanvas.nativeElement;
    let rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
  }

  /**
   * makeRect
   *   Makes a rectangle object with the bottom-left corner and height and
   *   width.
   */
  private makeRect(x1 : number, y1 : number, x2 : number, y2 : number) {
    let w = x2 - x1;
    let h = y2 - y1;
    return {
      x : (w < 0 ? x2 : x1),
      y : (h < 0 ? y2 : y1),
      w : (w < 0 ? -1 * w : w),
      h : (h < 0 ? -1 * h : h)
    };
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
