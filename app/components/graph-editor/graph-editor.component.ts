// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


// Imports /////////////////////////////////////////////////////////////////////


import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    ViewChild
} from "@angular/core";

import {
    IMAGES,
    GraphEditorCanvas,
    makeRect,
    point
} from "./graph-editor-canvas";
import {
    DrawableGraph,
    EdgeValidator
} from "./drawable-graph";
import { DrawableEvent, MoveEdgeEvent, PropertyChangedEvent } from "./events";
import { SelectionChangedEvent } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";
import { GraphEditorElement } from "./graph-editor-element";
import { GraphEditorNode, HIDDEN_NODE } from "./graph-editor-node";
import { GraphEditorEdge } from "./graph-editor-edge";
import * as DEFAULT from "./defaults";
import * as MathEx from "./math";
import { filterSet } from "./generic-functions";


// Re-exports //////////////////////////////////////////////////////////////////


export {
    PropertyChangedEvent,
    PropertyChangedEventDetail,
    DrawableEvent,
    DrawableEventDetail,
    MoveEdgeEvent,
    MoveEdgeEventDetail,
    TypedCustomEvent
} from "./events";
export {
    DrawableGraph,
    SelectionChangedEvent,
    EdgeValidator
} from "./drawable-graph";
export { Drawable } from "./drawable";
export { DrawableElement } from "./drawable-element";
export { DrawableEdge } from "./drawable-edge";
export { DrawableNode } from "./drawable-node";
export { LineStyles, Shapes } from "./graph-editor-canvas";


// Type aliases ////////////////////////////////////////////////////////////////


type num = number;
type pt = point;
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
 * GraphEditorComponent
 *   Angular2 component that provides a canvas for drawing nodes and edges.
 */
export class GraphEditorComponent implements AfterViewInit {
    constructor(private el: ElementRef) { }


    // Private Fields //////////////////////////////////////////////////////////


    /**
     * containerElementRef
     *
     *   Reference to the container div element.
     */
    @ViewChild("container")
    private containerElementRef: ElementRef;

    /**
     * gridLayerElementRef
     *
     *   Reference to the grid layer canvas element.
     */
    @ViewChild("gridLayer")
    private gridLayerElementRef: ElementRef;

    /**
     * graphLayerElementRef
     *
     *   Reference to the graph layer canvas element.
     */
    @ViewChild("graphLayer")
    private graphLayerElementRef: ElementRef;

    /**
     * gridCanvas
     *   The graph editor canvas for the grid.
     */
    private gridCanvas: GraphEditorCanvas;

    /**
     * graphCanvas
     *   The graph editor canvas for the graph.
     */
    private graphCanvas: GraphEditorCanvas;

    /**
     * graph
     *   The graph object.
     */
    private graph: DrawableGraph;

    /**
     * panPt
     *   The previous pt from panning the canvas.
     */
    private panPt: pt | null
    = null;

    /**
     * downPt
     *   The previous down event point.
     */
    private dragPt: point | null
    = null;

    /**
     * selectionPt
     *
     *   The original point of the selection box.
     */
    private selectionPt: point | null
    = null;

    /**
     * stickyTimeout
     *   Timer reference for the sticky delay.
     */
    private stickyTimeout: NodeJS.Timer | num | null
    = null;

    /**
     * dragObect
     *   The node being dragged by the cursor.
     */
    private dragObject: GraphEditorNode | null
    = null;

    /**
     * hoverObject
     *   The graph component over which the cursor is hovering.
     */
    private hoverObject: GraphEditorElement<DrawableElement> | null
    = null;

    /**
     * moveEdge
     *   The edge to be replaced once the new edge has been created.
     */
    private moveEdge: GraphEditorEdge | null
    = null;

    /**
     * selected
     *
     *   The set of selected elements to prevent live selection from bombarding
     *   the `select` event on the drawable graph.
     */
    private readonly selected: Set<GraphEditorElement<DrawableElement>>
    = new Set<GraphEditorElement<DrawableElement>>();

    private readonly unselected: Set<GraphEditorElement<DrawableElement>>
    = new Set<GraphEditorElement<DrawableElement>>();

    private nodes: GraphEditorNode[]
    = [];

    private readonly drawables: Map<DrawableElement, GraphEditorElement<DrawableElement>>
    = new Map<DrawableElement, GraphEditorElement<DrawableElement>>();

    private drawGridDelegate: callback
    = MathEx.NOOP;

    private drawHighlightDelegate: callback
    = MathEx.NOOP;

    private drawDelegate: callback
    = MathEx.NOOP;

