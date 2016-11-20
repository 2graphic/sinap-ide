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

  private drawing = false;
  private lastEvent: MouseEvent;

  constructor(private el: ElementRef) {
    this.ctx = el.nativeElement.getContext("2d");
    this.resize();
  }

  @HostListener("mousedown", ["$event"]) onMouseDown(e: MouseEvent) {
    //
    // TODO:
    // Capture down event.
    // Activate waiting.
    // Activate timer at 100ms.
    //
    this.lastEvent = e;
    this.ctx.beginPath();
    this.drawing = true;
  }

  //
  // TODO:
  // Timer event.
  //   If still waiting, perform hit test from down event.
  //   If hit test captures a node, snap node to cursor, set drag node.
  //   Else, create node on cursor, set drag node.
  //

  @HostListener("mousemove", ["$event"]) onMouseMove(e: MouseEvent) {
    //
    // TODO:
    // If mousedown active
    //   If still waiting for 100ms and dx, dy outside margin
    //     Disable waiting.
    //     Perform hit test from down event.
    //     If hit test captures node, activate create edge.
    //     Else, activate selection box.
    //   Else, if not waiting
    //     If selection box active, update selection box.
    //     Else if drag node set, update drag node.
    //     Else if create edge active, update create edge.
    //
    if(this.drawing) {
      this.drawLine(
        this.lastEvent.clientX,
        this.lastEvent.clientY,
        e.clientX,
        e.clientY
      );
      this.lastEvent = e;
    }
  }

  @HostListener("mouseup") onMouseUp() {
    //
    // TODO:
    // If still waiting, disable waiting.
    //   Perform hit test.
    //   If hit test captures component, set selected component.
    // Else if selection box active, select all in box.
    // Else if drag node set, drop node.
    // Else if create edge active, perform hit test.
    //   If hit test captures node, create edge from down node to up node.
    //
    this.drawing = false;
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

}
