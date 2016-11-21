// File: graph-editor-canvas.directive.ts
// Created by: CJ Dimaano
// Date created: November 18, 2016
//
//
// http://stackoverflow.com/questions/32693061/angular-2-typescript-get-hold-of-an-element-in-the-template
// http://stackoverflow.com/questions/16587961/is-there-already-a-canvas-drawing-directive-for-angularjs-out-there
// https://angular.io/docs/ts/latest/guide/attribute-directives.html
// http://stackoverflow.com/questions/36163905/angular2-component-based-on-canvas-how-to-draw-inside
// https://www.lucidchart.com/techblog/2016/07/19/building-angular-2-components-on-the-fly-a-dialog-box-example/


import { Directive, ElementRef, HostListener } from "@angular/core";


@Directive({ selector: "[sinap-graph-editor-canvas]" })
export class GraphEditorCanvasDirective {

  private ctx: CanvasRenderingContext2D;

  private downEvent: MouseEvent;
  private isWaiting: boolean;
  private isSelecting: boolean;
  private dragObect;
  private selectedItems: Array<any>;

  constructor(private el: ElementRef) {
    this.ctx = el.nativeElement.getContext("2d");
    this.isWaiting = false;
    this.isSelecting = false;
    this.dragObect = null;
    this.selectedItems = [];
    this.resize();
  }

  @HostListener("mousedown", ["$event"]) onMouseDown(e: MouseEvent) {
    //
    // TODO:
    // Activate timer at 100ms.
    //
    this.downEvent = e;
    this.isWaiting = true;
  }

  //
  // TODO:
  // Timer event.
  //   If still waiting, perform hit test from down event.
  //   If hit test captures a node, snap node to cursor, set drag node.
  //   Else, create node on cursor, set drag node.
  //

  @HostListener("mousemove", ["$event"]) onMouseMove(e: MouseEvent) {
    if(this.downEvent !== null) {
      var dx = this.downEvent.clientX - e.clientX;
      var dy = this.downEvent.clientY - e.clientY;
      if(this.isWaiting && (dx * dx + dy * dy > 3 * 3)) {
        this.isWaiting = false;
        this.dragObect = this.hitTest(e.clientX, e.clientY);
        if(this.dragObect === null)
          this.isSelecting = true;
        else if(this.isNode(this.dragObect)) {
          // TODO:
          // Create a new edge.
          // Snap end of edge to cursor.
        }
        else if(this.isEdge(this.dragObect)) {
          // TODO:
          // Snap end of edge to cursor.
        }
      }
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
      }
    }
  }

  @HostListener("mouseup", ["$event"]) onMouseUp(e : MouseEvent) {
    if(this.isWaiting) {
      this.selectedItems = [];
      var hitComponent = this.hitTest(e.clientX, e.clientY);
      if(hitComponent !== null)
        this.selectedItems.push(hitComponent);
    }
    else if(this.isSelecting) {
      this.selectedItems = [];
      //
      // TODO:
      // Iterate through all components.
      // Add every component that is within the selection box to the selection list. 
      //
    }
    else if(this.isNode(this.dragObect)) {
      //
      // TODO:
      // If default creation node is not set, drop context menu for creating a node.
      // Drop node at location.
      // Set selected.
      //
    }
    else if(this.isEdge(this.dragObect)) {
      //
      // TODO:
      // If default creation edge is not set, drop context menu for creating a node.
      // Set endpoint of edge.
      // Set selected.
      //
    }
    this.isWaiting = false;
    this.isSelecting = false;
    this.dragObect = null;
    //
    // TODO:
    // redraw canvas.
    //
  }

  resize(): void {
    this.el.nativeElement.height = this.el.nativeElement.parentNode.offsetHeight;
    this.el.nativeElement.width = this.el.nativeElement.parentNode.offsetWidth;
    this.redraw();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = "solid black 2px";
    this.ctx.stroke();
  }

  clear(): void {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.el.nativeElement.clientWidth, this.el.nativeElement.clientHeight);
  }

  redraw(): void {
    this.clear();
  }

  private hitTest(x: number, y: number): any {
    //
    // TODO:
    // Iterate through all components.
    // Return the first that is hit by (x, y)
    //
    return null;
  }

  private isNode(val: any): boolean {
    //
    // TODO:
    // Check equivalency from node list.
    //
    return false;
  }

  private isEdge(val: any): boolean {
    //
    // TODO:
    // Check equivalency from edge list.
    //
    return false;
  }

}
