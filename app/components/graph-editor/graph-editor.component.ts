/**
 * @file `graph-editor.component.ts`
 *   Created on October 10, 2016
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


// Imports /////////////////////////////////////////////////////////////////////


import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    ViewChild
} from "@angular/core";

import { PropertyChangedEvent } from "./events";
import { NOOP, diff, sum } from "./math";
import { EditorCanvas, point } from "./editor-canvas";
import { DrawableGraph, EditorGraph } from "./editor-graph";


// Re-exports //////////////////////////////////////////////////////////////////


export {
    PropertyChangedEvent,
    PropertyChangedEventDetail,
    DrawableEvent,
    DrawableEventDetail,
    MoveEdgeEvent,
    MoveEdgeEventDetail,
    SelectionChangedEvent,
    TypedCustomEvent
} from "./events";
export {
    DrawableGraph,
    EdgeValidator
} from "./drawable-graph";
export { Drawable } from "./drawable";
export { DrawableElement } from "./drawable-element";
export { DrawableEdge } from "./drawable-edge";
export { DrawableNode } from "./drawable-node";
export { LineStyles, Shapes } from "./editor-canvas";


// Type aliases ////////////////////////////////////////////////////////////////


type callback = () => void;


// Graph Editor Angular Component //////////////////////////////////////////////


@Component({
    selector: "sinap-graph-editor",
    templateUrl: "./graph-editor.component.html",
    styleUrls: [
        "./graph-editor.component.css"
    ]
})
/**
 * `GraphEditorComponent`
 *
 *   Angular2 component that provides a canvas for drawing nodes and edges.
 */
export class GraphEditorComponent implements AfterViewInit {
    constructor(private el: ElementRef) { }


    // Private Fields //////////////////////////////////////////////////////////


    /**
     * `containerElementRef`
     *
     *   Reference to the container div element.
     */
    @ViewChild("container")
    private containerElementRef: ElementRef;

    /**
     * `gridLayerElementRef`
     *
     *   Reference to the grid layer canvas element.
     */
    @ViewChild("gridLayer")
    private gridLayerElementRef: ElementRef;

    /**
     * `graphLayerElementRef`
     *
     *   Reference to the graph layer canvas element.
     */
    @ViewChild("graphLayer")
    private graphLayerElementRef: ElementRef;

    /**
     * `gridCanvas`
     *
     *   The graph editor canvas for the grid.
     */
    private gridCanvas: EditorCanvas;

    /**
     * `graphCanvas`
     *
     *   The graph editor canvas for the graph.
     */
    private graphCanvas: EditorCanvas;

    /**
     * `_graph`
     *
     *   The graph object.
     */
    private _graph: EditorGraph | null
    = null;

    /**
     * `isPanning`
     *
     *   Whether or not the canvas is currently panning. This is to prevent
     *   panning from occuring if the user started dragging the right mouse
     *   button outside of the editor.
     */
    private isPanning: boolean
    = false;

    /**
     * `drawGridDelegate`
     *
     *   Delegate for drawing the grid.
     */
    private drawGridDelegate: callback
    = NOOP;

    /**
     * `drawGraphDelegate`
     *
     *   Delegate for drawing the graph.
     */
    private drawGraphDelegate: callback
    = NOOP;


    // Public Fields ///////////////////////////////////////////////////////////


    /**
     * `graph`
     *
     *   Gets or sets the current drawable graph.
     */
    get graph() {
        return this._graph ?
            this._graph.drawable :
            null;
    }

    @Input()
    set graph(value: DrawableGraph | null) {
        this.suspendRedraw();
        if (value) {
            this.registerGraph(value);
            this.registerEventListeners();
            this.resumeRedraw();
        }
        else {
            this.unregisterEventListeners();
            if (this.gridCanvas)
                this.gridCanvas.clear();
            if (this.graphCanvas)
                this.graphCanvas.clear();
        }
    }

    /**
     * `scale`
     *
     *   Sets the scaling factor of the canvas.
     */
    set scale(value: number) {
        if (this.gridCanvas) {
            this.gridCanvas.scale = value;
            this.drawGridDelegate();
        }
        if (this.graphCanvas) {
            this.graphCanvas.scale = value;
        }
        this.redraw();
    }

    /**
     * `origin`
     *
     *   Sets the origin pt of the canvas.
     */
    set origin(value: point) {
        if (this.gridCanvas) {
            this.gridCanvas.origin = value;
            this.drawGridDelegate();
        }
        if (this.graphCanvas) {
            this.graphCanvas.origin = value;
        }
        this.redraw();
    }

    /**
     * `dragNode`
     *
     *   Sets the node being dragged by the cursor.
     *
     * Note:
     *   The intent of this function is to be able to set the drag node from the
     *   components panel.
     *
     * @todo
     *   Maybe we can use the standard drop event for this instead.
     */
    // @Input()
    // dragNode(value: DrawableNode) {
    //     const n = new DrawableNode(value, this.canvas);
    //     this.drawList.push(n);
    //     this.hoverObject = n;
    //     this.updateDragObject();
    // }


