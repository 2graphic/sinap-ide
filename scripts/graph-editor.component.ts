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
// - Multi-component move while dragging multiple nodes.
// - Special draw start node.
// - Special draw "final/accept" nodes.
// - @Input height/width
// - Zoom and Pan
//   pinch to zoom/two-touch drag to pan
// - Make it so that if any part of a component is caught within the selection
//   box, it is selected
// - Something about deep binding for the graph components? [For now, use redraw]
// - Add mouse hover display behavior
//   - Show edge anchor points
//   - etc.
// - Have a visual indication for determining if an edge can be moved from one
//   node to another.
// - Update documentation.
// - Text location options.
//   - Top, Left, Bottom, Right, Center
//   - Inside, Outside, Center
// - Should selection display properties be hardcoded?
// - Should node radius be set to be half the grid spacing?
// - Custom shapes/images for nodes.
// - Custom lines for edges (default/quadratic/bezier/orthogonal).
// - Make sure to handle hit testing of custom shapes.
// - When hit testing edges, hit test only on the end points.
//   - End points will show on mouse hover.
// - If any part of the component is within the selection box,
//   this.addSelectedItem(u);
//
// Note:
//   For now, a node is added to the selection if its center is within the
//   selection box, and an edge is added if either of its nodes' center is
//   within the selection box.
//
//

// Imports /////////////////////////////////////////////////////////////////////

