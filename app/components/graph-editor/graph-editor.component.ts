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

import * as MathEx from "./math";
import { STICKY_DELAY, NUDGE, GRID_SPACING } from "./defaults";
import { PropertyChangedEvent } from "./events";
import { NOOP, diff, sum } from "./math";
import { EditorCanvas, point } from "./editor-canvas";
import { DrawableGraph, EditorGraph } from "./editor-graph";
import { DrawableElement } from "./drawable-element";


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
     * `graphCache`
     *
     *   Caches previously opened graphs.
     */
    private readonly graphCache: Map<DrawableGraph, EditorGraph>
    = new Map<DrawableGraph, EditorGraph>();

    /**
     * `clipboard`
     *
     *   The cached selection of elements to be pasted.
     */
    private clipboard: DrawableElement[]
    = [];

    /**
     * `pasteOffset`
     *
     *   The offset position for pasting nodes.
     */
    private pasteOffset: number
    = GRID_SPACING;

    /**
     * `downPt`
     *
     *   The previously captured mouse down event.
     */
    private downPt: point | null
    = null;

    /**
     * `stickyTimeout`
     *
     *   Timer reference for the sticky delay.
     */
    private stickyTimeout: NodeJS.Timer | number | null
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
        if (this._graph)
            this.unregisterGraph(this._graph.drawable);

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

    @Input()
    set height(value: number) {
        const container = this.containerElementRef.nativeElement as HTMLElement;
        container.style.height = value + "px";
        this.resize();
    }

    @Input()
    set width(value: number) {
        const container = this.containerElementRef.nativeElement as HTMLElement;
        container.style.width = value + "px";
        this.resize();
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
        this.graphLayerElementRef.nativeElement.onselectstart = () => false;
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
        if (this.gridCanvas &&
            (this.gridCanvas.size.h !== h || this.gridCanvas.size.w !== w)) {
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

    /**
     * `saveSelection`
     *
     *   Saves the collection of selected elements for pasting.
     *
     * @param cut
     *   Whether or not the selection should be deleted after saving.
     */
    saveSelection(cut: boolean = false) {
        if (this._graph) {
            this.pasteOffset = GRID_SPACING;
            this.clipboard = [...this._graph.drawable.selectedItems];
            if (cut)
                this._graph.drawable.deleteSelected();
        }
    }

    /**
     * `cloneSelection`
     *
     *   Pastes the previously saved selection of elements.
     */
    cloneSelection() {
        if (this._graph) {
            this._graph.drawable.cloneElements(
                this.clipboard,
                { x: this.pasteOffset, y: this.pasteOffset }
            );
            this.pasteOffset += GRID_SPACING;
        }
    }


    // Private methods /////////////////////////////////////////////////////////


    /**
     * `registerEventListeners`
     *
     *   Registers input event listeners.
     */
    private registerEventListeners() {
        const el = this.el.nativeElement as HTMLElement;
        el.addEventListener("keydown", this.onKeyDown);
        el.addEventListener("keyup", this.onKeyUp);
        el.addEventListener("dblclick", this.onDoubleClick);
        el.addEventListener("mousedown", this.onMouseDown);
        el.addEventListener("mousemove", this.onMouseMove);
        el.addEventListener("wheel", this.onWheel);
        // TODO:
        // Use touch events to handle gesture pan and zoom.
        // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
        el.addEventListener("touchstart", (e: TouchEvent) => console.log(e));
        el.addEventListener("touchend", (e: TouchEvent) => console.log(e));
    }

    /**
     * `unregisterEventListeners`
     *
     *   Unregisters event listeners.
     */
    private unregisterEventListeners() {
        const el = this.el.nativeElement as EventTarget;
        el.removeEventListener("keydown", this.onKeyDown);
        el.removeEventListener("keyup", this.onKeyUp);
        el.removeEventListener("dblclick", this.onDoubleClick);
        el.removeEventListener("mousedown", this.onMouseDown);
        el.removeEventListener("mouseup", this.onMouseUp);
        el.removeEventListener("mousemove", this.onMouseMove);
        el.removeEventListener("wheel", this.onWheel);
        // TODO:
        // remove touch event listeners.
    }

    /**
     * `registerGraph`
     *
     *   Registers event listeners for the newly bound graph.
     */
    private registerGraph(graph: DrawableGraph) {
        if (!this.graphCache.has(graph))
            this.graphCache
                .set(graph, new EditorGraph(graph, this.graphCanvas));
        this._graph = this.graphCache.get(graph)!;
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
     * `onKeyDown`
     *
     *   Handles the keydown event.
     */
    private onKeyDown
    = (evt: KeyboardEvent) => {
        if (evt.altKey)
            this.el.nativeElement.style.cursor = "-webkit-grab";
    }

    /**
     * `onKeyUp`
     *
     *   Handles the keyup event.
     */
    private onKeyUp
    = (evt: KeyboardEvent) => {
        this.el.nativeElement.style.cursor = "default";
    }

    /**
     * `onDoubleClick`
     *
     *   Handles the double click event.
     */
    private onDoubleClick
    = (evt: MouseEvent) => {
        const d = this._graph!.drawable.createNode();
        if (d) {
            d.position = this.graphCanvas.getCoordinates(evt);
            this._graph!.drawable.setSelected(d);
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

        if (evt.buttons === 1) {
            if (evt.shiftKey) {
                this._graph!.updateHoverObject();
                this._graph!.dragStart(this.graphCanvas.getCoordinates(evt));
            }
            else if (evt.altKey) {
                this.el.nativeElement.style.cursor = "-webkit-grabbing";
                this.isPanning = true;
            }
            else {
                this._graph!.dragStart(this.graphCanvas.getCoordinates(evt));
                if (!this._graph!.isDragging) {
                    this.downPt = evt;
                    this.stickyTimeout = this.stickyTimeout ?
                        this.stickyTimeout :
                        setTimeout(() => {
                            clearTimeout(this.stickyTimeout as NodeJS.Timer);
                            this.stickyTimeout = null;
                            this.downPt = null;
                            this.el.nativeElement.style.cursor
                                = "-webkit-grabbing";
                            this.isPanning = true;
                        }, STICKY_DELAY);
                }
            }
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
                if (this.isPanning) {
                    this.el.nativeElement.style.cursor = "-webkit-grabbing";
                    this.pan(evt);
                }
                else if (this.stickyTimeout) {
                    const dpt = MathEx.diff(evt, this.downPt!);
                    if (MathEx.dot(dpt, dpt) > NUDGE * NUDGE) {
                        clearTimeout(this.stickyTimeout as NodeJS.Timer);
                        this.stickyTimeout = null;
                        this.el.nativeElement.style.cursor = "default";
                        this._graph!
                            .dragStart(this.graphCanvas.getCoordinates(evt));
                        this._graph!.drag(ept);
                    }
                }
                else {
                    this.el.nativeElement.style.cursor = "default";
                    this._graph!.drag(ept);
                }
            } break;
        }
    }

    /**
     * `onMouseUp`
     *
     *   Handles the mouseup event.
     */
    private onMouseUp
    = (evt: MouseEvent): void => {
        // Swap up and down events.
        this.el.nativeElement
            .removeEventListener("mouseup", this.onMouseUp);
        this.el.nativeElement
            .addEventListener("mousedown", this.onMouseDown);

        if (this.stickyTimeout) {
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;
            this.downPt = null;
            this._graph!.dragStart(this.graphCanvas.getCoordinates(evt));
        }

        if (this.isPanning) {
            this.el.nativeElement.style.cursor = "default";
            this.isPanning = false;
        }

        // Drop the graph.
        else
            this._graph!.drop(this.graphCanvas.getCoordinates(evt));
    }

    /**
     * `onWheel`
     *
     *   Handles the mouse wheel event for devices that do not register touch
     *   events for zooming.
     */
    private onWheel
    = (e: WheelEvent) => {
        if (e.ctrlKey) {
            // Apply zoom.
            if (e.deltaY > 0)
                this.zoom(e, 1 / 1.05);
            else if (e.deltaY < 0)
                this.zoom(e, 1.05);
        } else {
            this.pan({
                movementX: -e.deltaX,
                movementY: -e.deltaY,
            } as MouseEvent);
        }
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
