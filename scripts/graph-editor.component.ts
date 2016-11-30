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
// - Make it so that if any part of a component is caught within the selection
//   box, it is selected
// - Something about deep binding for the graph components? [For now, use redraw]
// - Add a selectionChanged event. [Should this be in the DrawableGraph object?]
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

// TODO Remove
import {Graph} from "./graph";


/////// Delegate Interfaces

export interface DrawableGraph {
  readonly nodes : Iterable<DrawableNode>;
  readonly edges : Iterable<DrawableEdge>;

  createNode(x? : number, y? : number) : DrawableNode
  /* contractually `src` -> `dest` will have been validated by 
  `canCreateEdge`, Graph implementations are not required to test this */
  createEdge(src : DrawableNode, dest : DrawableNode) : DrawableEdge
  /* contractually `original` will be in the list,
  this is not necessarily checked by implementations */
  moveEdge(original : DrawableEdge, replacement : DrawableEdge) : void
  /* contractually `node` will be in the list,
  this is not necessarily checked by implementations */
  removeNode(node : DrawableNode) : void
  /* contractually `edge` will be in the list,
  this is not necessarily checked by implementations */
  removeEdge(edge : DrawableEdge) : void
  canCreateEdge(src : DrawableNode, dest : DrawableNode) : boolean 
  canMoveEdge(edge : DrawableEdge, src : DrawableNode, dest : DrawableNode) : boolean 
}

function isDrawableGraph(obj : any) : obj is DrawableGraph {
  //
  // TODO:
  // Return false if obj does not have any one of the members in DrawableGraph.
  //
  return obj !== null;
}

export interface DrawableEdge {
  source : DrawableNode;
  destination : DrawableNode;
  showLeftArrow : boolean;
  showRightArrow : boolean;
  color : string;
  lineStyle : string;
  lineWidth : number;
  // todo more display properties
}

function isDrawableEdge(obj : any) : obj is DrawableEdge {
  //
  // TODO:
  // Return false if obj does not have any one of the members in DrawableEdge.
  //
  return obj !== null && obj.source !== undefined && obj.destination !== undefined;
}

export interface DrawableNode {
  x : number;
  y : number;
  label : string;
  
  color : string;
  borderColor: string;
  borderStyle: string; // TODO: enforce "solid" | "dashed" | "dotted"
  borderWidth: number;
  // todo more display properties
}

export function isDrawableNode(obj : any) : obj is DrawableNode {
  //
  // TODO:
  // Return false if obj does not have any one of the members in DrawableNode.
  //
  return obj !== null && obj.x !== undefined && obj.y !== undefined;
}




