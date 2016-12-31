// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
//
// Notes:
//
// For deleting graph components, it would be better to have a global keybinding
// with the keybind activation event calling some method to delete the selected
// components. It may be better to have such functionality outside of the
// graph editor component.
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
// Discussion:
// - Special drawing start/final nodes should be the concern of the plugin;
//   the graph editor should not have to be aware of _any_ type information or
//   behavior properties of any of the drawable elements.
// - Should drawable interfaces have optional properties/methods?
// - backgroundColor should not be a property of a DrawableGraph; it should be
//   a property of the graph editor component.
//
//
// TODO:
// - Consider mapping drawable components to draw functions.
// - Zoom and Pan
//   pinch to zoom/two-touch drag to pan
// - Snap to grid.
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
// - Text location options. [Maybe]
//   - Top, Left, Bottom, Right, Center
//   - Inside, Outside, Center
// - Consolidate code duplication.
//
//


// Imports /////////////////////////////////////////////////////////////////////


import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
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
 * COS_150  
 *   Used in the rotation matrix for drawing edge arrows.
 */
const COS_150 : number = Math.cos(5 * Math.PI / 6);

/**
 * SIN_150  
 *   Used in the rotation matrix for drawing edge arrows.
 */
const SIN_150 : number = Math.sin(5 * Math.PI / 6);

/**
 * NODE_DEFAULTS  
 *   Default property values for drawable nodes.
 */
const NODE_DEFAULTS : DrawableNode = {
  x : 0,
  y : 0,
  label : "",
  shape: "circle",
  color : "#fff200",
  borderColor : "#000",
  borderStyle : "solid",
  borderWidth : 1
};

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
 * NODE_DRAG_SHADOW_COLOR  
 *   Shadow color of dragging nodes.
 */
const NODE_DRAG_SHADOW_COLOR : string = "#000";

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
 * EDGE_DEFAULTS
 *   Default property values for drawable edges.
 */
const EDGE_DEFAULTS : DrawableEdge = {
  source : null,
  destination : null,
  label : "",
  color : "#000",
  lineStyle : "solid",
  lineWidth : 2,
  showDestinationArrow : false,
  showSourceArrow : false
};

/**
 * SELECTION_COLOR  
 *   Color for selection box and selection highlighting.
 */
const SELECTION_COLOR : string = "#3af";


// Public functions ////////////////////////////////////////////////////////////


/**
 * isDrawableEdge  
 *   Typeguard for drawable edges.
 */
export function isDrawableEdge(obj : any) : obj is DrawableEdge {
  return isItThat(obj, EDGE_DEFAULTS);
}


/**
 * isDrawableNode  
 *   Typeguard for drawable nodes.
 */
export function isDrawableNode(obj : any) : obj is DrawableNode {
  return isItThat(obj, NODE_DEFAULTS);
}


// Public interfaces ///////////////////////////////////////////////////////////

/**
 * DrawableGraph  
 *   Interface that exposes drawable graph properties and methods.
 */
export interface DrawableGraph {

  /**
   * nodes  
   *   The collection of drawable nodes that are part of the graph.
   */
  readonly nodes : Iterable<DrawableNode>;

  /**
   * edges  
   *   The collection of drawable edges that are part of the graph.
   */
  readonly edges : Iterable<DrawableEdge>;

  /**
   * backgroundColor  
   *   What is this doing here? It should be a public property of the graph
   *   editor component.
   */
  backgroundColor : string;

  /**
   * createNode  
   *   Creates a drawable node with an optional position.
   */
  createNode(x? : number, y? : number) : DrawableNode;

  /**
   * removeNode  
   *   Guarantees that the given node is not present in the graph.
   */
  removeNode(node : DrawableNode) : void;

  /**
   * canCreateEdge  
   *   Checks if a drawable edge can be created with the given source and
   *   destination nodes.
   * 
   *   If `like` is specified, a drawable edge with a matching type of `like` is
   *   is checked against the given source and destination nodes.
   * 
   *   This method must be called before calling `createEdge`.
   */
  canCreateEdge(
    src : DrawableNode,
    dst : DrawableNode,
    like? : DrawableEdge
  ) : boolean;

  /**
   * createEdge  
   *   Creates a drawable edge with a source and destination node.
   * 
   *   If `like` is specified, a drawable edge with a matching type of `like` is
   *   created.
   * 
   *   The `canCreateEdge` method must be called to check if creating the edge
   *   is valid.
   */
  createEdge(
    src : DrawableNode,
    dst : DrawableNode,
    like? : DrawableEdge
  ) : DrawableEdge;