    // Public Methods //////////////////////////////////////////////////////////


    /**
     * `ngAfterViewInit`
     *
     *   Gets the canvas rendering context and resizes the canvas element.
     */
    ngAfterViewInit() {
        this.gridCanvas = new EditorCanvas(
            this.gridLayerElementRef.nativeElement.getContext("2d")
        );
        this.graphCanvas = new EditorCanvas(
            this.graphLayerElementRef.nativeElement.getContext("2d")
        );
        this.resize();
    }

    /**
     * `resize`
     *
     *   Resizes the canvas.
     */
    resize(): void {
        // TODO:
        // angular-resizable-element
        const el = this.containerElementRef.nativeElement;
        const h = el.offsetHeight;
        const w = el.offsetWidth;
        if (this.gridCanvas.size.h !== h || this.gridCanvas.size.w !== w) {
            const size = { h: h, w: w };
            this.gridCanvas.size = size;
            this.graphCanvas.size = size;
            this.drawGridDelegate();
            this.redraw();
        }
    }

    /**
     * `suspendRedraw`
     *
     *   Suspends updates to the canvas.
     */
    suspendRedraw() {
        this.drawGraphDelegate = NOOP;
        if (this._graph)
            this._graph.suspendDraw();
    }

    /**
     * `resumeRedraw`
     *
     *   Resumes updates to the canvas and forces a redraw.
     */
    resumeRedraw() {
        if (this.gridCanvas && this.graphCanvas) {
            this.drawGridDelegate = () => {
                // TODO:
                // backgroundColor
                this.gridCanvas.clear("#fff");
                this.gridCanvas.drawGrid();
            };
            if (this._graph) {
                this._graph.resumeDraw();
                this.drawGraphDelegate = () => {
                    this._graph!.draw();
                };
            }
        }
    }

    /**
     * `redraw`
     *
     *   Redraws the graph.
     */
    redraw() {
        this.drawGraphDelegate();
    }


    // Private methods /////////////////////////////////////////////////////////


    /**
     * `registerEventListeners`
     *
     *   Registers input event listeners.
     */
    private registerEventListeners() {
        const el = this.el.nativeElement as HTMLElement;
        el.addEventListener("mousedown", this.onMouseDown);
        el.addEventListener("mousemove", this.onMouseMove);
        el.addEventListener("wheel", this.onWheel);
        // TODO:
        // Use touch events to handle gesture pan and zoom.
        // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
        el.addEventListener("touchstart", (e: TouchEvent) => console.log(e));
        el.addEventListener("touchend", (e: TouchEvent) => console.log(e));
        // hidden.addEventListener("copy", this.onCopy);
        // hidden.addEventListener("cut", this.onCut);
        // hidden.addEventListener("paste", this.onPaste);
    }

    /**
     * `unregisterEventListeners`
     *
     *   Unregisters event listeners.
     */
    private unregisterEventListeners() {
        const el = this.el.nativeElement as EventTarget;
        el.removeEventListener("mousedown", this.onMouseDown);
        el.removeEventListener("mouseup", this.onMouseUp);
        el.removeEventListener("mousemove", this.onMouseMove);
        el.removeEventListener("wheel", this.onWheel);
        // TODO:
        // remove touch event listeners.
        // hidden.removeEventListener("copy", this.onCopy);
        // hidden.removeEventListener("cut", this.onCut);
        // hidden.removeEventListener("paste", this.onPaste);
    }

    /**
     * `registerGraph`
     *
     *   Registers event listeners for the newly bound graph.
     */
    private registerGraph(graph: DrawableGraph) {
        this._graph = new EditorGraph(graph, this.graphCanvas);
        this.scale = graph.scale;
        this.origin = graph.origin;
        graph.addEventListener("change", this.onDrawablePropertyChanged);
    }

    /**
     * `unregisterGraph`
     *
     *   Unregisters event listeners for the previously bound graph.
     */
    private unregisterGraph(graph: DrawableGraph) {
        this._graph = null;
        graph.removeEventListener("change", this.onDrawablePropertyChanged);
    }


    /**
     * `pan`
     *
     *   Repositions the origin point of the canvas.
     */
    private pan(evt: MouseEvent) {
        const canvas = this.graphCanvas;
        this.origin = {
            x: canvas.origin.x + evt.movementX / canvas.scale,
            y: canvas.origin.y + evt.movementY / canvas.scale
        };
        this.redraw();
    }

