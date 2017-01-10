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

import * as CONST from "./constants";
import * as Drawables from "./drawable-interfaces";
import * as MathEx from "./math";
import * as Draw from "./draw";


// Re-exports //////////////////////////////////////////////////////////////////


export {
  DrawableGraph,
  DrawableEdge,
  DrawableNode,
  isDrawableEdge,
  isDrawableNode
} from "./drawable-interfaces";


// Type aliases ////////////////////////////////////////////////////////////////


/**
 * Drawable  
 *   Type alias for the the union type of `DrawableEdge` and `DrawableNode`.
 */
type Drawable = Drawables.DrawableEdge | Drawables.DrawableNode;


// Graph Editor Angular Component //////////////////////////////////////////////


@Component({
  selector: "sinap-graph-editor",
  templateUrl: "./graph-editor.component.html",
  styleUrls: [
    "./graph-editor.component.css"
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
  set setGraph(value : Drawables.DrawableGraph) {
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
  dragNode(value : Drawables.DrawableNode) {
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
  private graph : Drawables.DrawableGraph;

  /**
   * g  
   *   The 2D graphics rendering context from the canvas element.
   */
  private g : CanvasRenderingContext2D;

  /**
   * gridOriginPt  
   *   The coordinates of the grid origin.
   */
  private gridOriginPt : number[] = [ 0, 0 ];

  /**
   * downEvt  
   *   The previous mousedown event payload.
   */
  private downEvt : MouseEvent | null = null;

  /**
   * stickyTimeout  
   *   Timer reference for the sticky delay.
   */
  private stickyTimeout : NodeJS.Timer | number | null = null;

  /**
   * dragObect  
   *   The graph component being dragged by the cursor.
   */
  private dragObject : Drawable | null = null;

  /**
   * hoverObject  
   *   The graph component over which the cursor is hovering.
   */
  private hoverObject : Drawable | null = null;

  /**
   * moveEdge  
   *   The edge to be replaced once the new edge has been created.
   */
  private moveEdge : Drawables.DrawableEdge | null = null;

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
  private onKeyDown(e : KeyboardEvent) : void {
    // Delete keyCode is 46; backspace is 8.
    if(this.graph && (e.keyCode == 46 || e.keyCode == 8)) {
      let edges = new Set<Drawables.DrawableEdge>();
      let nodes = new Set<Drawables.DrawableNode>();
      for (let ele of this.selectedItems){
        if(Drawables.isDrawableEdge(ele))
          edges.add(ele);
        else if(Drawables.isDrawableNode(ele))
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
  private onMouseDown(e : MouseEvent) : void {

    // Make sure only the left mouse button is down.
    if(this.graph && e.buttons == 1) {

      // Clear the hover object.
      this.hoverObject = null;

      // Save mouse click canvas coordinates and set waiting to true.
      this.downEvt = e;

      // Set a timeout.
      this.stickyTimeout = setTimeout(() => {

        // Set the drag object and reset sticky.
        if(this.downEvt) {
          let downPt = getMousePt(this.g, this.downEvt);
          clearTimeout(this.stickyTimeout as NodeJS.Timer);
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
          else if(Drawables.isDrawableEdge(this.dragObject)) {
            //
            // TODO:
            // Determine which side of the edge the hit test landed on.
            //
            this.moveEdge = this.dragObject;
            this.dragObject = Drawables.cloneEdge(this.moveEdge);
            this.dragObject.lineStyle = CONST.EDGE_DRAG_LINESTYLE;
            this.redraw();
            this.g.globalAlpha = 0.5;
            this.drawEdge(this.dragObject, downPt[0], downPt[1]);
            this.g.globalAlpha = 1;
          }

          // Create a new dummy edge with the source node as the drag object.
          else if(Drawables.isDrawableNode(this.dragObject)) {
            this.dragObject = new Drawables.DummyEdge(this.dragObject);
            this.dragObject.lineStyle = CONST.EDGE_DRAG_LINESTYLE;
            this.redraw();
            this.g.globalAlpha = 0.3;
            this.drawEdge(this.dragObject, downPt[0], downPt[1]);
            this.g.globalAlpha = 1;
          }
        }
      }, CONST.STICKY_DELAY);
    }
  }

  /**
   * onMouseMove  
   *   Handles the mousemove event.
   */
  private onMouseMove(e : MouseEvent) : void {
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
        if(
          this.stickyTimeout &&
          (dx * dx + dy * dy > CONST.NUDGE * CONST.NUDGE)
        ) {
          clearTimeout(this.stickyTimeout as NodeJS.Timer);
          this.stickyTimeout = null;

          // Check the drag object.
          this.dragObject = this.hitTest(ePt);

          // Clear the selection if nothing was hit.
          if(!this.dragObject)
            this.clearSelected();
          
          // Clear the drag object if it is an edge.
          else if(Drawables.isDrawableEdge(this.dragObject))
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
            Draw.drawSelectionBox(this.g, rect);
          }

          // Update edge endpoint if dragging edge.
          else if(Drawables.isDrawableEdge(this.dragObject)) {
            this.redraw();
            this.g.globalAlpha = 0.3;
            this.drawEdge(this.dragObject, ePt[0], ePt[1]);
            this.g.globalAlpha = 1;
          }

          // Update node position if dragging node.
          else if(Drawables.isDrawableNode(this.dragObject)) {
            if(
              this.selectedItems.has(this.dragObject) &&
              this.selectedItems.size > 0
            ) {
              let dx = ePt[0] - this.dragObject.x;
              let dy = ePt[1] - this.dragObject.y;
              for(let o of this.selectedItems) {
                if(Drawables.isDrawableNode(o)) {
                  o.x += dx;
                  o.y += dy;
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
  private onMouseUp(e : MouseEvent) : void {

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
      else if(Drawables.isDrawableEdge(this.dragObject)) {

        // Check that the mouse was released at a node.
        let hit = this.hitTest(ePt);
        if(Drawables.isDrawableNode(hit)) {

          // Move the edge if one is being dragged and it can be moved.
          if(
            this.moveEdge &&
            this.dragObject.source &&
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
            this.dragObject.source &&
            this.graph.canCreateEdge(this.dragObject.source, hit)
          ) {
            this.clearSelected();
            this.dragObject = 
              this.graph.createEdge(this.dragObject.source, hit);
          }
        }
      }

      // Drop the node if one is being dragged.
      else if(Drawables.isDrawableNode(this.dragObject)) {
        if(
          this.selectedItems.has(this.dragObject) &&
          this.selectedItems.size > 0
        ) {
          let dx = ePt[0] - this.dragObject.x;
          let dy = ePt[1] - this.dragObject.y;
          for(let o of this.selectedItems) {
            if(Drawables.isDrawableNode(o)) {
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
      clearTimeout(this.stickyTimeout as NodeJS.Timer);
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
    el.height = h * CONST.AA_SCALE;
    el.width = w * CONST.AA_SCALE;
    this.g.scale(CONST.AA_SCALE, CONST.AA_SCALE);
    this.redraw();
  }

  /**
   * redraw  
   *   Redraws the graph.
   */
  redraw() : void {
    clear(this.g, this.graph ? this.graph.backgroundColor : "AppWorkspace");
    if(this.graph) {
      Draw.drawGrid(this.g, this.gridOriginPt);
      for(let e of this.graph.edges)
        this.drawEdge(e);
      for(let n of this.graph.nodes)
        this.drawNode(n);

      if(Drawables.isDrawableEdge(this.hoverObject)) {
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
  private drawNode(n : Drawables.DrawableNode) : void {

    // Calculate the radius.
    let lines = n.label.split("\n");
    let size = Draw.getTextSize(
      this.g,
      lines,
      CONST.NODE_FONT_FAMILY,
      CONST.NODE_FONT_SIZE
    );
    let s = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
             CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
    s = (s < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : s);

    // Draw selected shape.
    if(this.selectedItems.has(n)) {
      if(n.shape === "circle") {
        Draw.drawCircle(
          this.g,
          n.x, n.y,
          (s + n.borderWidth) / 2 + 2,
          "solid",
          n.borderWidth,
          CONST.SELECTION_COLOR,
          CONST.SELECTION_COLOR,
          (n === this.dragObject || n === this.hoverObject ?
           20 * CONST.AA_SCALE : undefined),
          (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
           (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
        );
        Draw.drawCircle(
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
        Draw.drawSquare(
          this.g,
          n.x - hs,
          n.y - hs,
          2 * hs,
          2 * hs,
          "solid",
          n.borderWidth,
          CONST.SELECTION_COLOR,
          CONST.SELECTION_COLOR,
          (n === this.dragObject || n === this.hoverObject ?
           20 * CONST.AA_SCALE : undefined),
          (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
           (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
        );
        hs = s / 2;
        Draw.drawSquare(
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
        Draw.drawCircle(
          this.g,
          n.x, n.y,
          s / 2,
          n.borderStyle,
          n.borderWidth,
          n.borderColor,
          n.color,
          (n === this.dragObject || n === this.hoverObject ?
           20 * CONST.AA_SCALE : undefined),
          (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
            (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
        );
      }
      else if(n.shape === "square") {
        let hs = s / 2;
        Draw.drawSquare(
          this.g,
          n.x - hs, n.y - hs,
          hs * 2, hs * 2,
          n.borderStyle,
          n.borderWidth,
          n.borderColor,
          n.color,
          (n === this.dragObject || n === this.hoverObject ?
           20 * CONST.AA_SCALE : undefined),
          (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
            (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
        );
      }
    }

    // Label
    Draw.drawText(
      this.g,
      n.x, n.y - size.h / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
      lines,
      CONST.NODE_FONT_SIZE,
      CONST.NODE_FONT_FAMILY,
      "#fff",
      2,
      "#000"
    );
  }

  /**
   * drawEdge  
   *   Draws an edge on the canvas.
   */
  private drawEdge(e : Drawables.DrawableEdge, x? : number, y? : number) : void {

    // Edge
    if(e === this.hoverObject) {
      this.g.shadowColor = CONST.SELECTION_COLOR;
      this.g.shadowBlur = 20 * CONST.AA_SCALE;
    }
    if(this.selectedItems.has(e)) {
      let d = Drawables.cloneEdge(e);
      d.color = CONST.SELECTION_COLOR;
      d.lineStyle = "solid";
      d.lineWidth += 3;
      this.drawEdge(d);
    }
    if(e === this.moveEdge)
      this.g.globalAlpha = 0.3;
    this.g.strokeStyle = e.color;
    this.g.lineWidth = e.lineWidth;
    Draw.setLineStyle(this.g, e.lineStyle, e.lineWidth);
    if(x && y) {
      if(e.source)
        Draw.drawLine(this.g, e.source.x, e.source.y, x, y);
      else if(e.destination)
        Draw.drawLine(this.g, x, y, e.destination.x, e.destination.y);
    }
    else if(e.source && e.destination) {
      Draw.drawLine(this.g, e.source.x, e.source.y, e.destination.x, e.destination.y);
      if(e.showSourceArrow)
        Draw.drawArrow(this.g, e.destination, e.source);
      if(e.showDestinationArrow)
        Draw.drawArrow(this.g, e.source, e.destination);
    }
    this.g.globalAlpha = 1;

    // Label
    if(e.source && e.destination && e.label && e.label.trim() !== "") {
      let lines = e.label.split("\n");
      let size = Draw.getTextSize(this.g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
      let srcPt = Draw.getEdgeBorderPt(this.g, e.destination, e.source);
      let dstPt = Draw.getEdgeBorderPt(this.g, e.source, e.destination);
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
      Draw.setLineStyle(this.g, e.lineStyle);
      this.g.lineJoin = "round";
      this.g.fillRect(rect.x, rect.y, rect.w, rect.h);
      this.g.shadowBlur = 0;
      this.g.strokeRect(rect.x, rect.y, rect.w, rect.h);
      Draw.drawText(
        this.g,
        x, y - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
        lines,
        CONST.EDGE_FONT_SIZE,
        CONST.EDGE_FONT_FAMILY,
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
  private hitTest(pt : number[]) : Drawable | null {

    // Hit test nodes first.
    for(let n of this.graph.nodes) {
      let dx = n.x - pt[0];
      let dy = n.y - pt[1];
      let size = Draw.getTextSize(
        this.g,
        n.label.split("\n"),
        CONST.NODE_FONT_FAMILY,
        CONST.NODE_FONT_SIZE
      );
      let hs = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
                CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
      hs = (hs < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : hs) / 2;
      if((n.shape === "circle" && dx * dx + dy * dy <= hs * hs) ||
         (n.shape === "square" &&
          pt[0] <= n.x + hs && pt[0] >= n.x - hs &&
          pt[1] <= n.y + hs && pt[1] >= n.y - hs))
        return n;
    }

    // Hit test edges.
    for(let e of this.graph.edges) {
      if(e.source && e.destination) {
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
        let dotee = MathEx.dot(ve, ve); // edge dot edge
        let dotem = MathEx.dot(ve, vm); // edge dot mouse
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

        let dotpp = MathEx.dot(p, p); // proj dot proj
        let dotrr = MathEx.dot(r, r); // rej dot rej

        let dep = [
          ve[0] - p[0],
          ve[1] - p[1]
        ];
        let dotdep = MathEx.dot(dep, dep);

        if(dotpp <= dotee &&
          dotdep <= dotee &&
          dotrr < e.lineWidth * e.lineWidth + CONST.EDGE_HIT_MARGIN * CONST.EDGE_HIT_MARGIN)
          return e;
      }
    }
    return null;
  }

  /**
   * rectHitTest  
   *   Checks if a graph component was hit by a rectangle.
   */
  private rectHitTest(c : Drawable, rect : any) : boolean {
    return (Drawables.isDrawableNode(c) &&
            c.x >= rect.x && c.x <= rect.x + rect.w &&
            c.y >= rect.y && c.y <= rect.y + rect.h) ||
           (Drawables.isDrawableEdge(c) &&
           (c.source && c.destination) &&
           (this.rectHitTest(c.source, rect) ||
            this.rectHitTest(c.destination, rect))) ||
            false;
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
    (e.clientX - r.left) / (r.right - r.left) * canvas.width / CONST.AA_SCALE,
    (e.clientY - r.top) / (r.bottom - r.top) * canvas.height / CONST.AA_SCALE
  ];
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
function clear(g : CanvasRenderingContext2D, bgColor : string) : void {
  let canvas = g.canvas;
  g.fillStyle = bgColor;
  g.fillRect(0, 0, canvas.width, canvas.height);
}
