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
  private dragObect : any = null;

  /**
   * selectedItems
   *   The currently selected graph components.
   */
  private selectedItems : Array<any> = [];

  //
  // TODO:
  // Use actual types for nodes and edges.
  //

  /**
   * _nodes
   *    The list of nodes in the graph.
   */
  private _nodes : Array<any> = [];

  /**
   * _edges
   *   The list of edges in the graph.
   */
  private _edges : Array<any> = [];

  /**
   * nodes
   *   Sets the nodes of the graph and updates the canvas.
   */
  set nodes(value : Array<any>) {
    this._nodes = value;
    this.redraw();
  }

  /**
   * nodes
   *   Gets the nodes of the graph.
   */
  get nodes() : Array<any> {
    return this._nodes;
  }

  /**
   * edges
   *   Sets the edges of the graph and updates the canvas.
   */
  set edges(value : Array<any>) {
    this._edges = value;
    this.redraw();
  }

  /**
   * edges
   *   Gets the edges of the graph.
   */
  get edges() : Array<any> {
    return this._edges;
  }

  /**
   * dragNode
   *   Sets the node being dragged by the cursor.
   */
  set dragNode(value : any) {
    this.dragObect = value;
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
    // Set a timeout for 100ms.
    //
    setTimeout(() => {
      //
      // Set the drag object and reset waiting to false if the waiting flag is
      // still set to true.
      //
      if(this.isWaiting) {
        this.dragObect =
          this.hitTest(this.downEvent.clientX, this.downEvent.clientY);
        if(this.dragObect === null) {
          // TODO:
          // Create node.
          // Set drag object.
        }
        this.isWaiting = false;
      }
    }, 100);
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
        this.dragObect = this.hitTest(e.clientX, e.clientY);
        //
        // Activate the selection box if no drag object was set.
        //
        if(this.dragObect === null)
          this.isSelecting = true;
        //
        // Create a new edge and update the drag object if the drag object was
        // set to a node.
        //
        else if(this.isNode(this.dragObect)) {
          // TODO:
          // Create a new edge.
          // Set drag object.
        }
      }
      //
      // Update the canvas if waiting is not set.
      //
      else if(!this.isWaiting) {
        if(this.isSelecting) {
          // TODO:
          // Update selection box.
        }
        else if(this.isNode(this.dragObect)) {
          // TODO:
          // Update node position.
        }
        else if(this.isEdge(this.dragObect)) {
          // TODO:
          // Update edge endpoint.
        }
        this.redraw();
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
    if(this.isWaiting) {
      this.selectedItems = [];
      var hitComponent = this.hitTest(e.clientX, e.clientY);
      if(hitComponent !== null)
        this.selectedItems.push(hitComponent);
    }
    //
    // Set the selected components if selecting is set.
    //
    else if(this.isSelecting) {
      this.selectedItems = [];
      //
      // TODO:
      // Iterate through all components.
      // Add every component that is within the selection box to the selection list. 
      //
    }
    //
    // Drop the node if one is being dragged.
    //
    else if(this.isNode(this.dragObect)) {
      //
      // TODO:
      // If default creation node is not set, drop context menu for creating a node.
      // Drop node at location.
      // Set selected.
      //
    }
    //
    // Update the edge if one is being dragged.
    //
    else if(this.isEdge(this.dragObect)) {
      //
      // Check that the mouse was released at a node.
      //
      var hit = this.hitTest(e.clientX, e.clientY);
      if(this.isNode(hit)) {
        //
        // TODO:
        // If default creation edge is not set, drop context menu for creating an edge.
        // Set endpoint of edge.
        // Set selected.
        //
      }
    }
    //
    // Reset input states.
    //
    this.downEvent = null;
    this.isWaiting = false;
    this.isSelecting = false;
    this.dragObect = null;
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
   * drawLine
   *   Draws a line.
   */
  drawLine(x1 : number, y1 : number, x2 : number, y2 : number) : void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = "solid black 2px";
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
  }

  /**
   * hitTest
   *   Gets the first graph component that is hit by x and y.
   * 
   * <p>
   *   Nodes take priority over edges.
   * </p>
   */
  private hitTest(x : number, y : number) : any {
    //
    // TODO:
    // Iterate through all components.
    // Return the first component that is hit by (x, y)
    //
    return null;
  }

  /**
   * isNode
   *   Checks if a object is a node.
   */
  private isNode(val : any) : boolean {
    //
    // TODO:
    // Check equivalency from node list.
    //
    return false;
  }

  /**
   * isEdge
   *   Checks if an object is an edge.
   */
  private isEdge(val : any) : boolean {
    //
    // TODO:
    // Check equivalency from edge list.
    //
    return false;
  }

}