    /**
     * `zoom`
     *
     *   Updates the scale of the canvas.
     */
    private zoom(p: point, s: number) {
        // Get the canvas coordinates before zoom.
        const pt1 = this.graphCanvas.getCoordinates(p);
        // Apply zoom.
        this._graph!.drawable.scale = this.graphCanvas.scale * s;
        // Get the canvas coordinates after zoom.
        const pt2 = this.graphCanvas.getCoordinates(p);
        // Get the delta between pre- and post-zoom canvas pts.
        const dpt = diff(pt2, pt1);
        // Move the canvas origin by the delta.
        this._graph!.drawable.origin = sum(this.graphCanvas.origin, dpt);
        this.redraw();
    }


    // Event handlers //////////////////////////////////////////////////////////


    /**
     * `onCopy`
     *
     *   Handles the copy event.
     */
    private onCopy
    = (evt: ClipboardEvent) => {
        const dt = evt.clipboardData;
        dt.clearData();
        dt.dropEffect = "copy";
        dt.effectAllowed = "copy";

        // TODO:
        // - Serialize selection into dt.
        // dt.setData("application/sinapObjects", )
        console.log("copy");

        evt.preventDefault();
    }

    /**
     * `onCut`
     *
     *   Handles the cut event.
     */
    private onCut
    = (evt: ClipboardEvent) => {
        const dt = evt.clipboardData;
        dt.clearData();
        dt.dropEffect = "move";
        dt.effectAllowed = "move";

        // TODO:
        // - Serialize selection into dt.
        // - Delete selection.
        // dt.setData("application/sinapObjects", )
        console.log("cut");

        evt.preventDefault();
    }

    /**
     * `onPaste`
     *
     *   Handles the paste event.
     */
    private onPaste
    = (evt: ClipboardEvent) => {
        const dt = evt.clipboardData;
        if (dt.effectAllowed === "copy" || dt.effectAllowed === "move") {
            // TODO:
            // - Deserialize selection from dt.
            // dt.getData("application/sinapObjects")
            console.log("paste");

            if (dt.effectAllowed === "move")
                dt.clearData();
            evt.preventDefault();
        }
    }

    /**
     * `onMouseDown`
     *
     *   Handles the mousedown event.
     */
    private onMouseDown
    = (evt: MouseEvent): void => {
        // Swap up and down events.
        this.el.nativeElement.removeEventListener(
            "mousedown",
            this.onMouseDown
        );
        this.el.nativeElement.addEventListener(
            "mouseup",
            this.onMouseUp
        );
        switch (evt.buttons) {
            // Handle the left mouse button event.
            case 1: {
                // Start dragging the graph.
                this._graph!.dragStart(this.graphCanvas.getCoordinates(evt));
            } break;

            // Handle the right mouse button event.
            case 2: {
                this.isPanning = true;
            } break;
        }
    }

    /**
     * `onMouseMove`
     *
     *   Handles the mousemove event.
     */
    private onMouseMove
    = (evt: MouseEvent): void => {
        const ept = this.graphCanvas.getCoordinates(evt);

        // Capture the down event if the drag object has been set.
        // TODO:
        // When the user can drag components onto the canvas from the tools
        // panel.
        // if (this.dragObject && e.buttons === 1 && !this.dragPt)
        //     this.dragPt = this.graphCanvas.getCoordinates(e);

        switch (evt.buttons) {
            // Hover.
            case 0: {
                this._graph!.updateHoverObject(ept);
            } break;

            // Drag.
            case 1: {
                this.el.nativeElement.style.cursor = "default";
                this._graph!.drag(ept);
            } break;

            // Pan.
            case 2: {
                if (this.isPanning)
                    this.pan(evt);
            } break;
        }
    }

    /**
     * `onMouseUp`
     *
     *   Handles the mouseup event.
     */
    private onMouseUp
    = (e: MouseEvent): void => {
        this.isPanning = false;
        // Swap up and down events.
        this.el.nativeElement
            .removeEventListener("mouseup", this.onMouseUp);
        this.el.nativeElement
            .addEventListener("mousedown", this.onMouseDown);
        // Drop the graph.
        this._graph!.drop(this.graphCanvas.getCoordinates(e));
    }

    /**
     * `onWheel`
     *
     *   Handles the mouse wheel event for devices that do not register touch
     *   events for zooming.
     */
    private onWheel
    = (e: WheelEvent) => {
        // Apply zoom.
        if (e.deltaY > 0)
            this.zoom(e, 1 / 1.05);
        else if (e.deltaY < 0)
            this.zoom(e, 1.05);
    }

    /**
     * `onDrawablePropertyChanged`
     *
     *   Updates the scale or origin of canvas.
     */
    private onDrawablePropertyChanged
    = (evt: PropertyChangedEvent<any>) => {
        const drawable = evt.detail.source;
        switch (evt.detail.key) {
            case "origin":
                this.origin = drawable[evt.detail.key];
                break;
            case "scale":
                this.scale = drawable[evt.detail.key];
                break;
        }
    }

}