import {
  AfterViewInit,
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from "@angular/core";

// Static constants ////////////////////////////////////////////////////////////
//
// Note:
// These values should probably be defined in some user/workspace preferences
// file.
//

/**
 * GRID_SPACING
 *   Grid spacing between ticks.
 */
const GRID_SPACING : number = 40;

/**
 * GRID_MINOR_OFFSET
 *   Offset for minor grid ticks.
 */
const GRID_MINOR_OFFSET : number = 20;

/**
 * NUDGE
 *   The distance the cursor must move by in order to cancel waiting for
 *   dragging a node.
 */
const NUDGE : number = 3;

/**
 * STICKY_DELAY
 *   Number of miliseconds to wait for sticking a graph element to the cursor.
 */
const STICKY_DELAY : number = 300;

/**
 * COS_THETA
 *   Used in the rotation matrix for drawing edge arrows.
 */
const COS_THETA : number = Math.cos(5 * Math.PI / 6);

/**
 * SIN_THETA
 *   Used in the rotation matrix for drawing edge arrows.
 */
const SIN_THETA : number = Math.sin(5 * Math.PI / 6);

// Public interfaces ///////////////////////////////////////////////////////////

/**
 * Drawable
 *   Interface for determining if an object is a drawable graph entity.
 */
export interface Drawable {
  isGraph() : this is DrawableGraph;
  isEdge() : this is DrawableEdge;
  isNode() : this is DrawableNode;
}

/**
 * DrawableGraph
 *   Interface that exposes drawable graph properties and methods.
 */
export interface DrawableGraph extends Drawable {
  readonly nodes : Iterable<DrawableNode>;
  readonly edges : Iterable<DrawableEdge>;

  createNode(x? : number, y? : number) : DrawableNode
  /* contractually `src` -> `dest` will have been validated by 
  `canCreateEdge`, Graph implementations are not required to test this */
  createEdge(src : DrawableNode, dest : DrawableNode, like? : DrawableEdge) : DrawableEdge
  /* contractually `original` will be in the list,
  this is not necessarily checked by implementations */
  replaceEdge(original : DrawableEdge, replacement : DrawableEdge) : void
  /* contractually `node` will be in the list,
  this is not necessarily checked by implementations */
  removeNode(node : DrawableNode) : void
  /* contractually `edge` will be in the list,
  this is not necessarily checked by implementations */
  removeEdge(edge : DrawableEdge) : void
  canCreateEdge(src : DrawableNode, dest : DrawableNode, like? : DrawableEdge) : boolean 
}

/**
 * DrawableEdge
 */
export interface DrawableEdge extends Drawable {
  source : DrawableNode;
  destination : DrawableNode;
  showSourceArrow : boolean;
  showDestinationArrow : boolean;
  color : string;
  lineStyle : string;
  lineWidth : number;
  label : string;
  // todo more display properties
}

/**
 * DrawableNode
 */
export interface DrawableNode extends Drawable {
  x : number;
  y : number;
  label : string;
  
  color : string;
  borderColor: string;
  borderStyle: string; // TODO: enforce "solid" | "dashed" | "dotted"
  borderWidth: number;
  // todo more display properties
}

// Graph Editor Angular Component //////////////////////////////////////////////

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
export class GraphEditorComponent
  implements AfterViewInit, AfterViewChecked, OnChanges {

  /**
   * selectionChanged
   *   An event emitter that is emitted when the selected items is changed.
   */
  @Output() selectionChanged = new EventEmitter();

  /**
   * graph
   *   Input property for the graph object.
   */
  @Input() graph : DrawableGraph;

  /**
   * graphEditorCanvas
   *   Reference to the canvas child element.
   */
  @ViewChild("sinapGraphEditorCanvas") graphEditorCanvas : ElementRef;

  /**
   * g
   *   The 2D graphics rendering context from the canvas element.
   */
  private g : CanvasRenderingContext2D = null;

  /**
   * gridOriginPt
   *   The coordinates of the grid origin.
   */
  private gridOriginPt = { x: 0, y: 0 };

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
  private moveEdge : DrawableEdge = null;

  /**
   * selectedItems
   *   The set of selected graph components.
   */
  private selectedItems : Set<DrawableEdge | DrawableNode> =
    new Set<DrawableEdge | DrawableNode>();

  /**
   * unselectedItems
   *   The set of unselected graph components.
   */
  private unselectedItems : Set<DrawableEdge | DrawableNode> =
    new Set<DrawableEdge | DrawableNode>();

  /**
   * dragNode
   *   Sets the node being dragged by the cursor.
   * 
   * TODO:
   * Should this be an @Input?
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
    this.g.mozImageSmoothingEnabled = true;
    this.g.webkitImageSmoothingEnabled = true;
    this.g.msImageSmoothingEnabled = true;
    this.g.translate(0.5, 0.5);
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
   * ngOnChanges
   *   Updates the view when a bound property is changed.
   */
  ngOnChanges(changes : SimpleChanges) {
    for(let c in changes) {
      if(c == "graph" && this.g !== null) {
        this.redraw();
      }
    }
  }

  /**
   * clearSelected
   *   Clears the selected items.
   */
  clearSelected() : void {
    this.selectedItems.clear();
    this.unselectedItems.clear();
    for(let n of this.graph.nodes)
      this.unselectedItems.add(n);
    for(let e of this.graph.edges)
      this.unselectedItems.add(e);
    this.selectionChanged.emit(
      new Set<Drawable>(this.selectedItems)
    );
  }

  /**
   * onKeyDown
   *   Handles the delete key.
   * 
   * Note:
   *   I don't like where this is.
   */
  onKeyDown(e : KeyboardEvent) : void {
    // Delete keyCode is 46.
    if(e.keyCode == 46 || e.keyCode == 8) {
      let edges = new Set<DrawableEdge>();
      let nodes = new Set<DrawableNode>();
      for (let ele of this.selectedItems){
        if(ele.isEdge()){
          edges.add(ele);
        }
        else if (ele.isNode()) {
          nodes.add(ele);
        }
      }
      let unselectedEdges = [...this.graph.edges].filter(x => !edges.has(x))

      for(let n of nodes) {
        for (let e of unselectedEdges.filter(u =>
                      (u.source === n || u.destination === n))){
          edges.add(e);
        }
        this.graph.removeNode(n);
      }
      for(let e of edges)
        this.graph.removeEdge(e);
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
            this.dragObject = this.graph.createNode(downPt.x, downPt.y);
            this.redraw();
          }

          // Set the drag object to some dummy edge and the replace edge to the
          // original drag object if the drag object was an edge.
          else if(this.dragObject.isEdge()) {
            //
            // TODO:
            // Determine which side of the edge the hit test landed on.
            //
            this.moveEdge = this.dragObject;
            this.dragObject = cloneEdge(this.moveEdge);
            this.dragObject.lineStyle = "dotted";
            this.redraw();
            this.g.globalAlpha = 0.3;
            this.drawEdge(this.dragObject, downPt.x, downPt.y);
            this.g.globalAlpha = 1;
          }

          // Create a new dummy edge with the source node as the drag object.
          else if(this.dragObject.isNode()) {
            this.dragObject = new DummyEdge(this.dragObject);
            this.redraw();
            this.g.globalAlpha = 0.3;
            this.drawEdge(this.dragObject, downPt.x, downPt.y);
            this.g.globalAlpha = 1;
          }
        }
      }, STICKY_DELAY);
    }
  }

  /**
   * onMouseMove
   *   Handles the mousemove event.
   */
  onMouseMove(e : MouseEvent) : void {

    // Capture the down event if the drag object has been set.
    if(this.dragObject !== null && this.downEvt === null) {
      this.downEvt = e;
    }

    // Make sure the mousedown event was previously captured.
    if(this.downEvt !== null) {

      // Get the change in x and y locations of the cursor.
      let downPt = getMousePt(this.g, this.downEvt);
      let ePt = getMousePt(this.g, e);
      let dx = downPt.x - ePt.x;
      let dy = downPt.y - ePt.y;

      // Reset waiting if waiting is still active and the mouse has moved too
      // far.
      if(this.isWaiting && (dx * dx + dy * dy > NUDGE * NUDGE)) {
        this.isWaiting = false;

        // Check the drag object.
        this.dragObject = this.hitTest(ePt.x, ePt.y);

        // Set the selected item.
        this.clearSelected();
        if(this.dragObject !== null)
          this.addSelectedItem(this.dragObject);
      }

      // Update the canvas if waiting is not set.
      else if(!this.isWaiting) {

        // Update the selection box if selecting.
        if(this.dragObject === null) {
          let rect = makeRect(downPt.x, downPt.y, ePt.x, ePt.y);

          // Update the selected components.
          for(let i of this.selectedItems) {
            if(!this.rectHitTest(i, rect))
              moveItem(this.selectedItems, this.unselectedItems, i);
          }
          for(let i of this.unselectedItems) {
            if(this.rectHitTest(i, rect))
              moveItem(this.unselectedItems, this.selectedItems, i);
          }
          this.selectionChanged.emit(new Set<DrawableEdge | DrawableNode>(
            this.selectedItems
          ));
  
          // Update the canvas.
          this.redraw();
          drawSelectionBox(this.g, rect);
        }

        // Update edge endpoint if dragging edge.
        else if(this.dragObject.isEdge()) {
          this.redraw();
          this.g.globalAlpha = 0.3;
          this.drawEdge(this.dragObject, ePt.x, ePt.y);
          this.g.globalAlpha = 1;
        }

        // Update node position if dragging node.
        else if(this.dragObject.isNode) {
          this.dragObject.x = ePt.x;
          this.dragObject.y = ePt.y;
          this.redraw();
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
      else if(this.dragObject !== null && this.dragObject.isEdge()) {

        // Check that the mouse was released at a node.
        let hit = this.hitTest(ePt.x, ePt.y);
        if(hit !== null && hit.isNode()) {

          // Move the edge if one is being dragged and it can be moved.
          if(
            this.moveEdge !== null && 
            this.graph.canCreateEdge(this.dragObject.source, hit, this.moveEdge)
          ) {
            this.clearSelected();
            this.graph.removeEdge(this.moveEdge);
            this.addSelectedItem(this.graph.createEdge(
              this.dragObject.source, hit, this.moveEdge
            ));
          }

          // Create a new edge if none is being moved and it can be created.
          else if(
            this.moveEdge === null &&
            this.graph.canCreateEdge(this.dragObject.source, hit)
          ) {
            let edge = this.graph.createEdge(this.dragObject.source, hit)
            this.clearSelected();
            this.addSelectedItem(edge);
          }
        }
      }

      // Drop the node if one is being dragged.
      else if(this.dragObject !== null && this.dragObject.isNode()) {
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
      this.moveEdge = null;
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
    clear(this.g, this.gridOriginPt);
    if(this.graph !== null) {
      for(let e of this.graph.edges)
        this.drawEdge(e);
      for(let n of this.graph.nodes)
        this.drawNode(n);
    }
  }

  /**
   * drawNode
   *   Draws a node on the canvas.
   */
  private drawNode(n : DrawableNode) : void {

    // Node
    if(n === this.dragObject) {
      this.g.shadowColor = "#000";
      this.g.shadowBlur = 10;
    }

    if(this.selectedItems.has(n)) {
      let sel = cloneNode(n);
      this.g.fillStyle = "#00a2e8";
      this.g.strokeStyle = "#00a2e8";
      this.g.beginPath();
      this.g.arc(n.x, n.y, (GRID_SPACING + n.borderWidth) / 2 + 2, 0, 2 * Math.PI);
      this.g.fill();
      this.g.shadowBlur = 0;
      this.g.stroke();
    }
    this.g.fillStyle = n.color;
    this.g.strokeStyle = n.borderColor;
    this.g.lineWidth = n.borderWidth;
    setLineStyle(this.g, n.borderStyle, n.borderWidth);
    this.g.beginPath();
    this.g.arc(n.x, n.y, GRID_SPACING / 2, 0, 2 * Math.PI);
    this.g.fill();
    this.g.shadowBlur = 0;
    this.g.stroke();

    // Label
    this.g.font = "10pt serif";
    this.g.textAlign = "center";
    this.g.textBaseline = "middle";
    this.g.lineWidth = 2;
    this.g.strokeStyle = "#000";
    this.g.fillStyle = "#fff";
    this.g.strokeText(n.label, n.x, n.y);
    this.g.fillText(n.label, n.x, n.y);
  }

  /**
   * drawEdge
   *   Draws an edge on the canvas.
   */
  private drawEdge(e : DrawableEdge, x? : number, y? : number) : void {

    // Edge
    if(this.selectedItems.has(e)) {
      let d = cloneEdge(e);
      d.color = "#00a2e8";
      d.lineWidth += 3;
      this.drawEdge(d);
    }
    if(e === this.moveEdge)
      this.g.globalAlpha = 0.3;
    this.g.strokeStyle = e.color;
    this.g.lineWidth = e.lineWidth;
    setLineStyle(this.g, e.lineStyle, e.lineWidth);
    if(x && y)
      drawLine(this.g, e.source.x, e.source.y, x, y);
    else
      drawLine(this.g, e.source.x, e.source.y, e.destination.x, e.destination.y);
    if(e.showSourceArrow)
      drawArrow(this.g, e.destination, e.source);
    if(e.showDestinationArrow)
      drawArrow(this.g, e.source, e.destination);
    this.g.globalAlpha = 1;

    // Label
    this.g.font = "10pt serif";
    this.g.textAlign = "center";
    this.g.textBaseline = "middle";
    let tw = this.g.measureText(e.label).width;
    let rect = makeRect(
      e.source.x, e.source.y,
      e.destination.x, e.destination.y
    );
    x = rect.x + rect.w / 2;
    y = rect.y + rect.h / 2;
    rect = makeRect(x - tw / 2 - 6, y - 8, x + tw / 2 + 6, y + 8);
    this.g.lineWidth = e.lineWidth;
    this.g.fillStyle = "#fff";
    setLineStyle(this.g, e.lineStyle);
    this.g.lineJoin = "round";
    this.g.fillRect(rect.x, rect.y, rect.w, rect.h);
    this.g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    setLineStyle(this.g, "solid");
    this.g.lineWidth = 1;
    this.g.fillStyle = "#000";
    this.g.fillText(e.label, x, y);
  }

  /**
   * addSelectedItem
   *   Adds an item to the selected items set.
   */
  private addSelectedItem(item : Drawable) {
    moveItem(this.unselectedItems, this.selectedItems, item);
    this.selectionChanged.emit(new Set<Drawable>(
      this.selectedItems
    ));
  }

  /**
   * removeSelectedItem
   *   Removes an item from the selected items set.
   */
  private removeSelectedItem(item : Drawable) {
    moveItem(this.selectedItems, this.unselectedItems, item);
    this.selectionChanged.emit(new Set<Drawable>(
      this.selectedItems
    ));
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

    // Hit test nodes first.
    for(let n of this.graph.nodes) {
      let dx = n.x - x;
      let dy = n.y - y;
      if(dx * dx + dy * dy <= GRID_SPACING * GRID_SPACING / 4)
        return n;
    }

    // Hit test edges.
    for(let e of this.graph.edges) {
      let r = makeRect(
        e.source.x,
        e.source.y,
        e.destination.x,
        e.destination.y,
      );
      let lx = e.source.x;
      let ly = e.source.y;
      let rx = e.destination.x;
      let ry = e.destination.y;
      if(
        (x > r.x && x < r.x + r.w) &&
        (y > r.y && y < r.y + r.h)
      ) {
        let x1 = (lx < rx ? lx : rx);
        let y1 = (ly < ry ? ly : ry);
        let x2 = (lx < rx ? rx : lx);
        let y2 = (ly < ry ? ry : ly);
        let m = (y2 - y1) / (x2 - x1);
        let b = y1 - m * x1;
        if(Math.abs(y - (m * x + b)) < 10)
          return e;
      }
    }
    return null;
  }

  /**
   * rectHitTest
   *   Checks if a graph component was hit by a rectangle.
   */
  private rectHitTest(c : DrawableEdge | DrawableNode, rect) : boolean {
    return (c.isNode() &&
            c.x >= rect.x && c.x <= rect.x + rect.w &&
            c.y >= rect.y && c.y <= rect.y + rect.h) ||
           (c.isEdge() && (this.rectHitTest(c.source, rect) ||
            this.rectHitTest(c.destination, rect)));
  }

}

// Static functions ////////////////////////////////////////////////////////////

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
 *   Moves an item from one set to the other.
 */
function moveItem(
  src : Set<Drawable>,
  dst : Set<Drawable>,
  itm : Drawable
) : void {
  src.delete(itm);
  dst.add(itm);
}


/**
 * setLineStyle
 *   Sets the line style of the rendering context.
 */
function setLineStyle(
  g : CanvasRenderingContext2D,
  value : string,
  dotSize? : number
) {
  if(dotSize === undefined || dotSize === null)
    dotSize = g.lineWidth;
  if(value == "dashed")
    g.setLineDash([3 * dotSize, 6 * dotSize]);
  else if(value == "dotted")
    g.setLineDash([dotSize, 2 * dotSize]);
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
  v[0] = u[0] * (d - GRID_SPACING / 2) + src.x;
  v[1] = u[1] * (d - GRID_SPACING / 2) + src.y;

  // Draw arrow.
  drawLine(
    g,
    v[0], v[1],
    v[0] + GRID_SPACING * (u[0] * COS_THETA - u[1] * SIN_THETA) / 2,
    v[1] + GRID_SPACING * (u[0] * SIN_THETA + u[1] * COS_THETA) / 2
  );
  drawLine(
    g,
    v[0], v[1],
    v[0] + GRID_SPACING * (u[0] * COS_THETA + u[1] * SIN_THETA) / 2,
    v[1] + GRID_SPACING * (-u[0] * SIN_THETA + u[1] * COS_THETA) / 2
  );
}

/**
 * clear
 *   Clears the canvas.
 */
function clear(g : CanvasRenderingContext2D, gridOriginPt) : void {
  let canvas = g.canvas;
  let w = canvas.width;
  let h = canvas.height;
  g.fillStyle = "white";
  g.fillRect(0, 0, canvas.width, canvas.height);

  setLineStyle(g, "solid");
  for(
    let x = gridOriginPt.x % GRID_SPACING - GRID_SPACING;
    x < w + GRID_SPACING; 
    x += GRID_SPACING
  ) {
    g.strokeStyle = "#7e7e7e";
    g.lineWidth = 1;
    setLineStyle(g, "solid");
    drawLine(g, x, 0, x, h);
    g.strokeStyle = "#c3c3c3";
    g.lineWidth = 0.5;
    setLineStyle(g, "dotted");
    drawLine(g, x + GRID_MINOR_OFFSET, 0, x + GRID_MINOR_OFFSET, h);
  }
  for(
    let y = gridOriginPt.y % GRID_SPACING - GRID_SPACING;
    y < h + GRID_SPACING;
    y += GRID_SPACING
  ) {
    g.strokeStyle = "#7e7e7e";
    g.lineWidth = 1;
    setLineStyle(g, "solid");
    drawLine(g, 0, y, w, y);
    g.strokeStyle = "#c3c3c3";
    g.lineWidth = 1;
    setLineStyle(g, "dotted");
    drawLine(g, 0, y + GRID_MINOR_OFFSET, w, y + GRID_MINOR_OFFSET);
  }
}

/**
 * cloneEdge
 *   Creates a cloned edge.
 */
function cloneEdge(e : DrawableEdge) : DrawableEdge {
  let clone = new DummyEdge();
  clone.source = e.source;
  clone.destination = e.destination;
  clone.showSourceArrow = e.showSourceArrow;
  clone.showDestinationArrow = e.showDestinationArrow;
  clone.color = e.color;
  clone.lineStyle = e.lineStyle;
  clone.lineWidth = e.lineWidth;
  clone.label = e.label;
  return clone;
}

/**
 * cloneNode
 *   Creates a cloned node.
 */
function cloneNode(n : DrawableNode) : DrawableNode {
  let clone = new DummyNode();
  clone.label = n.label;
  clone.color = n.color;
  clone.borderColor = n.borderColor;
  clone.borderStyle = n.borderStyle;
  clone.borderWidth = n.borderWidth;
  clone.x = n.x;
  clone.y = n.y;
  return clone;
}

// Static classes //////////////////////////////////////////////////////////////

/**
 * DummyNode
 */
class DummyNode implements DrawableNode {
  isGraph() {
    return false;
  }
  isNode() {
    return true;
  }
  isEdge() {
    return false;
  }
  label : string = "";
  color : string = "#fff200";
  borderColor : string = "#000";
  borderStyle : string = "solid";
  borderWidth : number = 1;
  x : number = 0;
  y : number = 0;
}

/**
 * DummyEdge
 */
class DummyEdge implements DrawableEdge {
  isEdge(){
    return true;
  }
  isGraph(){
    return false;
  }
  isNode(){
    return false;
  }
  source : DrawableNode = null;
  destination : DrawableNode = null;
  showSourceArrow : boolean = false;
  showDestinationArrow : boolean = false;
  color : string = "#000";
  lineStyle : string = "dotted";
  lineWidth : number = 2;
  label = "";

  constructor(sourceNode : DrawableNode = null) {
    this.source = sourceNode;
  }
}
