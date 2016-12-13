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
// Resources:
// - System colors:
//   https://www.w3.org/TR/REC-CSS2/ui.html#system-colors
//
//
// TODO:
// - Zoom and Pan
//   pinch to zoom/two-touch drag to pan
// - Snap to grid.
// - Special draw start node.
// - Special draw "final/accept" nodes.
// - Custom shapes/images for nodes.
// - Custom lines for edges (default/quadratic/bezier/orthogonal).
// - Make sure to handle hit testing of custom shapes.
// - Make it so that if any part of a component is caught within the selection
//   box, it is selected
// - @Input height/width
// - Something about deep binding for the graph components? [For now, use
//   redraw]
// - Have a visual indication for determining if an edge can be moved from one
//   node to another.
// - Update documentation.
// - Text location options.
//   - Top, Left, Bottom, Right, Center
//   - Inside, Outside, Center
// - Should selection display properties be hardcoded?
// - Should node radius be set to be half the grid spacing?
// - Consolidate code duplication.
//
//

// Imports /////////////////////////////////////////////////////////////////////

import {
  AfterViewInit,
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
 * AA_SCALE
 *   Anti-aliasing scale.
 */
const AA_SCALE : number = 2;

/**
 * GRID_SPACING
 *   Grid spacing between ticks.
 */
const GRID_SPACING : number = 40;

/**
 * GRID_MAJOR_COLOR
 *   Color of major grid tickmarks.
 */
const GRID_MAJOR_COLOR : string = "#c3c3c3";

/**
 * GRID_MAJOR_STYLE
 *   Linestyle of major grid tickmarks.
 */
const GRID_MAJOR_STYLE : string = "solid";

/**
 * GRID_MAJOR_WIDTH
 *   Linewidth of major grid tickmarks.
 */
const GRID_MAJOR_WIDTH : number = 1;

/**
 * GRID_MINOR_OFFSET
 *   Offset for minor grid ticks.
 */
const GRID_MINOR_OFFSET : number = 20;

/**
 * GRID_MINOR_COLOR
 *   Color of minor grid tickmarks.
 */
const GRID_MINOR_COLOR : string = "#c3c3c3";

/**
 * GRID_MINOR_STYLE
 *   Linestyle of minor grid tickmarks.
 */
const GRID_MINOR_STYLE : string = "dotted";

/**
 * GRID_MINOR_WIDTH
 *   Linewidth of minor grid tickmarks.
 */
const GRID_MINOR_WIDTH : number = 0.5;

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
const STICKY_DELAY : number = 500;

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

/**
 * NODE_FONT_FAMILY
 *   Font family of nodes.
 */
const NODE_FONT_FAMILY : string = "serif";

/**
 * NODE_FONT_SIZE
 *   Font size of nodes.
 */
const NODE_FONT_SIZE : number = 10;

/**
 * EDGE_FONT_FAMILY
 *   Font family of edges.
 */
const EDGE_FONT_FAMILY : string = "serif";

/**
 * EDGE_FONT_SIZE
 *   Font size of edges.
 */
const EDGE_FONT_SIZE : number = 10;

/**
 * EDGE_HIT_MARGIN
 *   Margin away from an edge for hit detection.
 */
const EDGE_HIT_MARGIN : number = 20;

/**
 * EDGE_DRAG_LINESTYLE
 *   Linestyle for dragging an edge.
 */
const EDGE_DRAG_LINESTYLE : string =  "dotted";

/**
 * SELECTION_COLOR
 *   Color for selection box and selection highlighting.
 */
const SELECTION_COLOR : string = "#00a2e8";

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
  backgroundColor : string;

  createNode(x? : number, y? : number) : DrawableNode
  /* contractually `src` -> `dest` will have been validated by 
  `canCreateEdge`, Graph implementations are not required to test this */
  createEdge(
    src : DrawableNode,
    dest : DrawableNode,
    like? : DrawableEdge
  ) : DrawableEdge
  /* contractually `original` will be in the list,
  this is not necessarily checked by implementations */
  replaceEdge(original : DrawableEdge, replacement : DrawableEdge) : void
  /* contractually `node` will be in the list,
  this is not necessarily checked by implementations */
  removeNode(node : DrawableNode) : void
  /* contractually `edge` will be in the list,
  this is not necessarily checked by implementations */
  removeEdge(edge : DrawableEdge) : void
  canCreateEdge(
    src : DrawableNode,
    dest : DrawableNode,
    like? : DrawableEdge
  ) : boolean 
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
  
  shape: string; // TODO: for now this only supports circles and squares.
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
export class GraphEditorComponent implements AfterViewInit, OnChanges {

  /**
   * selectionChanged
   *   An event emitter that is emitted when the selected items is changed.
   */
  @Output()
  selectionChanged = new EventEmitter();

  /**
   * graph
   *   Input property for the graph object.
   */
  @Input()
  graph : DrawableGraph;

  /**
   * graphEditorCanvas
   *   Reference to the canvas child element.
   */
  @ViewChild("sinapGraphEditorCanvas")
  graphEditorCanvas : ElementRef;

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
   * hoverObject
   *   The graph component over which the cursor is hovering.
   */
  private hoverObject : DrawableNode | DrawableEdge = null;

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
    this.g.msImageSmoothingEnabled = true;
    this.g.oImageSmoothingEnabled = true;
    // this.g.imageSmoothingEnabled = true;
    this.g.translate(0.5, 0.5);
    this.resize();
  }

  /**
   * ngOnChanges
   *   Updates the view when a bound property is changed.
   */
  ngOnChanges(changes : SimpleChanges) {
    for(let c in changes) {
      if(c == "graph" && this.g) {
        this.clearSelected();
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
    if(this.graph) {
      for(let n of this.graph.nodes)
        this.unselectedItems.add(n);
      for(let e of this.graph.edges)
        this.unselectedItems.add(e);
      this.selectionChanged.emit(
        new Set<Drawable>(this.selectedItems)
      );
    }
  }

  /**
   * onKeyDown
   *   Handles the delete key.
   * 
   * Note:
   *   I don't like where this is.
   */
  onKeyDown(e : KeyboardEvent) : void {
    // Delete keyCode is 46; backspace is 8.
    if(this.graph && (e.keyCode == 46 || e.keyCode == 8)) {
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
    if(this.graph && e.buttons == 1) {

      // Clear the hover object.
      this.hoverObject = null;

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
          if(!this.dragObject) {
            this.dragObject = this.graph.createNode(downPt.x, downPt.y);
            this.clearSelected();
            this.addSelectedItem(this.dragObject);
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
            this.dragObject.lineStyle = EDGE_DRAG_LINESTYLE;
            this.redraw();
            this.g.globalAlpha = 0.5;
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
    if(this.graph) {
      let ePt = getMousePt(this.g, e);

      // Capture the down event if the drag object has been set.
      if(this.dragObject && !this.downEvt)
        this.downEvt = e;

      // Make sure the mousedown event was previously captured.
      if(this.downEvt) {

        // Get the change in x and y locations of the cursor.
        let downPt = getMousePt(this.g, this.downEvt);
        let dx = downPt.x - ePt.x;
        let dy = downPt.y - ePt.y;

        // Reset waiting if waiting is still active and the mouse has moved too
        // far.
        if(this.isWaiting && (dx * dx + dy * dy > NUDGE * NUDGE)) {
          this.isWaiting = false;

          // Check the drag object.
          this.dragObject = this.hitTest(ePt.x, ePt.y);

          // Clear the selection if nothing was hit.
          if(!this.dragObject)
            this.clearSelected();
          
          // Clear the drag object if it is an edge.
          else if(this.dragObject.isEdge())
            this.dragObject = null;
        }

        // Update the canvas if waiting is not set.
        else if(!this.isWaiting) {

          // Update the selection box if selecting.
          if(!this.dragObject) {
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
            if(
              this.selectedItems.has(this.dragObject) &&
              this.selectedItems.size > 0
            ) {
              for(let o of this.selectedItems) {
                let dx = ePt.x - this.dragObject.x;
                let dy = ePt.y - this.dragObject.y;
                for(let o of this.selectedItems) {
                  if(o.isNode()) {
                    o.x += dx;
                    o.y += dy;
                  }
                }
              }
            }
            else {
              this.dragObject.x = ePt.x;
              this.dragObject.y = ePt.y;
            }
            this.redraw();
          }
        }
      }

      // Mouse hover
      else {
        let hit =  this.hitTest(ePt.x, ePt.y);
        if(hit !== this.hoverObject) {
          this.hoverObject = hit;
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
    if(this.graph && this.downEvt) {
      let ePt = getMousePt(this.g, e);

      // Set the selected graph component if waiting.
      if(this.isWaiting) {
        this.clearSelected();
        this.dragObject = this.hitTest(ePt.x, ePt.y);
      }

      // Set the selected graph component if none is set and the mouse is
      // hovering over a component.
      else if(!this.dragObject && this.hoverObject) {
        this.dragObject = this.hoverObject;
      }

      // Create the edge if one is being dragged.
      else if(this.dragObject && this.dragObject.isEdge()) {

        // Check that the mouse was released at a node.
        let hit = this.hitTest(ePt.x, ePt.y);
        if(hit && hit.isNode()) {

          // Move the edge if one is being dragged and it can be moved.
          if(
            this.moveEdge && 
            this.graph.canCreateEdge(this.dragObject.source, hit, this.moveEdge)
          ) {
            this.removeSelectedItem(this.moveEdge);
            this.graph.removeEdge(this.moveEdge);
            this.dragObject = this.graph.createEdge(
              this.dragObject.source, hit, this.moveEdge
            );
          }

          // Create a new edge if none is being moved and it can be created.
          else if(
            !this.moveEdge &&
            this.graph.canCreateEdge(this.dragObject.source, hit)
          ) {
            this.clearSelected();
            this.dragObject = 
              this.graph.createEdge(this.dragObject.source, hit);
          }
        }
      }

      // Drop the node if one is being dragged.
      else if(this.dragObject && this.dragObject.isNode()) {
        if(
          this.selectedItems.has(this.dragObject) &&
          this.selectedItems.size > 0
        ) {
          let dx = ePt.x - this.dragObject.x;
          let dy = ePt.y - this.dragObject.y;
          for(let o of this.selectedItems) {
            if(o.isNode()) {
              o.x += dx;
              o.y += dy;
            }
          }
        }
        else {
          //
          // TODO:
          // Pevent nodes from being dropped on top of eachother.
          //
          this.dragObject.x = ePt.x;
          this.dragObject.y = ePt.y;
        }
      }

      // Reset the selected item.
      if(this.dragObject && this.selectedItems.size < 2) {
        this.clearSelected();
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
          el.height = h * AA_SCALE;
          el.width = w * AA_SCALE;
          this.g.scale(AA_SCALE, AA_SCALE);
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
    clear(this.g, this.graph ? this.graph.backgroundColor : "AppWorkspace");
    if(this.graph) {
      drawGrid(this.g, this.gridOriginPt);
      for(let e of this.graph.edges)
        this.drawEdge(e);
      for(let n of this.graph.nodes)
        this.drawNode(n);

      if(this.hoverObject && this.hoverObject.isEdge()) {
        //
        // TODO:
        // Draw anchor points
        //
      }
    }
  }

  /**
   * drawNode
   *   Draws a node on the canvas.
   */
  private drawNode(n : DrawableNode) : void {

    // Calculate the radius.
    let lines = n.label.split("\n");
    let size = getTextSize(this.g, lines, NODE_FONT_FAMILY, NODE_FONT_SIZE);
    let s = (GRID_SPACING > size.h + 1.5 * NODE_FONT_SIZE ?
             GRID_SPACING : size.h + 1.5 * NODE_FONT_SIZE);
    s = (s < size.w + NODE_FONT_SIZE ? size.w + NODE_FONT_SIZE : s);

    // Draw selected shape.
    if(this.selectedItems.has(n)) {
      if(n.shape === "circle") {
        drawCircle(
          this.g,
          n.x, n.y,
          (s + n.borderWidth) / 2 + 2,
          "solid",
          n.borderWidth,
          SELECTION_COLOR,
          SELECTION_COLOR,
          (n === this.dragObject || n === this.hoverObject ?
           20 * AA_SCALE : null),
          (n === this.dragObject ? "#000" :
           (n === this.hoverObject ? SELECTION_COLOR : null))
        );
        drawCircle(
          this.g,
          n.x, n.y,
          s / 2,
          n.borderStyle,
          n.borderWidth,
          n.borderColor,
          n.color
        );
      }
      else if(n.shape === "square") {
        let hs = (s + n.borderWidth) / 2 + 2;
        drawSquare(
          this.g,
          n.x - hs,
          n.y - hs,
          2 * hs,
          2 * hs,
          "solid",
          n.borderWidth,
          SELECTION_COLOR,
          SELECTION_COLOR,
          (n === this.dragObject || n === this.hoverObject ?
           20 * AA_SCALE : null),
          (n === this.dragObject ? "#000" :
           (n === this.hoverObject ? SELECTION_COLOR : null))
        );
        hs = s / 2;
        drawSquare(
          this.g,
          n.x - hs, n.y - hs,
          hs * 2, hs * 2,
          n.borderStyle,
          n.borderWidth,
          n.borderColor,
          n.color
        );
      }
    }

    // Draw unselected shape.
    else {
      if(n.shape === "circle") {
        drawCircle(
          this.g,
          n.x, n.y,
          s / 2,
          n.borderStyle,
          n.borderWidth,
          n.borderColor,
          n.color,
          (n === this.dragObject || n === this.hoverObject ?
           20 * AA_SCALE : null),
          (n === this.dragObject ? "#000" :
            (n === this.hoverObject ? SELECTION_COLOR : null))
        );
      }
      else if(n.shape === "square") {
        let hs = s / 2;
        drawSquare(
          this.g,
          n.x - hs, n.y - hs,
          hs * 2, hs * 2,
          n.borderStyle,
          n.borderWidth,
          n.borderColor,
          n.color,
          (n === this.dragObject || n === this.hoverObject ?
           20 * AA_SCALE : null),
          (n === this.dragObject ? "#000" :
            (n === this.hoverObject ? SELECTION_COLOR : null))
        );
      }
    }

    // Label
    drawText(
      this.g,
      n.x, n.y - size.h / 2 + 1.5 * NODE_FONT_SIZE / 2,
      lines,
      NODE_FONT_SIZE,
      NODE_FONT_FAMILY,
      "#fff",
      2,
      "#000"
    );
  }

  /**
   * drawEdge
   *   Draws an edge on the canvas.
   */
  private drawEdge(e : DrawableEdge, x? : number, y? : number) : void {

    // Edge
    if(e === this.hoverObject) {
      this.g.shadowColor = SELECTION_COLOR;
      this.g.shadowBlur = 20 * AA_SCALE;
    }
    if(this.selectedItems.has(e)) {
      let d = cloneEdge(e);
      d.color = SELECTION_COLOR;
      d.lineStyle = "solid";
      d.lineWidth += 3;
      this.drawEdge(d);
    }
    if(e === this.moveEdge)
      this.g.globalAlpha = 0.3;
    this.g.strokeStyle = e.color;
    this.g.lineWidth = e.lineWidth;
    setLineStyle(this.g, e.lineStyle, e.lineWidth);
    if(x && y) {
      if(e.source)
        drawLine(this.g, e.source.x, e.source.y, x, y);
      else
        drawLine(this.g, x, y, e.destination.x, e.destination.y);
    }
    else {
      drawLine(this.g, e.source.x, e.source.y, e.destination.x, e.destination.y);
      if(e.showSourceArrow)
        drawArrow(this.g, e.destination, e.source);
      if(e.showDestinationArrow)
        drawArrow(this.g, e.source, e.destination);
    }
    this.g.globalAlpha = 1;

    // Label
    if(e.source && e.destination && e.label && e.label.trim() !== "") {
      let lines = e.label.split("\n");
      let size = getTextSize(this.g, lines, EDGE_FONT_FAMILY, EDGE_FONT_SIZE);
      let srcPt = getEdgeBorderPt(this.g, e.destination, e.source);
      let dstPt = getEdgeBorderPt(this.g, e.source, e.destination);
      let rect = makeRect(
        srcPt.x, srcPt.y,
        dstPt.x, dstPt.y
      );
      x = rect.x + rect.w / 2;
      y = rect.y + rect.h / 2;
      size.w /= 2;
      size.h /= 2;
      rect = makeRect(
        x - size.w - 6, y - size.h,
        x + size.w + 6, y + size.h);
      this.g.lineWidth = e.lineWidth;
      this.g.fillStyle = this.graph.backgroundColor;
      setLineStyle(this.g, e.lineStyle);
      this.g.lineJoin = "round";
      this.g.fillRect(rect.x, rect.y, rect.w, rect.h);
      this.g.shadowBlur = 0;
      this.g.strokeRect(rect.x, rect.y, rect.w, rect.h);
      drawText(
        this.g,
        x, y - size.h + 1.5 * EDGE_FONT_SIZE / 2,
        lines,
        EDGE_FONT_SIZE,
        EDGE_FONT_FAMILY,
        "#000"
      );
    }
    else
      this.g.shadowBlur = 0;
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
      let size = getTextSize(
        this.g,
        n.label.split("\n"),
        NODE_FONT_FAMILY,
        NODE_FONT_SIZE
      );
      let hs = (GRID_SPACING > size.h + 1.5 * NODE_FONT_SIZE ?
                GRID_SPACING : size.h + 1.5 * NODE_FONT_SIZE);
      hs = (hs < size.w + NODE_FONT_SIZE ? size.w + NODE_FONT_SIZE : hs) / 2;
      if((n.shape === "circle" && dx * dx + dy * dy <= hs * hs) ||
         (n.shape === "square" &&
          x <= n.x + hs && x >= n.x - hs && y <= n.y + hs && y >= n.y - hs))
        return n;
    }

    // Hit test edges.
    for(let e of this.graph.edges) {
      // Edge vector src -> dst
      let ve = [
        e.destination.x - e.source.x,
        e.destination.y - e.source.y,
      ];
      // Cursor vector e.src -> mouse
      let vm = [
        x - e.source.x,
        y - e.source.y
      ];
      let dotee = ve[0] * ve[0] + ve[1] * ve[1]; // edge dot edge
      let dotem = ve[0] * vm[0] + ve[1] * vm[1]; // edge dot mouse
      // Projection vector mouse -> edge
      let p = [
        ve[0] * dotem / dotee,
        ve[1] * dotem / dotee
      ];
      // Rejection vector mouse -^ edge
      let r = [
        vm[0] - p[0],
        vm[1] - p[1]
      ];

      let dotpp = p[0] * p[0] + p[1] * p[1]; // proj dot proj
      let dotrr = r[0] * r[0] + r[1] * r[1]; // rej dot rej

      let dep = [
        ve[0] - p[0],
        ve[1] - p[1]
      ];
      let dotdep = dep[0] * dep[0] + dep[1] * dep[1];

      if(dotpp <= dotee &&
         dotdep <= dotee &&
         dotrr < e.lineWidth * e.lineWidth + EDGE_HIT_MARGIN * EDGE_HIT_MARGIN)
        return e;
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
  let r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / (r.right - r.left) * canvas.width / AA_SCALE,
    y: (e.clientY - r.top) / (r.bottom - r.top) * canvas.height / AA_SCALE
  };
}

/**
 * getEdgeBorderPt
 *   Gets the point were the edge intersects the border of the specified
 *   destination node.
 */
function getEdgeBorderPt(
  g : CanvasRenderingContext2D,
  src : DrawableNode,
  dst : DrawableNode
) {

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

  // Get destination node radius.
  let lines = dst.label.split("\n");
  let size = getTextSize(g, lines, NODE_FONT_FAMILY, NODE_FONT_SIZE);
  let r = (size.h + 1.5 * NODE_FONT_SIZE > size.w + NODE_FONT_SIZE ?
            size.h + 1.5 * NODE_FONT_SIZE : size.w + NODE_FONT_SIZE);
  r = (GRID_SPACING > r ? GRID_SPACING : r);
  r /= 2;

  // Get the distance from src to dst.
  let d = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

  // Get the unit vector from src to dst.
  let u = [
    v[0] / d,
    v[1] / d
  ];

  // Extend the radius if the shape is a square.
  if(dst.shape === "square") {
    let up = [
      (u[0] < 0 ? -u[0] : u[0]),
      (u[1] < 0 ? -u[1] : u[1])
    ];
    if(up[0] < up[1]) {
      let ratio = up[0] /up[1];
      let b = r / up[1];
      let a = ratio * up[0];
      r = Math.sqrt(a * a + b * b);
    }
    else {
      let ratio = up[1] / up[0];
      let a = r / up[0];
      let b = ratio * up[1];
      r = Math.sqrt(a * a + b * b);
    }
  }

  // Get the point where the edge meets the node border.
  v[0] = u[0] * (d - r) + src.x;
  v[1] = u[1] * (d - r) + src.y;

  return { x: v[0], y: v[1], u: u };

}

/**
 * getTextSize
 *   Gets the bounding box of text.
 */
function getTextSize(
  g : CanvasRenderingContext2D,
  lines : Array<string>,
  fontFamily : string,
  fontSize : number
) {
  g.font = fontSize + "pt " + fontFamily;
  let textHeight = lines.length * 1.5 * fontSize;
  let textWidth = 0;
  for(let l = 0; l < lines.length; l++) {
    let tw = g.measureText(lines[l]).width;
    if(textWidth < tw)
      textWidth = tw;
  }
  return { h: textHeight, w: textWidth };
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
  if(!dotSize)
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
 * clear
 *   Clears the canvas.
 */
function clear(g : CanvasRenderingContext2D, bgColor) : void {
  let canvas = g.canvas;
  let w = canvas.width;
  let h = canvas.height;
  g.fillStyle = bgColor;
  g.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * drawSelectionBox
 *   Draws the selection box.
 */
function drawSelectionBox(g : CanvasRenderingContext2D, rect) : void {
  g.strokeStyle = SELECTION_COLOR;
  g.fillStyle = SELECTION_COLOR;
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

  let pt = getEdgeBorderPt(g, src, dst);

  // Draw arrow.
  drawLine(
    g,
    pt.x, pt.y,
    pt.x + GRID_SPACING * (pt.u[0] * COS_THETA - pt.u[1] * SIN_THETA) / 2,
    pt.y + GRID_SPACING * (pt.u[0] * SIN_THETA + pt.u[1] * COS_THETA) / 2
  );
  drawLine(
    g,
    pt.x, pt.y,
    pt.x + GRID_SPACING * (pt.u[0] * COS_THETA + pt.u[1] * SIN_THETA) / 2,
    pt.y + GRID_SPACING * (-pt.u[0] * SIN_THETA + pt.u[1] * COS_THETA) / 2
  );

}

/**
 * drawCircle
 *   Draws a circle.
 */
function drawCircle(
  g : CanvasRenderingContext2D,
  x : number,
  y : number,
  r : number,
  borderStyle : string,
  borderWidth : number,
  borderColor : string,
  fillColor : string,
  shadowBlur? : number,
  shadowColor? : string
) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = fillColor;
  if(shadowBlur && shadowColor) {
    g.shadowBlur = shadowBlur;
    g.shadowColor = shadowColor;
  }
  g.fill();
  g.shadowBlur = 0;
  if(borderWidth > 0) {
    setLineStyle(g, borderStyle, borderWidth);
    g.lineWidth = borderWidth;
    g.strokeStyle = borderColor;
    g.stroke();
  }
}

/**
 * drawSquare
 *   Draws a square.
 */
function drawSquare(
  g : CanvasRenderingContext2D,
  x : number,
  y : number,
  w : number,
  h : number,
  borderStyle : string,
  borderWidth : number,
  borderColor : string,
  fillColor : string,
  shadowBlur? : number,
  shadowColor? : string
) {
  g.fillStyle = fillColor;
  if(shadowBlur && shadowColor) {
    g.shadowBlur = shadowBlur;
    g.shadowColor = shadowColor;
  }
  g.fillRect(x, y, w, h);
  g.shadowBlur = 0;
  if(borderWidth > 0) {
    setLineStyle(g, borderStyle, borderWidth);
    g.lineWidth = borderWidth;
    g.strokeStyle = borderColor;
    g.strokeRect(x, y, w, h);
  }
}

/**
 * drawGrid
 *   Draws the editor grid.
 */
function drawGrid(g : CanvasRenderingContext2D, originPt) {

  let w = g.canvas.width;
  let h = g.canvas.height;

  for(
    let x = originPt.x % GRID_SPACING - GRID_SPACING;
    x < w + GRID_SPACING; 
    x += GRID_SPACING
  ) {
    g.strokeStyle = GRID_MAJOR_COLOR;
    g.lineWidth = GRID_MAJOR_WIDTH;
    setLineStyle(g, GRID_MAJOR_STYLE);
    drawLine(g, x, 0, x, h);
    g.strokeStyle = GRID_MINOR_COLOR;
    g.lineWidth = GRID_MINOR_WIDTH;
    setLineStyle(g, GRID_MINOR_STYLE);
    drawLine(g, x + GRID_MINOR_OFFSET, 0, x + GRID_MINOR_OFFSET, h);
  }
  for(
    let y = originPt.y % GRID_SPACING - GRID_SPACING;
    y < h + GRID_SPACING;
    y += GRID_SPACING
  ) {
    g.strokeStyle = GRID_MAJOR_COLOR;
    g.lineWidth = GRID_MAJOR_WIDTH;
    setLineStyle(g, GRID_MAJOR_STYLE);
    drawLine(g, 0, y, w, y);
    g.strokeStyle = GRID_MINOR_COLOR;
    g.lineWidth = GRID_MINOR_WIDTH;
    setLineStyle(g, GRID_MINOR_STYLE);
    drawLine(g, 0, y + GRID_MINOR_OFFSET, w, y + GRID_MINOR_OFFSET);
  }

}

/**
 * drawText
 *   Draws text.
 */
function drawText(
  g : CanvasRenderingContext2D,
  x : number,
  y : number,
  lines : Array<string>,
  fontSize : number,
  fontFamily : string,
  color : string,
  borderWidth? : number,
  borderColor? : string
) {
    g.font = fontSize + "pt " + fontFamily;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = color;
    if(borderWidth && borderColor) {
      g.lineWidth = 2;
      g.strokeStyle = "#000";
      setLineStyle(g, "solid");
      for(let l = 0; l < lines.length; l++) {
        g.strokeText(lines[l], x, y);
        g.fillText(lines[l], x, y);
        y += 1.5 * fontSize;
      }
    }
    else {
      for(let l = 0; l < lines.length; l++) {
        g.fillText(lines[l], x, y);
        y += 1.5 * fontSize;
      }
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
  clone.shape = n.shape;
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
  shape: string = "circle";
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