  /**
   * replaceEdge  
   *   This method has been replaced by `createEdge` and is no longer needed.
   */
  replaceEdge(original : DrawableEdge, replacement : DrawableEdge) : void;

  /**
   * removeEdge  
   *   Guarantees that the given edge is not present in the graph.
   */
  removeEdge(edge : DrawableEdge) : void;

}

/**
 * DrawableEdge  
 *   Interface that exposes drawable edge properties.
 */
export interface DrawableEdge {

  /**
   * source  
   *   The source node of the edge.
   */
  source : DrawableNode;

  /**
   * destination  
   *   The destination node of the edge.
   */
  destination : DrawableNode;

  /**
   * showSourceArrow  
   *   True to draw an arrow pointing to the source node; otherwise, false.
   */
  showSourceArrow : boolean;

  /**
   * showDestinationArrow  
   *   True to draw an arrow pointing to the destination node; otherwise, false.
   */
  showDestinationArrow : boolean;

  /**
   * color  
   *   The color of the edge. This can be any valid `CSS` color string.
   */
  color : string;

  /**
   * lineStyle  
   *   The line style of the edge. This can be `solid`, `dotted`, or `dashed`.
   */
  lineStyle : string;

  /**
   * lineWidth  
   *   The width of the edge. This value must be non-negative.
   */
  lineWidth : number;

  /**
   * label  
   *   The text label to be displayed by the edge.
   */
  label : string;

  // TODO:
  // more display properties.
}

/**
 * DrawableNode  
 *   Interface that exposes drawable node properties.
 */
export interface DrawableNode {

  /**
   * x  
   *   The x-coordinate of the center of the node.
   */
  x : number;

  /**
   * y  
   *   The y-coordinate of the center of the node.
   */
  y : number;

  /**
   * label  
   *   The text label to be displayed in the node.
   */
  label : string;
  
  /**
   * shape  
   *   The shape of the node.
   */
  shape: string; // TODO: for now this only supports circles and squares.

  /**
   * color  
   *   The background color of the node.  Can be any valid `CSS` color string.
   */
  color : string;

  /**
   * borderColor  
   *   The border color of the node.  Can be any valid `CSS` color string.
   */
  borderColor: string;

  /**
   * borderStyle  
   *   The line style of the border. Can be `solid`, `dotted`, or `dashed`.
   */
  borderStyle: string;

  /**
   * borderWidth  
   *   The line width of the border. Set to 0 to draw no border; value must be
   *   non-negative.
   */
  borderWidth: number;

  // TODO:
  // more display properties
}


/**
 * Drawable  
 *   Type alias for the the union type of `DrawableEdge` and `DrawableNode`.
 */
type Drawable = DrawableEdge | DrawableNode;


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
export class GraphEditorComponent implements AfterViewInit {

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
  @Input("graph")
  set setGraph(value : DrawableGraph) {
    this.graph = value;
    if(this.g) {
      // TODO:
      // The graph object should keep track of its selected items.
      this.clearSelected();
      this.redraw();
    }
  }

  /**
   * dragNode  
   *   Sets the node being dragged by the cursor.
   */
  @Input()
  dragNode(value : DrawableNode) {
    this.dragObject = value;
  }

  /**
   * graphEditorCanvas  
   *   Reference to the canvas child element.
   */
  @ViewChild("sinapGraphEditorCanvas")
  graphEditorCanvas : ElementRef;

  /**
   * graph  
   *   The graph object.
   */
  private graph : DrawableGraph = null;

  /**
   * g  
   *   The 2D graphics rendering context from the canvas element.
   */
  private g : CanvasRenderingContext2D = null;

  /**
   * gridOriginPt  
   *   The coordinates of the grid origin.
   */
  private gridOriginPt : number[] = [ 0, 0 ];

  /**
   * downEvt  
   *   The previous mousedown event payload.
   */
  private downEvt : MouseEvent = null;

  /**
   * stickyTimeout  
   *   Timer reference for the sticky delay.
   */
  private stickyTimeout : NodeJS.Timer = null;

  /**
   * dragObect  
   *   The graph component being dragged by the cursor.
   */
  private dragObject : Drawable = null;

  /**
   * hoverObject  
   *   The graph component over which the cursor is hovering.
   */
  private hoverObject : Drawable = null;

  /**
   * moveEdge  
   *   The edge to be replaced once the new edge has been created.
   */
  private moveEdge : DrawableEdge = null;

  /**
   * selectedItems  
   *   The set of selected graph components.
   */
  private selectedItems : Set<Drawable> = new Set<Drawable>();