    private drawSelectionBoxDelegate: callback
    = MathEx.NOOP;

    private deleteSelectedDelegate: callback
    = MathEx.NOOP;

    private selectAllDelegate: callback
    = MathEx.NOOP;


    // Public Fields ///////////////////////////////////////////////////////////


    /**
     * setGraph
     *   Input property for the graph.
     */
    @Input("graph")
    set setGraph(value: DrawableGraph | null) {
        if (this.graph)
            this.unregisterGraph(this.graph);

        if (value) {
            this.suspendRedraw();
            this.registerGraph(value);
            this.registerEventListeners();
            this.resumeRedraw();
        }
        else {
            this.unregisterEventListeners();
            this.suspendRedraw();
            this.panPt = null;
            this.dragPt = null;
            this.stickyTimeout = null;
            this.dragObject = null;
            this.hoverObject = null;
            this.moveEdge = null;
            this.drawables.clear();
            if (this.gridCanvas)
                this.gridCanvas.clear();
            if (this.graphCanvas)
                this.graphCanvas.clear();
        }
        this.redraw();
    }

    /**
     * scale
     *   Sets the scaling factor of the canvas.
     */
    set scale(value: num) {
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
     * origin
     *   Sets the origin pt of the canvas.
     */
    set origin(value: pt) {
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
     * suspendRedraw
     *   Suspends updates to the canvas.
     */
    suspendRedraw() {
        this.drawGridDelegate = MathEx.NOOP;
        this.drawHighlightDelegate = MathEx.NOOP;
        this.drawDelegate = MathEx.NOOP;
    }

    /**
     * resumeRedraw
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
            this.drawHighlightDelegate = () => {
                // TODO:
                // Debug previously selected node after node drop still has
                // selection shadow.
                this.graphCanvas.clear();
                for (const s of this.selected) {
                    s.drawHighlight(this.graphCanvas);
                }
                this.graphCanvas.globalCompositeOperation = "source-in";
                this.graphCanvas.clear(DEFAULT.SELECTION_COLOR);
                this.graphCanvas.globalCompositeOperation = "source-over";
            };
            this.drawDelegate = () => {
                const visited = new Set<GraphEditorElement<DrawableElement>>();
                if (this.dragObject)
                    visited.add(this.dragObject);
                this.nodes.forEach(v => this.drawTree(v, visited));
                if (this.dragObject) {
                    visited.delete(this.dragObject);
                    this.drawTree(this.dragObject, visited);
                }
            };
        }
        this.redraw();
    }

    /**
     * dragNode
     *   Sets the node being dragged by the cursor.
     *
     * Note:
     * The intent of this function is to be able to set the drag node from the
     * components panel.
     *
     * TODO:
     * Maybe we can use the standard drop event for this instead.
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
     * ngAfterViewInit
     *   Gets the canvas rendering context and resizes the canvas element.
     */
    ngAfterViewInit() {
        this.gridCanvas = new GraphEditorCanvas(this.gridLayerElementRef.nativeElement.getContext("2d"));
        this.graphCanvas = new GraphEditorCanvas(this.graphLayerElementRef.nativeElement.getContext("2d"));
        this.resize();
    }

    /**
     * resize
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

    get deleteSelected() {
        return this.deleteSelectedDelegate;
    }

    get selectAll() {
        return this.selectAllDelegate;
    }

    /**
     * redraw
     *   Redraws the graph.
     */
    redraw() {
        this.drawHighlightDelegate();
        this.drawDelegate();
        this.drawSelectionBoxDelegate();
    }


    // Event handlers //////////////////////////////////////////////////////////


    private onCopy
    = (e: ClipboardEvent) => {
        const dt = e.clipboardData;
        dt.clearData();
        dt.dropEffect = "copy";
        dt.effectAllowed = "copy";

        // TODO:
        // - Serialize selection into dt.
        // dt.setData("application/sinapObjects", )
        console.log("copy");

        e.preventDefault();
    }

    private onCut
    = (e: ClipboardEvent) => {
        const dt = e.clipboardData;
        dt.clearData();
        dt.dropEffect = "move";
        dt.effectAllowed = "move";

        // TODO:
        // - Serialize selection into dt.
        // - Delete selection.
        // dt.setData("application/sinapObjects", )
        console.log("cut");

        e.preventDefault();
    }

    private onPaste
    = (e: ClipboardEvent) => {
        const dt = e.clipboardData;
        if (dt.effectAllowed === "copy" || dt.effectAllowed === "move") {
            // TODO:
            // - Deserialize selection from dt.
            // dt.getData("application/sinapObjects")
            console.log("paste");

            if (dt.effectAllowed === "move")
                dt.clearData();
            e.preventDefault();
        }
    }

    /**
     * onMouseDown
     *   Handles the mousedown event.
     */
    private onMouseDown
    = (e: MouseEvent): void => {
        switch (e.buttons) {

            // Handle the left mouse button event.
            case 1: {

                // Swap up and down events.
                this.el.nativeElement.removeEventListener(
                    "mousedown",
                    this.onMouseDown
                );
                this.el.nativeElement.addEventListener(
                    "mouseup",
                    this.onMouseUp
                );

                // Save the mouse point.
                this.dragPt = this.graphCanvas.getPt(e);

                // Set a timer for creating a node if nothing is being hovered.
                if (!this.hoverObject) {
                    this.stickyTimeout = (this.stickyTimeout ?
                        this.stickyTimeout :
                        setTimeout(this.onStickey, DEFAULT.STICKY_DELAY));
                }

                // Update the drag object if something is being hovered.
                else
                    this.updateDragObject();

            } break;

            // Handle the right mouse button event.
            case 2: {
                // Capture the down pt.
                this.panPt = e;
            } break;
        }
    }

    /**
     * onMouseMove
     *   Handles the mousemove event.
     */
    private onMouseMove
    = (e: MouseEvent): void => {
        let ePt = this.graphCanvas.getPt(e);

        // Capture the down event if the drag object has been set.
        if (this.dragObject && e.buttons === 1 && !this.dragPt)
            this.dragPt = this.graphCanvas.getPt(e);

        // Make sure the down event was previously captured.
        if (this.dragPt) {
            this.el.nativeElement.style.cursor = "default";

            // Get the change in x and y locations of the cursor.
            const dPt = MathEx.diff(this.dragPt, ePt);

            // Update the canvas if waiting is not set.
            if (!this.stickyTimeout) {

                // Update the selection box if selecting.
                if (!this.dragObject)
                    this.updateSelectionBox(this.dragPt, ePt);

                // Update node position.
                else {
                    if (this.dragObject.isHidden &&
                        this.checkValidEdgeDrop(
                            this.dragObject.edges.values().next().value.drawable,
                            ePt
                        )) {
                        const hoverNode = this.hoverObject as GraphEditorNode;
                        ePt = MathEx.sum(hoverNode.position, hoverNode.anchor);
                        dPt.x = this.dragPt.x - ePt.x;
                        dPt.y = this.dragPt.y - ePt.y;
                    }
                    this.updateDragNodes(this.dragObject, dPt);
                }
            }

            // Reset waiting if waiting is still active and the mouse has moved
            // too far.
            else if (MathEx.dot(dPt, dPt) > DEFAULT.NUDGE * DEFAULT.NUDGE) {
                clearTimeout(this.stickyTimeout as NodeJS.Timer);
                this.stickyTimeout = null;
                this.graph.clearSelection();
            }

            // Update the drag point.
            this.dragPt = ePt;
        }

        // Panning.
        else if (e.buttons === 2 && this.panPt) {
            this.pan(e);
            this.panPt = e;
        }

        // Hover.
        else if (e.buttons === 0) {
            const hit = this.hitPtTest(ePt);
            if (hit && hit.e instanceof GraphEditorNode && !this.graph.isValidEdge(hit.e.drawable))
                hit.pt = hit.e.drawable.origin;
            this.updateHoverObject(hit);
        }
    }

    /**
     * onMouseUp
     *   Handles the mouseup event.
     */
    private onMouseUp
    = (e: MouseEvent): void => {
        // Make sure a down event was previously captured.
        if (this.dragPt) {

            // Swap up and down events.
            this.el.nativeElement.removeEventListener(
                "mouseup",
                this.onMouseUp
            );
            this.el.nativeElement.addEventListener(
                "mousedown",
                this.onMouseDown
            );

            // Get the canvas coordinates of the event.
            const ePt = this.graphCanvas.getPt(e);

            // Set the selected graph component if waiting.
            // TODO:
            // determine whether or not this is necessary.
            if (this.stickyTimeout) {
                const hit = this.hitPtTest(ePt);
                if (hit)
                    this.graph.setSelected(hit.e.drawable);
                else
                    this.graph.clearSelection();
            }

            // Finish selecting elements if nothing is being dragged.
            else if (!this.dragObject)
                this.updateSelection(this.dragPt, ePt);

            // Drop the edge if one is being dragged.
            else if (this.dragObject && this.dragObject.isHidden) {
                this.dropEdge(this.graph, ePt);
            }

            // Drop the node if one is being dragged.
            else if (this.dragObject) {
                this.dropNodes(
                    this.dragObject,
                    MathEx.diff(this.dragPt, ePt)
                );
            }

            // Reset input states.
            this.resetState();

            // Redraw the canvas.
            this.redraw();
        }

        // Panning.
        else if (e.buttons === 2) {
            this.pan(e);
            this.panPt = null;
        }
    }

    /**
     * onWheel
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
     * onStickey
     *   Delayed mousedown event for creating nodes.
     */
    private onStickey
    = (): void => {
        // Create a new node and reset sticky.
        if (this.dragPt) {
            this.suspendRedraw();
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;

            // Create a new node and set it as the drag object.
            const drawable = this.graph.createNode();
            this.dragObject = drawable ?
                this.drawables.get(drawable) ! as GraphEditorNode :
                null;
            if (this.dragObject) {
                this.graph.clearSelection();
                this.dragObject.position = this.dragPt;
                this.dragObject.isDragging = true;
            }
            this.resumeRedraw();
        }
    }

    /**
     * onCreated
     *   Registers the edges for drawing and listening for property changed
     *   events.
     */
    private onCreated
    = (evt: DrawableEvent<DrawableElement>) => {
        for (const e of evt.detail.drawables)
            this.registerDrawable(e);
    }

    /**
     * onDeleted
     *   Unregisters the edges from drawing and removes the event listener for
     *   property changed events.
     */
    private onDeleted
    = (evt: DrawableEvent<DrawableElement>) => {
        for (const e of evt.detail.drawables) {
            this.unregisterDrawable(e);
        }
    }

    private onMovedEdge
    = (evt: MoveEdgeEvent) => {
        this.unregisterDrawable(evt.detail.original);
        this.registerDrawable(evt.detail.replacement);
    }

    /**
     * onDrawablePropertyChanged
     *
     *   Updates the drawable and refreshes the canvas if the event source is
     *   a drawable element; otherwise, updates the scale or origin of the
     *   drawable graph.
     */
    private onDrawablePropertyChanged
    = (evt: PropertyChangedEvent<any>) => {
        const drawable = evt.detail.source;
        if (drawable instanceof DrawableEdge) {
            this.drawables.get(drawable) !.update(this.graphCanvas);
            this.redraw();
        }
        else if (drawable instanceof DrawableNode) {
            if ((evt.detail.key === "shape" && evt.detail.curr === "image") ||
                (evt.detail.key === "image" && evt.detail.curr !== "" &&
                    drawable.shape === "image"))
                this.loadImage(drawable);
            else {
                this.drawables.get(drawable) !.update(this.graphCanvas);
                this.redraw();
            }
        }
        else if (drawable instanceof DrawableGraph) {
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

    private onGraphSelectionChanged
    = (evt: SelectionChangedEvent) => {
        const graph = evt.detail.source as DrawableGraph;
        for (const s of graph.selectedItems) {
            const e = this.drawables.get(s) !;
            this.selected.add(e);
            this.unselected.delete(e);
        }
        for (const u of graph.unselectedItems) {
            const e = this.drawables.get(u) !;
            this.selected.delete(e);
            this.unselected.add(e);
        }
    }


    // Register Methods ////////////////////////////////////////////////////////


    /**
     * registerEventListeners
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
     * unregisterEventListeners
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
     * registerGraph
     *   Registers event listeners for the newly bound graph.
     */
    private registerGraph(graph: DrawableGraph) {
        this.graph = graph;
        this.scale = graph.scale;
        this.origin = graph.origin;
        graph.addEventListener("created", this.onCreated);
        graph.addEventListener("deleted", this.onDeleted);
        graph.addEventListener("moved", this.onMovedEdge);
        graph.addEventListener("change", this.onDrawablePropertyChanged);
        graph.addEventListener("select", this.onGraphSelectionChanged);
        this.nodes = [];
        for (const d of [...graph.edges, ...graph.nodes])
            this.registerDrawable(d);
        this.deleteSelectedDelegate = () => {
            this.suspendRedraw();
            graph.delete(...graph.selectedItems);
            this.resumeRedraw();
        };
        this.selectAllDelegate = () => {
            this.suspendRedraw();
            graph.select(...graph.nodes);
            graph.select(...graph.edges);
            this.resumeRedraw();
        };
        this.selected.clear();
        for (const s of graph.selectedItems)
            this.selected.add(this.drawables.get(s) !);
        this.unselected.clear();
        for (const u of graph.unselectedItems)
            this.unselected.add(this.drawables.get(u) !);
    }

    /**
     * unregisterGraph
     *   Unregisters event listeners for the previously bound graph.
     */
    private unregisterGraph(graph: DrawableGraph) {
        this.deleteSelectedDelegate = MathEx.NOOP;
        this.selectAllDelegate = MathEx.NOOP;
        graph.removeEventListener("created", this.onCreated);
        graph.removeEventListener("deleted", this.onDeleted);
        graph.removeEventListener("moved", this.onMovedEdge);
        graph.removeEventListener("change", this.onDrawablePropertyChanged);
        graph.removeEventListener("select", this.onGraphSelectionChanged);
        for (const d of [...graph.edges, ...graph.nodes])
            this.unregisterDrawable(d);
        this.deleteSelectedDelegate = () => { };
        this.selectAllDelegate = () => { };
        this.selected.clear();
        this.unselected.clear();
        this.drawables.clear();
        this.nodes = [];
    }

    /**
     * registerDrawable
     *   Registers event listeners for a drawable and adds it to the draw list.
     */
    private registerDrawable(d: DrawableElement) {
        if (d instanceof DrawableEdge) {
            this.drawables.set(
                d,
                new GraphEditorEdge(
                    d,
                    this.drawables.get(d.source) as GraphEditorNode,
                    this.drawables.get(d.destination) as GraphEditorNode
                )
            );
        }
        else if (d instanceof DrawableNode) {
            const node = new GraphEditorNode(d);
            this.drawables.set(d, node);
            if (d.shape === "image")
                this.loadImage(d);
            this.nodes.push(node);
        }

        const e = this.drawables.get(d) !;
        if (d.isSelected)
            this.selected.add(e);
        else
            this.unselected.add(e);
        e.update(this.graphCanvas);
        d.addEventListener("change", this.onDrawablePropertyChanged);
        this.redraw();
    }

    /**
     * unregisterDrawable
     *   Unregisters event listeners for a drawable and removes it from the draw
     *   list.
     */
    private unregisterDrawable(d: DrawableElement) {
        if (d instanceof DrawableEdge) {
            const edge = this.drawables.get(d) as GraphEditorEdge;
            edge.source.outgoingEdges.delete(edge);
            edge.destination.incomingEdges.delete(edge);
            d.source.removeEdge(d);
            d.destination.removeEdge(d);
        }
        else if (d instanceof DrawableNode)
            this.nodes = this.nodes.filter(v => v.drawable !== d);
        const e = this.drawables.get(d) !;
        this.selected.delete(e);
        this.unselected.delete(e);
        this.drawables.delete(d);
        d.removeEventListener("change", this.onDrawablePropertyChanged);
        this.redraw();
    }


    // Update Methods //////////////////////////////////////////////////////////


    /**
     * updateSelectionBox
     *   Updates the selection box.
     */
    private updateSelectionBox(downPt: pt, ePt: pt): void {
        if (!this.selectionPt)
            this.selectionPt = downPt;
        const rect = makeRect(this.selectionPt, ePt);

        // Update the selected components.
        for (const s of [...this.selected]) {
            if (!s.hitRect(rect)) {
                this.selected.delete(s);
            }
        }
        for (const u of [...this.unselected]) {
            if (u.hitRect(rect)) {
                this.selected.add(u);
            }
        }

        // Update the draw delegate.
        this.drawSelectionBoxDelegate = () => {
            this.graphCanvas.drawSelectionBox(rect);
        };

        // Update the canvas.
        this.redraw();
    }

    private updateSelection(downPt: pt, ePt: pt): void {
        this.updateSelectionBox(downPt, ePt);
        this.graph.setSelected(...[...this.selected].map(v => v.drawable));
    }

    /**
     * updateSelected
     *   Updates the selected graph element.
     */
    private updateSelected(drawable: DrawableElement) {
        // Reset the selected item.
        if (this.graph.selectedItemCount < 2)
            this.graph.setSelected(drawable);
    }

    /**
     * updateDragObject
     *   Updates the object being dragged depending on the hovered object.
     */
    private updateDragObject() {
        // Create an edge or pick up the node if one is bing hovered.
        if (this.hoverObject instanceof GraphEditorNode) {
            // Create a new edge if an anchor pt is being displayed on the node.
            if (this.hoverObject.isAnchorVisible) {
                const n = this.hoverObject;
                const edge = this.createDragEdge(n, true);
                if (n.drawable.anchorPoints.length > 0)
                    edge.bindSourceAnchor(n.anchor);
                edge.update(this.graphCanvas);
            }

            // Set the drag object to the node if no anchor point is being displayed.
            else {
                this.dragObject = this.hoverObject;
                this.updateHoverObject(null);
                if (this.dragObject.drawable.isSelected) {
                    for (const n of this.graph.selectedNodes)
                        this.drawables.get(n) !.isDragging = true;
                }
                else {
                    this.dragObject.isDragging = true;
                }
            }
            this.redraw();
        }

        // Pick up the edge if one is being hovered.
        else if (this.hoverObject instanceof GraphEditorEdge) {
            const hoverEdge = this.hoverObject;
            const spt = hoverEdge.drawable.sourcePoint;
            const apt = (this.drawables.get(hoverEdge.drawable.source) ! as GraphEditorNode).anchor;
            const isSrc = spt.x !== apt.x || spt.y !== apt.y;
            const edge = this.createDragEdge(
                (isSrc ? hoverEdge.source : hoverEdge.destination),
                isSrc,
                hoverEdge
            );
            const n = (isSrc ? hoverEdge.drawable.source : hoverEdge.drawable.destination);
            const pt = (isSrc ? hoverEdge.drawable.sourcePoint : hoverEdge.drawable.destinationPoint);
            if (n.anchorPoints.length > 0) {
                if (isSrc)
                    edge.bindSourceAnchor(pt);
                else
                    edge.bindDestinationAnchor(pt);
            }
            this.hoverObject.isDragging = true;
            this.moveEdge = this.hoverObject;
            this.updateHoverObject(null);
            this.redraw();
        }

        // Clear the drag object if the hover object is not a node or edge.
        else if (this.dragObject) {
            this.dragObject.isDragging = false;
            this.dragObject = null;
            this.updateHoverObject(null);
            this.redraw();
        }
    }

    /**
     * updateHoverObject
     *   Updates the hovered object and hover anchor.
     */
    private updateHoverObject(value: { e: GraphEditorElement<DrawableElement>, pt: point } | null): void {

        // Update the previous hover object.
        if (this.hoverObject) {
            this.hoverObject.isHovered = false;
            if (this.hoverObject instanceof GraphEditorNode) {
                this.hoverObject.clearAnchor();
                this.hoverObject.update(this.graphCanvas);
            }
            else if (this.hoverObject instanceof GraphEditorEdge) {
                const src = this.drawables.get(this.hoverObject.drawable.source) ! as GraphEditorNode;
                const dst = this.drawables.get(this.hoverObject.drawable.destination) ! as GraphEditorNode;
                src.clearAnchor();
                dst.clearAnchor();
                src.update(this.graphCanvas);
                dst.update(this.graphCanvas);
            }
        }

        // Set the new hover object.
        if (value) {
            this.hoverObject = value.e;
            this.hoverObject.isHovered = true;

            // Display the anchor point if the hover object is an edge.
            if (value.e instanceof GraphEditorEdge) {
                const spt = value.e.drawable.sourcePoint;
                const apt = value.pt;
                const src = this.drawables.get(value.e.drawable.source) ! as GraphEditorNode;
                const dst = this.drawables.get(value.e.drawable.destination) ! as GraphEditorNode;
                if (spt.x === apt.x && spt.y === apt.y) {
                    dst.clearAnchor();
                    src.anchor = apt;
                }
                else {
                    src.clearAnchor();
                    dst.anchor = apt;
                }
                src.update(this.graphCanvas);
                dst.update(this.graphCanvas);
            }

            // Update the anchor point if the hover object is a node.
            else if (value.e instanceof GraphEditorNode) {
                if (this.graph.isValidEdge(value.e.drawable))
                    value.e.anchor = value.pt;
                else
                    value.e.clearAnchor();
                value.e.update(this.graphCanvas);
            }
        }
        else
            this.hoverObject = null;

        this.redraw();

    }

    /**
     * updateDragNodes
     *   Updates the collection of nodes being dragged.
     */
    private updateDragNodes(dragNode: GraphEditorNode, dPt: pt) {
        this.suspendRedraw();
        const selectedNodes = [...this.graph.selectedNodes];
        if (dragNode.drawable.isSelected && selectedNodes.length > 0) {
            for (const n of selectedNodes)
                this.updateDragNode(this.drawables.get(n) ! as GraphEditorNode, dPt);
        }
        else
            this.updateDragNode(dragNode, dPt);
        this.resumeRedraw();
    }

    /**
     * updateDragNode
     *   Updates a single node being dragged.
     */
    private updateDragNode(n: GraphEditorNode, dPt: pt): void {
        n.position = MathEx.diff(n.position, dPt);
        for (const e of n.drawable.edges)
            this.drawables.get(e) !.update(this.graphCanvas);
    }


    // Other Methods ///////////////////////////////////////////////////////////


    /**
     * pan
     *   Repositions the origin point of the canvas.
     */
    private pan(p: pt) {
        const prev = this.panPt;
        const curr: pt = p;
        if (prev) {
            const dp = MathEx.diff(curr, prev);
            this.graph.origin = {
                x: this.graph.origin.x + dp.x / this.graphCanvas.scale,
                y: this.graph.origin.y + dp.y / this.graphCanvas.scale
            };
        }
        this.redraw();
    }

    /**
     * zoom
     *   Updates the scale of the canvas.
     */
    private zoom(p: pt, s: number) {
        // Get the canvas coordinates before zoom.
        const pt1 = this.graphCanvas.getPt(p);
        // Apply zoom.
        this.graph.scale = this.graphCanvas.scale * s;
        // Get the canvas coordinates after zoom.
        const pt2 = this.graphCanvas.getPt(p);
        // Get the delta between pre- and post-zoom canvas pts.
        const dpt = MathEx.diff(pt2, pt1);
        // Move the canvas origin by the delta.
        this.graph.origin = MathEx.sum(this.graphCanvas.origin, dpt);
        this.redraw();
    }

    /**
     * hitPtTest
     *   Gets the first graph component that is hit by a pt.
     *
     * TODO:
     *   Should this return the entity closest to the given point?
     */
    private hitPtTest(pt: pt): { e: GraphEditorElement<DrawableElement>, pt: pt } | null {
        let hit = this.hoverObject ?
            this.hoverObject.hitPoint(pt) :
            null;
        if (hit)
            return { e: this.hoverObject!, pt: hit };
        const elements = [...this.drawables.values()].filter(v => v !== this.hoverObject);
        for (const e of elements) {
            hit = e.hitPoint(pt);
            if (hit)
                return { e: e, pt: hit };
        }
        return null;
    }

    /**
     * resetState
     *   Resets input states.
     */
    private resetState() {
        if (this.stickyTimeout) {
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;
        }
        this.drawSelectionBoxDelegate = MathEx.NOOP;
        this.dragPt = null;
        this.selectionPt = null;
        this.moveEdge = null;
        this.updateHoverObject(null);
        this.updateDragObject();
    }

    /**
     * loadImage
     *   Loads a node image.
     */
    private loadImage(node: DrawableNode) {
        // TODO:
        // Look into what Daniel was talking about SVG images and angular2.
        if (node.image !== "" && !IMAGES.has(node.image)) {
            const img = new Image();
            IMAGES.set(node.image, img);
            img.onload = () => {
                this.drawables.get(node) !.update(this.graphCanvas);
                this.redraw();
            };
            img.src = node.image;
        }
        else if (IMAGES.has(node.image)) {
            this.drawables.get(node) !.update(this.graphCanvas);
            this.redraw();
        }
    }

    /**
     * checkValidEdgeDrop
     *   Checks if dropping an edge will be successfull.
     */
    private checkValidEdgeDrop(e: DrawableEdge, pt: point): boolean {
        if (this.hoverObject && this.hoverObject.hitPoint(pt))
            return true;
        let hit: { e: GraphEditorNode, pt: point } | null = null;
        let src = e.source === HIDDEN_NODE.drawable ?
            HIDDEN_NODE :
            this.drawables.get(e.source) as GraphEditorNode;
        let dst = e.destination === HIDDEN_NODE.drawable ?
            HIDDEN_NODE :
            this.drawables.get(e.destination) as GraphEditorNode;
        const like = (this.moveEdge ? this.moveEdge.drawable : undefined);
        const nodes: GraphEditorNode[] = [];
        for (const v of this.drawables.values()) {
            if (v instanceof GraphEditorNode && v !== this.hoverObject && v !== this.dragObject)
                nodes.push(v);
        }
        // Find the first node on which the edge can be dropped.
        for (const n of nodes) {
            const hitPt = n.hitPoint(pt);
            if (hitPt && this.graph.isValidEdge(
                (src === this.dragObject ? n.drawable : src.drawable),
                (dst === this.dragObject ? n.drawable : dst.drawable),
                like
            )) {
                // Get the anchor point where the edge will be dropped.
                if (n.drawable.anchorPoints.length > 0)
                    hit = { e: n, pt: hitPt };
                else {
                    src = (src.isHidden ? n : src);
                    dst = (dst.isHidden ? n : dst);
                    const spt = (src === dst ?
                        { x: src.position.x, y: src.position.y - 1 } :
                        src.position);
                    const dpt = dst.position;
                    const u = { x: 0, y: 0 };
                    if (dst === n) {
                        u.x = spt.x - dpt.x;
                        u.y = spt.y - dpt.y;
                    }
                    else {
                        u.x = dpt.x - spt.x;
                        u.y = dpt.y - spt.y;
                    }
                    const m = MathEx.mag(u);
                    u.x /= m;
                    u.y /= m;
                    hit = { e: n, pt: n.getBoundaryPoint(u) };
                }
                break;
            }
        }

        // Indicate the node that will accept the edge.
        this.updateHoverObject(hit);

        return hit !== null;
    }

    /**
     * createDragEdge
     *   Creates a ghost edge to be dragged.
     */
    private createDragEdge(
        node: GraphEditorNode,
        isSrc: boolean,
        like?: GraphEditorEdge
    ) {
        HIDDEN_NODE.position = this.dragPt!;
        const src = (isSrc ? node : HIDDEN_NODE);
        const dst = (isSrc ? HIDDEN_NODE : node);
        const edge = new GraphEditorEdge(
            new DrawableEdge(this.graph, src.drawable, dst.drawable, (like ? like.drawable : undefined)),
            src,
            dst
        );
        edge.isDragging = true;
        edge.update(this.graphCanvas);
        this.dragObject = HIDDEN_NODE;
        this.drawables.set(edge.drawable, edge);
        this.unselected.add(edge);
        return edge;
    }

    /**
     * dropEdge
     *   Drops the dragged edge when the mouse is released.
     */
    private dropEdge(
        graph: DrawableGraph,
        pt: pt
    ): void {
        const hoverNode = this.hoverObject;
        const dragEdge = HIDDEN_NODE.edges.values().next().value;
        const like = this.moveEdge ? this.moveEdge : undefined;
        this.moveEdge = null;
        // Move or create the edge if it was dropped on a node.
        if (hoverNode instanceof GraphEditorNode) {
            this.suspendRedraw();
            const src = dragEdge.source === HIDDEN_NODE ? hoverNode : dragEdge.source;
            const dst = dragEdge.destination === HIDDEN_NODE ? hoverNode : dragEdge.destination;
            const drawable = like ?
                this.graph.moveEdge(src.drawable, dst.drawable, like.drawable) :
                this.graph.createEdge(src.drawable, dst.drawable);
            if (drawable) {
                const edge = this.drawables.get(drawable) as GraphEditorEdge;
                if (src.drawable.anchorPoints.length > 0)
                    edge.bindSourceAnchor(dragEdge.drawable.sourcePoint);
                if (dst.drawable.anchorPoints.length > 0)
                    edge.bindSourceAnchor(dragEdge.drawable.destinationPoint);
                this.updateSelected(drawable);
            }
            this.resumeRedraw();
        }
        // Update the original edge if one was being moved.
        else if (like) {
            like.isDragging = false;
            this.updateSelected(like.drawable);
        }
        dragEdge.drawable.source.removeEdge(dragEdge.drawable);
        dragEdge.drawable.destination.removeEdge(dragEdge.drawable);
        dragEdge.source.outgoingEdges.delete(dragEdge);
        dragEdge.destination.incomingEdges.delete(dragEdge);
        this.drawables.delete(dragEdge.drawable);
        this.selected.delete(dragEdge);
        this.unselected.delete(dragEdge);
    }

    /**
     * dropNodes
     *   Drops the collection of nodes or single node that is being dragged
     *   when the mouse is released.
     */
    private dropNodes(dragNode: GraphEditorNode, pt: pt): void {
        this.updateDragNodes(dragNode, pt);
        if (dragNode.drawable.isSelected) {
            for (const n of this.graph.selectedNodes)
                this.drawables.get(n) !.isDragging = false;
        }
        else
            dragNode.isDragging = false;
        //
        // TODO:
        // Pevent nodes from being dropped on top of eachother.
        //
        this.updateSelected(dragNode.drawable);
    }

    private drawTree(
        e: GraphEditorElement<DrawableElement>,
        visited: Set<GraphEditorElement<DrawableElement>>
    ) {
        if (!visited.has(e)) {
            visited.add(e);
            if (e instanceof GraphEditorNode) {
                for (const edge of e.edges)
                    this.drawTree(edge, visited);
                e.draw(this.graphCanvas);
            }
            else if (e instanceof GraphEditorEdge) {
                e.draw(this.graphCanvas);
                this.drawTree(e.source, visited);
                this.drawTree(e.destination, visited);
            }
        }
    }

}