///// The main component

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
   * g
   *   The 2D graphics rendering context from the canvas element.
   */
  private g : CanvasRenderingContext2D;

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
  private dragObject : DrawableNode | DrawableEdge = null;

  /**
   * replaceEdge
   *   The edge to be replaced once the new edge has been created.
   */
  private replaceEdge : DrawableEdge = null;

  /**
   * selectedItems
   *   The currently selected graph components.
   */
  private selectedItems : Array<DrawableNode | DrawableEdge> = [];

  /**
   * unselectedItems
   *   The currently unselected graph components.
   */
  private unselectedItems : Array<DrawableNode | DrawableEdge> = [];

  /**
   * _graph
   *   The active graph being edited.
   */
  private _graph : DrawableGraph = null;

  /**
   * graph
   *   Sets the active graph.
   */
  set graph(value : DrawableGraph) {
    this._graph = value;
    this.clearSelected();
    this.redraw();
  }

  /**
   * graph
   *   Gets the active graph.
   */
  get graph() : DrawableGraph {
    return this._graph;
  }

  /**
   * dragNode
   *   Sets the node being dragged by the cursor.
   */
  set dragNode(value : DrawableNode) {
    this.dragObject = value;
  }

  /**
   * ngAfterViewInit
   *   Gets the canvas rendering context and resizes the canvas element.
   */
  ngAfterViewInit() {
    this.g = this.graphEditorCanvas.nativeElement.getContext("2d");
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
      let edges : Array<DrawableEdge> = [];
      let nodes : Array<DrawableNode> = [];
      while(this.selectedItems.length > 0) {
        let i = this.selectedItems.pop();
        if(isDrawableEdge(i))
          edges.push(i);
        else if(isDrawableNode(i))
          nodes.push(i);
      }
      for(let n of nodes) {
        for(let u of this.unselectedItems)
          if(isDrawableEdge(u) && (u.source === n || u.destination === n))
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
          let downPt = getMousePt(this.g, this.downEvt);
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
            drawNode(this.g, this.dragObject);
          }

          // Set the drag object to some dummy edge and the replace edge to the
          // original drag object if the drag object was an edge.
          else if(isDrawableEdge(this.dragObject)) {
            //
            // TODO:
            // Determine which side of the edge the hit test landed on.
            //
            this.replaceEdge = this.dragObject;
            this.dragObject = new GhostEdge(this.replaceEdge.source);
            this.g.globalAlpha = 0.3;
            drawEdge(this.g, this.dragObject, downPt.x, downPt.y);
            this.g.globalAlpha = 1;
          }

          // Update the node position if the drag object was set to a node.
          else if(isDrawableNode(this.dragObject)) {
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
      let downPt = getMousePt(this.g, this.downEvt);
      let ePt = getMousePt(this.g, e);
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
        if(isDrawableNode(this.dragObject))
          this.dragObject = new GhostEdge(this.dragObject);

        // Clear the selected items if the drag object is not a node.
        else
          this.clearSelected();
      }

      // Update the canvas if waiting is not set.
      else if(!this.isWaiting) {

        // Update the selection box if selecting.
        if(this.dragObject === null) {
          let rect = makeRect(downPt.x, downPt.y, ePt.x, ePt.y);

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
          drawSelectionBox(this.g, rect);
        }

        // Update edge endpoint if dragging edge.
        else if(isDrawableEdge(this.dragObject)) {
          this.redraw();
          this.g.globalAlpha = 0.3;
          drawEdge(this.g, this.dragObject, ePt.x, ePt.y);
          this.g.globalAlpha = 1;
        }

        // Update node position if dragging node.
        else if(isDrawableNode(this.dragObject)) {
          this.redraw();
          this.dragObject.x = ePt.x;
          this.dragObject.y = ePt.y;
          //
          // TODO:
          // Put a drop shadow here?
          //
          drawNode(this.g, this.dragObject);
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
      let ePt = getMousePt(this.g, e);

      // Set the selected graph component if waiting.
      if(this.isWaiting) {
        this.clearSelected();
        let hitComponent = this.hitTest(ePt.x, ePt.y);
        if(hitComponent !== null)
          this.addSelectedItem(hitComponent);
      }

      // Create the edge if one is being dragged.
      else if(isDrawableEdge(this.dragObject)) {

        // Check that the mouse was released at a node.
        let hit = this.hitTest(ePt.x, ePt.y);
        if(isDrawableNode(hit)) {
          //
          // TODO:
          // This needs to have some notion of canReplaceEdge from the graph.
          // Note: Consider the case where the user wants to move an edge
          //       destination to some other node, but the selectedEdgeType is not
          //       the same as the replacement edge type. DrawableGraph can either
          //       redefine the replaceEdge method to take in the original edge
          //       plus a source and destination DrawableNode and either succeed or
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
            edge.showRightArrow = true;
            this.clearSelected();
            this.addSelectedItem(edge);
          }
        }
      }

      // Drop the node if one is being dragged.
      else if(isDrawableNode(this.dragObject)) {
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
   * redraw
   *   Redraws the graph.
   */
  redraw() : void {
    clear(this.g);
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
    for(let e of this._graph.edges) {
      let c = e.color;
      let w = e.lineWidth;
      if(e === this.replaceEdge)
        this.g.globalAlpha = 0.3;
      else if(this.selectedItems.indexOf(e) > -1) {
        e.color = "#00a2e8";
        e.lineWidth += 2;
      }
      drawEdge(this.g, e);
      e.color = c;
      e.lineWidth = w;
      this.g.globalAlpha = 1;
    }
    for(let n of this._graph.nodes) {
      let c = n.borderColor;
      let w = n.borderWidth;
      if(this.selectedItems.indexOf(n) > -1) {
        n.borderColor = "#00a2e8";
        n.borderWidth += 2;
      }
      drawNode(this.g, n);
      n.borderColor = c;
      n.borderWidth = w;
    }
    //
    // TODO:
    // Text location options.
    //   Top, Left, Bottom, Right, Center
    //   Inside, Outside, Center
    //
    this.g.font = "10pt serif";
    this.g.textAlign = "center";
    this.g.textBaseline = "middle";
    this.g.lineWidth = 2;
    this.g.strokeStyle = "#000";
    this.g.fillStyle = "#fff";
    //
    // TODO:
    // Add label field to DrawableEdge.
    //
    // for(let e of this._graph.getDrawableEdges()) {
    //   let rect = this.makeRect(
    //     e.source.x, e.source.y,
    //     e.destination.x, e.destination.y
    //   );
    //   this.ctx.strokeText(e.label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    //   this.ctx.fillText(e.label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    // }
    for(let n of this._graph.nodes) {
      this.g.strokeText(n.label, n.x, n.y);
      this.g.fillText(n.label, n.x, n.y);
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
      for(let e of this._graph.edges)
        this.unselectedItems.push(e);
      for(let n of this._graph.edges)
        this.unselectedItems.push(n);
    }
  }

  /**
   * addSelectedItem
   *   Adds an item to the selected items collection.
   */
  private addSelectedItem(value : DrawableNode | DrawableEdge) : void {
    moveItem(this.unselectedItems, this.selectedItems, value);
  }

  /**
   * removeSelectedItem
   *   Removes an item from the selected items collection.
   */
  private removeSelectedItem(value : DrawableNode | DrawableEdge) : void {
    moveItem(this.selectedItems, this.unselectedItems, value);
  }

  /**
   * hitTest
   *   Gets the first graph component that is hit by x and y.
   * 
   * <p>
   *   Nodes take priority over edges.
   * </p>
   */
  private hitTest(x : number, y : number) : DrawableNode | DrawableEdge {
    //
    // TODO:
    // Make sure to handle hit testing of custom shapes.
    // When hit testing edges, hit test only on the end points.
    //   End points will show on mouse hover.
    //
    for(let n of this._graph.nodes) {
      let dx = n.x - x;
      let dy = n.y - y;
      if(dx * dx + dy * dy <= 20 * 20)
        return n;
    }
    for(let e of this.graph.edges) {
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
   * rectHitTest
   *   Checks if a graph component was hit by a rectangle.
   */
  private rectHitTest(c : DrawableEdge | DrawableNode, rect) : boolean {
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
    return (isDrawableNode(c) &&
            c.x >= rect.x && c.x <= rect.x + rect.w &&
            c.y >= rect.y && c.y <= rect.y + rect.h) ||
           (isDrawableEdge(c) && (this.rectHitTest(c.source, rect) ||
            this.rectHitTest(c.destination, rect)));
  }

}

// Static functions. ///////////////////////////////////////////////////////////

/**
 * getMousePt
 *   Gets the canvas coordinates from a mouse event.
 */
function getMousePt(g : CanvasRenderingContext2D, e: MouseEvent) {
  let canvas = g.canvas;
  let rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

/**
 * moveItem
 *   Moves an item from one array to the other.
 */
function moveItem(
  src : Array<DrawableNode | DrawableEdge>,
  dst : Array<DrawableNode | DrawableEdge>,
  itm : DrawableNode | DrawableEdge
) : void {
  dst.push(itm);
  src.splice(src.indexOf(itm));
}


/**
 * setLineStyle
 *   Sets the line style of the rendering context.
 */
function setLineStyle(
  g : CanvasRenderingContext2D,
  value : string,
  dotSize : number = 1
) {
  if(value == "dashed")
    g.setLineDash([3 * dotSize, 6 * dotSize]);
  else if(value == "dotted")
    g.setLineDash([dotSize]);
  else
    g.setLineDash([1, 0]);
}

/**
 * makeRect
 *   Makes a rectangle object with the bottom-left corner and height and width.
 */
function makeRect(x1 : number, y1 : number, x2 : number, y2 : number) {
  let w = x2 - x1;
  let h = y2 - y1;
  return {
    x : (w < 0 ? x2 : x1),
    y : (h < 0 ? y2 : y1),
    w : (w < 0 ? -1 * w : w),
    h : (h < 0 ? -1 * h : h)
  };
}

/**
 * drawSelectionBox
 *   Draws the selection box.
 */
function drawSelectionBox(g : CanvasRenderingContext2D, rect) : void {
  g.strokeStyle = "#00a2e8";
  g.fillStyle = "#00a2e8";
  g.globalAlpha = 0.1;
  g.fillRect(rect.x, rect.y, rect.w, rect.h);
  g.globalAlpha = 1.0;
  g.lineWidth = 1;
  g.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/**
 * drawNode
 *   Draws a node on the canvas.
 * 
 * TODO:
 *   This needs to be able to handle custom node shapes/images.
 */
function drawNode(g : CanvasRenderingContext2D, n : DrawableNode) : void {
  g.fillStyle = n.color;
  g.strokeStyle = n.borderColor;
  g.lineWidth = n.borderWidth;
  setLineStyle(g, n.borderStyle, n.borderWidth);
  g.beginPath();
  //
  // TODO:
  // For now the radius of a node is hardcoded as 20.
  //
  g.arc(n.x, n.y, 20, 0, 2 * Math.PI);
  g.fill();
  g.stroke();
}

/**
 * drawEdge
 *   Draws an edge on the canvas.
 * 
 * TODO:
 *   This needs to be able to handle custom edge drawing.
 */
function drawEdge(
  g : CanvasRenderingContext2D,
  e : DrawableEdge,
  x? : number, y? : number
) : void {
  g.strokeStyle = e.color;
  g.lineWidth = e.lineWidth;
  setLineStyle(g, e.lineStyle, e.lineWidth);
  if(x && y)
    drawLine(g, e.source.x, e.source.y, x, y);
  else
    drawLine(g, e.source.x, e.source.y, e.destination.x, e.destination.y);
  if(e.showLeftArrow)
    drawArrow(g, e.destination, e.source);
  if(e.showRightArrow)
    drawArrow(g, e.source, e.destination);
}

/**
 * drawLine
 *   Draws a line.
 */
function drawLine(
  g : CanvasRenderingContext2D,
  x1 : number, y1 : number,
  x2 : number, y2 : number
) : void {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

/**
 * drawArrow
 *   Draws an arrow towards the destination node.
 */
function drawArrow(
  g : CanvasRenderingContext2D,
  src : DrawableNode,
  dst : DrawableNode
) : void {

  const COS_THETA = Math.cos(5 * Math.PI / 6);
  const SIN_THETA = Math.sin(5 * Math.PI / 6);

  //
  // TODO:
  // Either DrawableNode or DrawableEdge needs to define anchor points, and the
  // DrawableEdge must specify which anchor it is attached to for src and dst.
  //

  // Get the vector from src to dst.
  let v = [
    dst.x - src.x,
    dst.y - src.y
  ];

  // Get the distance from src to dst.
  let d = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

  // Get the unit vector from src to dst.
  let u = [
    v[0] / d,
    v[1] / d
  ]

  // Get the point where the edge meets the node border.
  //
  // TODO:
  // Node radius is hardcoded to 20.
  //
  v[0] = u[0] * (d - 20) + src.x;
  v[1] = u[1] * (d - 20) + src.y;

  // Draw arrow.
  drawLine(
    g,
    v[0], v[1],
    v[0] + 20 * (u[0] * COS_THETA - u[1] * SIN_THETA),
    v[1] + 20 * (u[0] * SIN_THETA + u[1] * COS_THETA)
  );
  drawLine(
    g,
    v[0], v[1],
    v[0] + 20 * (u[0] * COS_THETA + u[1] * SIN_THETA),
    v[1] + 20 * (-u[0] * SIN_THETA + u[1] * COS_THETA)
  );
}

/**
 * clear
 *   Clears the canvas.
 */
function clear(g : CanvasRenderingContext2D) : void {
  let canvas = g.canvas;
  g.fillStyle = "white";
  g.fillRect(0, 0, canvas.width, canvas.height);
  //
  // TODO:
  // Draw the grid.
  //
}

// Static classes. /////////////////////////////////////////////////////////////

/**
 * GhostEdge
 *   Spoopy haunted edge that follows the cursor. *ooOOOoOOooooOOOOooOoOoOoo*
 */
class GhostEdge implements DrawableEdge {
  showLeftArrow : boolean = false;
  showRightArrow : boolean = false;
  color : string = "#000";
  lineStyle : string = "dotted";
  lineWidth : number = 2;
  destination : DrawableNode = null;
  constructor(public source : DrawableNode) { }
}