  /**
   * unselectedItems  
   *   The set of unselected graph components.
   */
  private unselectedItems : Set<Drawable> = new Set<Drawable>();

  /**
   * ngAfterViewInit  
   *   Gets the canvas rendering context and resizes the canvas element.
   */
  ngAfterViewInit() {
    this.g = this.graphEditorCanvas.nativeElement.getContext("2d");
    this.g.mozImageSmoothingEnabled = true;
    this.g.msImageSmoothingEnabled = true;
    this.g.oImageSmoothingEnabled = true;
    this.resize();
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
        if(isDrawableEdge(ele))
          edges.add(ele);
        else if(isDrawableNode(ele))
          nodes.add(ele);
      }
      let unselectedEdges = [...this.graph.edges].filter(x => !edges.has(x));

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

      // Set a timeout.
      this.stickyTimeout = setTimeout(() => {

        // Set the drag object and reset sticky.
        let downPt = getMousePt(this.g, this.downEvt);
        clearTimeout(this.stickyTimeout);
        this.stickyTimeout = null;
        this.dragObject = this.hitTest(downPt);

        // Create a new node and set it as the drag object if no drag object
        // was set.
        if(!this.dragObject) {
          this.dragObject = this.graph.createNode(downPt[0], downPt[1]);
          this.clearSelected();
          this.addSelectedItem(this.dragObject);
          this.redraw();
        }

        // Set the drag object to some dummy edge and the replace edge to the
        // original drag object if the drag object was an edge.
        else if(isDrawableEdge(this.dragObject)) {
          //
          // TODO:
          // Determine which side of the edge the hit test landed on.
          //
          this.moveEdge = this.dragObject;
          this.dragObject = cloneEdge(this.moveEdge);
          this.dragObject.lineStyle = EDGE_DRAG_LINESTYLE;
          this.redraw();
          this.g.globalAlpha = 0.5;
          this.drawEdge(this.dragObject, downPt[0], downPt[1]);
          this.g.globalAlpha = 1;
        }

        // Create a new dummy edge with the source node as the drag object.
        else if(isDrawableNode(this.dragObject)) {
          this.dragObject = new DummyEdge(this.dragObject);
          this.dragObject.lineStyle = EDGE_DRAG_LINESTYLE;
          this.redraw();
          this.g.globalAlpha = 0.3;
          this.drawEdge(this.dragObject, downPt[0], downPt[1]);
          this.g.globalAlpha = 1;
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
        let dx = downPt[0] - ePt[0];
        let dy = downPt[1] - ePt[1];

        // Reset waiting if waiting is still active and the mouse has moved too
        // far.
        if(this.stickyTimeout && (dx * dx + dy * dy > NUDGE * NUDGE)) {
          clearTimeout(this.stickyTimeout);
          this.stickyTimeout = null;

          // Check the drag object.
          this.dragObject = this.hitTest(ePt);

          // Clear the selection if nothing was hit.
          if(!this.dragObject)
            this.clearSelected();
          
          // Clear the drag object if it is an edge.
          else if(isDrawableEdge(this.dragObject))
            this.dragObject = null;
        }

        // Update the canvas if waiting is not set.
        else if(!this.stickyTimeout) {

          // Update the selection box if selecting.
          if(!this.dragObject) {
            let rect = makeRect(downPt[0], downPt[1], ePt[0], ePt[1]);

            // Update the selected components.
            for(let i of this.selectedItems) {
              if(!this.rectHitTest(i, rect))
                moveItem(this.selectedItems, this.unselectedItems, i);
            }
            for(let i of this.unselectedItems) {
              if(this.rectHitTest(i, rect))
                moveItem(this.unselectedItems, this.selectedItems, i);
            }
            this.selectionChanged.emit(new Set<Drawable>(
              this.selectedItems
            ));
    
            // Update the canvas.
            this.redraw();
            drawSelectionBox(this.g, rect);
          }

          // Update edge endpoint if dragging edge.
          else if(isDrawableEdge(this.dragObject)) {
            this.redraw();
            this.g.globalAlpha = 0.3;
            this.drawEdge(this.dragObject, ePt[0], ePt[1]);
            this.g.globalAlpha = 1;
          }

          // Update node position if dragging node.
          else if(isDrawableNode(this.dragObject)) {
            if(
              this.selectedItems.has(this.dragObject) &&
              this.selectedItems.size > 0
            ) {
              for(let o of this.selectedItems) {
                let dx = ePt[0] - this.dragObject.x;
                let dy = ePt[1] - this.dragObject.y;
                for(let o of this.selectedItems) {
                  if(isDrawableNode(o)) {
                    o.x += dx;
                    o.y += dy;
                  }
                }
              }
            }
            else {
              this.dragObject.x = ePt[0];
              this.dragObject.y = ePt[1];
            }
            this.redraw();
          }
        }
      }

      // Mouse hover
      else {
        let hit =  this.hitTest(ePt);
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
      if(this.stickyTimeout) {
        this.clearSelected();
        this.dragObject = this.hitTest(ePt);
      }

      // Set the selected graph component if none is set and the mouse is
      // hovering over a component.
      else if(!this.dragObject && this.hoverObject) {
        this.dragObject = this.hoverObject;
      }

      // Create the edge if one is being dragged.
      else if(isDrawableEdge(this.dragObject)) {

        // Check that the mouse was released at a node.
        let hit = this.hitTest(ePt);
        if(isDrawableNode(hit)) {

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
      else if(isDrawableNode(this.dragObject)) {
        if(
          this.selectedItems.has(this.dragObject) &&
          this.selectedItems.size > 0
        ) {
          let dx = ePt[0] - this.dragObject.x;
          let dy = ePt[1] - this.dragObject.y;
          for(let o of this.selectedItems) {
            if(isDrawableNode(o)) {
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
          this.dragObject.x = ePt[0];
          this.dragObject.y = ePt[1];
        }
      }

      // Reset the selected item.
      if(this.dragObject && this.selectedItems.size < 2) {
        this.clearSelected();
        this.addSelectedItem(this.dragObject);
      }

      // Reset input states.
      clearTimeout(this.stickyTimeout);
      this.stickyTimeout = null;
      this.downEvt = null;
      this.dragObject = null;
      this.moveEdge = null;

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
    el.height = h * AA_SCALE;
    el.width = w * AA_SCALE;
    this.g.scale(AA_SCALE, AA_SCALE);
    this.redraw();
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

      if(isDrawableEdge(this.hoverObject)) {
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
          (n === this.dragObject ? NODE_DRAG_SHADOW_COLOR :
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
          (n === this.dragObject ? NODE_DRAG_SHADOW_COLOR :
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
          (n === this.dragObject ? NODE_DRAG_SHADOW_COLOR :
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
          (n === this.dragObject ? NODE_DRAG_SHADOW_COLOR :
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
    this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
  }

  /**
   * removeSelectedItem  
   *   Removes an item from the selected items set.
   */
  private removeSelectedItem(item : Drawable) {
    moveItem(this.selectedItems, this.unselectedItems, item);
    this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
  }

  /**
   * hitTest  
   *   Gets the first graph component that is hit by a point.
   * 
   * <p>
   *   Nodes take priority over edges.
   * </p>
   */
  private hitTest(pt : number[]) : Drawable {

    // Hit test nodes first.
    for(let n of this.graph.nodes) {
      let dx = n.x - pt[0];
      let dy = n.y - pt[1];
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
          pt[0] <= n.x + hs && pt[0] >= n.x - hs &&
          pt[1] <= n.y + hs && pt[1] >= n.y - hs))
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
        pt[0] - e.source.x,
        pt[1] - e.source.y
      ];
      let dotee = dot(ve, ve); // edge dot edge
      let dotem = dot(ve, vm); // edge dot mouse
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

      let dotpp = dot(p, p); // proj dot proj
      let dotrr = dot(r, r); // rej dot rej

      let dep = [
        ve[0] - p[0],
        ve[1] - p[1]
      ];
      let dotdep = dot(dep, dep);

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
  private rectHitTest(c : Drawable, rect) : boolean {
    return (isDrawableNode(c) &&
            c.x >= rect.x && c.x <= rect.x + rect.w &&
            c.y >= rect.y && c.y <= rect.y + rect.h) ||
           (isDrawableEdge(c) && (this.rectHitTest(c.source, rect) ||
            this.rectHitTest(c.destination, rect)));
  }

}


// Static functions ////////////////////////////////////////////////////////////


/**
 * getMousePt  
 *   Gets the canvas coordinates from a mouse event.
 */
function getMousePt(g : CanvasRenderingContext2D, e: MouseEvent) : number[] {
  let canvas = g.canvas;
  let r = canvas.getBoundingClientRect();
  return [
    (e.clientX - r.left) / (r.right - r.left) * canvas.width / AA_SCALE,
    (e.clientY - r.top) / (r.bottom - r.top) * canvas.height / AA_SCALE
  ];
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
  let d = magnitude(v);

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
      let ratio = up[0] / up[1];
      let b = r / up[1];
      let a = ratio * up[0];
      r = magnitude([ a, b ]);
    }
    else {
      let ratio = up[1] / up[0];
      let a = r / up[0];
      let b = ratio * up[1];
      r = magnitude([ a, b ]);
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
  setLineStyle(g, "solid");
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
 * drawQuadraticLine  
 *   Draws a quadratic line between two points.
 */
function drawQuadraticLine(
  g : CanvasRenderingContext2D,
  x1 : number, y1 : number,
  x2 : number, y2 : number
) : void {

  // Get the vector from point 1 to point 2.
  let v = [
    x2 - x1,
    y2 - y1
  ];

  // Get the magnitude of the vector.
  let d = magnitude(v);

  // Get the normal of the vector, rotated 180 degrees.
  let n = [
    v[1] / d,
    -v[0] / d
  ];

  // Draw the quadric curve.
  g.beginPath();
  g.moveTo(x1, y1);
  g.quadraticCurveTo(
    x1 + v[0] / 2 + n[0] * GRID_SPACING, y1 + v[1] / 2 + n[1] * GRID_SPACING,
    x2, y2
  );
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
    pt.x + GRID_SPACING * (pt.u[0] * COS_150 - pt.u[1] * SIN_150) / 2,
    pt.y + GRID_SPACING * (pt.u[0] * SIN_150 + pt.u[1] * COS_150) / 2
  );
  drawLine(
    g,
    pt.x, pt.y,
    pt.x + GRID_SPACING * (pt.u[0] * COS_150 + pt.u[1] * SIN_150) / 2,
    pt.y + GRID_SPACING * (-pt.u[0] * SIN_150 + pt.u[1] * COS_150) / 2
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
function drawGrid(g : CanvasRenderingContext2D, originPt : number[]) {

  let w = g.canvas.width;
  let h = g.canvas.height;

  for(
    let x = originPt[0] % GRID_SPACING - GRID_SPACING;
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
    let y = originPt[1] % GRID_SPACING - GRID_SPACING;
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
 * isItThat  
 *   Checks if `it` has the same members as `that`.
 */
function isItThat(it : any, that : any) : boolean {
  if(!it)
    return false;
  let result = true;
  for(let p in that) {
    result =
      result &&
      (p in it) &&
      (typeof that[p] === typeof it[p]);
    if(!result)
      return false;
  }
  return result;
}

/**
 * dot  
 *   Calculates the dot product of two vectors.
 */
function dot(a : number[], b : number[]) : number {
  console.assert(
    a.length === b.length,
    "error dot: a and b must be of equal length."
  );
  let result = 0;
  for(let i = 0; i < a.length; i++)
    result += a[i] * b[i];
  return result;
}

/**
 * magnitude  
 *   Calculates the magnitude of a vector.
 */
function magnitude(v) : number {
  return Math.sqrt(dot(v, v));
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
  let clone = new DummyNode(n.x, n.y);
  clone.label = n.label;
  clone.shape = n.shape;
  clone.color = n.color;
  clone.borderColor = n.borderColor;
  clone.borderStyle = n.borderStyle;
  clone.borderWidth = n.borderWidth;
  return clone;
}


// Static classes //////////////////////////////////////////////////////////////

/**
 * DummyNode  
 *   Creates a dummy node with default properties.
 */
class DummyNode implements DrawableNode {
  label : string = NODE_DEFAULTS.label;
  shape: string = NODE_DEFAULTS.shape;
  color : string = NODE_DEFAULTS.color;
  borderColor : string = NODE_DEFAULTS.borderColor;
  borderStyle : string = NODE_DEFAULTS.borderStyle;
  borderWidth : number = NODE_DEFAULTS.borderWidth;

  constructor(public x : number, public y : number) { }
}

/**
 * DummyEdge  
 *   Creates a dummy edge with default properties.
 */
class DummyEdge implements DrawableEdge {
  source : DrawableNode = EDGE_DEFAULTS.source;
  destination : DrawableNode = EDGE_DEFAULTS.destination;
  showSourceArrow : boolean = EDGE_DEFAULTS.showSourceArrow;
  showDestinationArrow : boolean = EDGE_DEFAULTS.showDestinationArrow;
  color : string = EDGE_DEFAULTS.color;
  lineStyle : string = EDGE_DEFAULTS.lineStyle;
  lineWidth : number = EDGE_DEFAULTS.lineWidth;
  label = EDGE_DEFAULTS.label;

  constructor(sourceNode : DrawableNode = EDGE_DEFAULTS.source) {
    this.source = sourceNode;
  }
}
