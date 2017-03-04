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
    DrawableEventArgs,
    DrawableGraph,
    EdgeValidator
} from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode, HiddenNode } from "./drawable-node";
import { PropertyChangedEventArgs } from "./events";
import * as DEFAULT from "./defaults";
import * as MathEx from "./math";


// Re-exports //////////////////////////////////////////////////////////////////


export {
    DrawableGraph,
    EdgeValidator,
    DrawableEdgeEventListener,
    DrawableEdgeEventArgs,
    DrawableNodeEventListener,
    DrawableNodeEventArgs,
    CreatedOrDeletedEventArgs,
    CreatedOrDeletedEvent
} from "./drawable-graph";
export { Drawable } from "./drawable";
export { DrawableElement } from "./drawable-element";
export { DrawableEdge } from "./drawable-edge";
export { DrawableNode } from "./drawable-node";
export { LineStyles, Shapes } from "./graph-editor-canvas";
export { PropertyChangedEventArgs } from "./events";


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


    @ViewChild("hiddenInput")
    private hiddenInputElementRef: ElementRef;

    /**
     * canvasElementRef
     *   Reference to the canvas child element.
     */
    @ViewChild("sinapGraphEditorCanvas")
    private canvasElementRef: ElementRef;

    /**
     * canvas
     *   The graph editor canvas.
     */
    private canvas: GraphEditorCanvas;

    /**
     * graph
     *   The graph object.
     */
    private graph: DrawableGraph;

    /**
     * oldGraph
     *   The previous graph for unhooking events.
     */
    private oldGraph: DrawableGraph | null;

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
    private dragObject: DrawableNode | null
    = null;

    /**
     * hoverObject
     *   The graph component over which the cursor is hovering.
     */
    private hoverObject: DrawableElement | null
    = null;

    /**
     * moveEdge
     *   The edge to be replaced once the new edge has been created.
     */
    private moveEdge: DrawableEdge | null
    = null;

    /**
     * drawList
     *   Maintains the draw order of drawable elements.
     */
    private drawList: DrawableElement[]
    = [];

    /**
     * redrawDelegate
     *   For suspending and resuming draw calls.
     */
    private redrawDelegate: callback
    = MathEx.NOOP;

    private deleteSelectedDelegate: callback
    = MathEx.NOOP;

    private selectAllDelegate: callback
    = MathEx.NOOP;

    private drawSelectionBoxDelegate: callback
    = MathEx.NOOP;


    // Public Fields ///////////////////////////////////////////////////////////


    /**
     * setGraph
     *   Input property for the graph.
     */
    @Input("graph")
    set setGraph(value: DrawableGraph | null) {
        if (this.oldGraph)
            this.unregisterGraph(this.oldGraph);

        if (value) {
            this.oldGraph = this.graph;
            this.suspendRedraw();
            this.registerGraph(value);
            this.registerEventListeners();
            this.resumeRedraw();
        }
        else {
            this.oldGraph = null;
            this.unregisterEventListeners();
            this.suspendRedraw();
            this.panPt = null;
            this.dragPt = null;
            this.stickyTimeout = null;
            this.dragObject = null;
            this.hoverObject = null;
            this.moveEdge = null;
            this.drawList = [];
            if (this.canvas)
                this.canvas.clear();
        }
        this.redraw();
    }

    /**
     * suspendRedraw
     *   Suspends updates to the canvas.
     */
    suspendRedraw() {
        this.redrawDelegate = MathEx.NOOP;
    }

    /**
     * resumeRedraw
     *   Resumes updates to the canvas and forces a redraw.
     */
    resumeRedraw() {
        if (this.canvas) {
            this.redrawDelegate = () => {
                this.canvas.clear();
                for (const d of this.graph.selectedItems)
                    d.drawSelectionShadow();
                this.canvas.globalCompositeOperation = "source-in";
                this.canvas.clear(DEFAULT.SELECTION_COLOR);
                this.canvas.globalCompositeOperation = "source-over";
                for (const d of this.drawList)
                    d.draw();
                this.canvas.globalCompositeOperation = "destination-over";
                this.canvas.drawGrid();
                this.canvas.clear("#fff");
                this.canvas.globalCompositeOperation = "source-over";
                this.drawSelectionBoxDelegate();
            };
            this.redrawDelegate();
        }
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

    /**
     * scale
     *   Sets the scaling factor of the canvas.
     */
    set scale(value: num) {
        if (this.canvas)
            this.canvas.scale = value;
    }

    /**
     * origin
     *   Sets the origin pt of the canvas.
     */
    set origin(value: pt) {
        if (this.canvas)
            this.canvas.origin = value;
    }


    // Public Methods //////////////////////////////////////////////////////////


    /**
     * ngAfterViewInit
     *   Gets the canvas rendering context and resizes the canvas element.
     */
    ngAfterViewInit() {
        this.canvas = new GraphEditorCanvas(
            this.canvasElementRef.nativeElement.getContext("2d")
        );
        this.resize();
    }

    /**
     * resize
     *   Resizes the canvas.
     */
    resize(): void {
        const el = this.canvasElementRef.nativeElement;
        const pel = (el.parentNode as HTMLElement);
        const h = pel.offsetHeight;
        const w = pel.offsetWidth;
        if (this.canvas.size.h !== h || this.canvas.size.w !== w) {
            this.canvas.size = { h: h, w: w };
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
    get redraw() {
        return this.redrawDelegate;
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
        this.focusHiddenArea();
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
                this.dragPt = this.canvas.getPt(e);

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
        let ePt = this.canvas.getPt(e);

        // Capture the down event if the drag object has been set.
        if (this.dragObject && e.buttons === 1 && !this.dragPt)
            this.dragPt = this.canvas.getPt(e);

        // Make sure the down event was previously captured.
        if (this.dragPt) {
            this.focusHiddenArea();
            this.el.nativeElement.style.cursor = "default";

            // Get the change in x and y locations of the cursor.
            const dPt = MathEx.subtract(this.dragPt, ePt);

            // Update the canvas if waiting is not set.
            if (!this.stickyTimeout) {

                // Update the selection box if selecting.
                if (!this.dragObject)
                    this.updateSelectionBox(this.dragPt, ePt);

                // Update node position.
                else {
                    if (this.dragObject.isHidden &&
                        this.checkValidEdgeDrop(
                            this.dragObject.edges.values().next().value,
                            ePt
                        )) {
                        ePt = (this.hoverObject as DrawableNode).anchorPoint;
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
            this.updateHoverObject(this.hitPtTest(ePt));
        }
    }

    /**
     * onMouseUp
     *   Handles the mouseup event.
     */
    private onMouseUp
    = (e: MouseEvent): void => {
        this.focusHiddenArea();

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
            const ePt = this.canvas.getPt(e);

            // Set the selected graph component if waiting.
            if (this.stickyTimeout) {
                this.graph.clearSelection();
                const hit = this.hitPtTest(ePt);
                if (hit)
                    this.graph.select(hit.d);
            }

            // Drop the edge if one is being dragged.
            else if (this.dragObject && this.dragObject.isHidden) {
                this.dropEdge(this.graph, ePt);
            }

            // Drop the node if one is being dragged.
            else if (this.dragObject) {
                this.dropNodes(
                    this.dragObject,
                    MathEx.subtract(this.dragPt, ePt)
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
            this.zoom(e, 1 / 1.1);
        else if (e.deltaY < 0)
            this.zoom(e, 1.1);
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
            this.dragObject = this.graph.createNode();
            if (this.dragObject) {
                this.graph.clearSelection();
                this.dragObject.position = this.dragPt;
                this.dragObject.isDragging = true;
            }
            this.resumeRedraw();
        }
    }

    /**
     * onCreatedEdges
     *   Registers the edges for drawing and listening for property changed
     *   events.
     */
    private onCreatedEdges
    = (evt: DrawableEventArgs<DrawableEdge>) => {
        for (const e of evt.drawables)
            this.registerDrawable(e);
    }

    /**
     * onCreatedNode
     *   Registers the nodes for drawing and listening for property changed
     *   events.
     */
    private onCreatedNodes
    = (evt: DrawableEventArgs<DrawableNode>) => {
        for (const n of evt.drawables)
            this.registerDrawable(n);
    }

    /**
     * onDeletedEdges
     *   Unregisters the edges from drawing and removes the event listener for
     *   property changed events.
     */
    private onDeletedEdges
    = (evt: DrawableEventArgs<DrawableEdge>) => {
        for (const e of evt.drawables) {
            this.unregisterDrawable(e);
        }
    }

    /**
     * onDeletedNodes
     *   Unregisters the nodes from drawing and removes the event listener for
     *   property changed events.
     */
    private onDeletedNodes
    = (evt: DrawableEventArgs<DrawableNode>) => {
        for (const e of evt.drawables)
            this.unregisterDrawable(e);
    }

    /**
     * onDrawablePropertyChanged
     *   Updates the drawable and refreshes the canvas if the event source is
     *   a drawable element; otherwise, updates the scale or origin of the
     *   drawable graph.
     */
    private onDrawablePropertyChanged
    = (evt: PropertyChangedEventArgs<any>) => {
        if (evt.source instanceof DrawableEdge) {
            evt.source.update(this.canvas);
            this.redraw();
        }
        else if (evt.source instanceof DrawableNode) {
            if ((evt.key === "shape" && evt.curr === "image") ||
                (evt.key === "image" && evt.curr !== "" &&
                    evt.source.shape === "image"))
                this.loadImage(evt.source);
            else {
                evt.source.update(this.canvas);
                this.redraw();
            }
        }
        else if (evt.source instanceof DrawableGraph) {
            switch (evt.key) {
                case "origin":
                    this.origin = evt.source[evt.key];
                    break;
                case "scale":
                    this.scale = evt.source[evt.key];
                    break;
            }
        }
    }


    // Register Methods ////////////////////////////////////////////////////////


    /**
     * registerEventListeners
     *   Registers input event listeners.
     */
    private registerEventListeners() {
        const el = this.el.nativeElement as EventTarget;
        const hidden = this.hiddenInputElementRef.nativeElement as EventTarget;
        el.addEventListener("mousedown", this.onMouseDown);
        el.addEventListener("mousemove", this.onMouseMove);
        el.addEventListener("wheel", this.onWheel);
        // TODO:
        // Use touch events to handle gesture pan and zoom.
        // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
        el.addEventListener("touchstart", (e: TouchEvent) => console.log(e));
        el.addEventListener("touchend", (e: TouchEvent) => console.log(e));
        hidden.addEventListener("copy", this.onCopy);
        hidden.addEventListener("cut", this.onCut);
        hidden.addEventListener("paste", this.onPaste);
    }

    /**
     * unregisterEventListeners
     *   Unregisters event listeners.
     */
    private unregisterEventListeners() {
        const el = this.el.nativeElement as EventTarget;
        const hidden = this.hiddenInputElementRef.nativeElement as EventTarget;
        el.removeEventListener("mousedown", this.onMouseDown);
        el.removeEventListener("mouseup", this.onMouseUp);
        el.removeEventListener("mousemove", this.onMouseMove);
        el.removeEventListener("wheel", this.onWheel);
        // TODO:
        // remove touch event listeners.
        hidden.removeEventListener("copy", this.onCopy);
        hidden.removeEventListener("cut", this.onCut);
        hidden.removeEventListener("paste", this.onPaste);
    }

    /**
     * registerGraph
     *   Registers event listeners for the newly bound graph.
     */
    private registerGraph(g: DrawableGraph) {
        this.graph = g;
        this.scale = g.scale;
        this.origin = g.origin;
        g.addCreatedEdgeListener(this.onCreatedEdges);
        g.addCreatedNodeListener(this.onCreatedNodes);
        g.addDeletedEdgeListener(this.onDeletedEdges);
        g.addDeletedNodeListener(this.onDeletedNodes);
        g.addPropertyChangedListener(this.onDrawablePropertyChanged);
        this.drawList = [];
        for (const d of [...g.edges, ...g.nodes])
            this.registerDrawable(d);
        this.deleteSelectedDelegate = () => {
            this.suspendRedraw();
            g.delete(...g.selectedItems);
            this.resumeRedraw();
        };
        this.selectAllDelegate = () => {
            this.suspendRedraw();
            g.select(...g.nodes);
            g.select(...g.edges);
            this.resumeRedraw();
        };
    }

    /**
     * unregisterGraph
     *   Unregisters event listeners for the previously bound graph.
     */
    private unregisterGraph(g: DrawableGraph) {
        this.deleteSelectedDelegate = MathEx.NOOP;
        this.selectAllDelegate = MathEx.NOOP;
        g.removeCreatedEdgeListener(this.onCreatedEdges);
        g.removeCreatedNodeListener(this.onCreatedNodes);
        g.removeDeletedEdgeListener(this.onDeletedEdges);
        g.removeDeletedNodeListener(this.onDeletedNodes);
        g.removePropertyChangedListener(this.onDrawablePropertyChanged);
        for (const d of [...g.edges, ...g.nodes])
            this.unregisterDrawable(d);
    }

    /**
     * registerDrawable
     *   Registers event listeners for a drawable and adds it to the draw list.
     */
    private registerDrawable(d: DrawableElement) {
        if (this.drawList.findIndex(v => v === d) < 0)
            this.drawList.push(d);
        if (d instanceof DrawableEdge) {
            this.drawList = this.drawList.filter(v => {
                return v !== d.source && v !== d.destination;
            });
            this.drawList.push(d.destination, d.source);
        }
        if (d instanceof DrawableNode && d.shape === "image")
            this.loadImage(d);
        else
            d.update(this.canvas);
        d.addPropertyChangedListener(this.onDrawablePropertyChanged);
        this.redraw();
    }

    /**
     * unregisterDrawable
     *   Unregisters event listeners for a drawable and removes it from the draw
     *   list.
     */
    private unregisterDrawable(d: DrawableElement) {
        this.drawList = this.drawList.filter(v => v !== d);
        d.removePropertyChangedListener(this.onDrawablePropertyChanged);
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
        const deselect = [];
        const select = [];
        for (const i of [...this.graph.edges, ...this.graph.nodes]) {
            if (i.hitRect(rect))
                select.push(i);
            else
                deselect.push(i);
        }
        this.graph.select(...select);
        this.graph.deselect(...deselect);

        // Update the draw delegate.
        this.drawSelectionBoxDelegate = () => {
            this.canvas.drawSelectionBox(rect);
        };

        // Update the canvas.
        this.redraw();
    }

    /**
     * updateSelected
     *   Updates the selected graph element.
     */
    private updateSelected(dragObject: DrawableEdge | DrawableNode) {
        // Reset the selected item.
        if (this.graph.selectedItemCount < 2) {
            this.graph.clearSelection();
            this.graph.select(dragObject);
        }
    }

    /**
     * updateDragObject
     *   Updates the object being dragged depending on the hovered object.
     */
    private updateDragObject() {
        // Create an edge or pick up the node if one is bing hovered.
        if (this.hoverObject instanceof DrawableNode) {
            // Create a new edge if an anchor pt is being displayed on the node.
            if (this.hoverObject.isAnchorVisible) {
                const n = this.hoverObject;
                const edge = this.createDragEdge(n, true);
                if (n.anchorPoints.length > 0)
                    edge.bindAnchor(n, n.getNearestAnchor(n.anchorPoint));
                edge.update(this.canvas);
            }

            // Set the drag object to the node if no anchor point is being displayed.
            else {
                this.dragObject = this.hoverObject;
                this.updateHoverObject(null);
                this.dragObject.isDragging = true;
                const edges = this.dragObject.edges;
                const replace: DrawableEdge[] = [];
                const remove: DrawableEdge[] = [];
                this.drawList = this.drawList.filter(v => {
                    if (v instanceof DrawableEdge && edges.has(v)) {
                        if (edges.has(v))
                            replace.push(v);
                        else
                            remove.push(v);
                    }
                    return v !== this.dragObject && !edges.has(v as DrawableEdge);
                });
                this.drawList.push(...replace, this.dragObject);
                for (const v of remove)
                    this.dragObject.removeEdge(v);
            }
            this.redraw();
        }

        // Pick up the edge if one is being hovered.
        else if (this.hoverObject instanceof DrawableEdge) {
            const spt = this.hoverObject.sourcePoint;
            const apt = this.hoverObject.source.anchorPoint;
            const isSrc = spt.x !== apt.x || spt.y !== apt.y;
            const edge = this.createDragEdge(
                (isSrc ? this.hoverObject.source : this.hoverObject.destination),
                isSrc,
                this.hoverObject
            );
            const n = (isSrc ? this.hoverObject.destination : this.hoverObject.source);
            const pt = (isSrc ? this.hoverObject.destinationPoint : this.hoverObject.sourcePoint);
            if (n.anchorPoints.length > 0)
                edge.bindAnchor(n, n.getNearestAnchor(pt));
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
    private updateHoverObject(value: { d: DrawableElement, pt: point } | null): void {

        // Update the previous hover object.
        if (this.hoverObject) {
            this.hoverObject.isHovered = false;
            if (this.hoverObject instanceof DrawableNode) {
                this.hoverObject.clearAnchor();
                this.hoverObject.updateDraw(this.canvas);
            }
            else if (this.hoverObject instanceof DrawableEdge) {
                this.hoverObject.source.clearAnchor();
                this.hoverObject.destination.clearAnchor();
                this.hoverObject.source.updateDraw(this.canvas);
                this.hoverObject.destination.updateDraw(this.canvas);
            }
        }

        // Set the new hover object.
        if (value) {
            this.hoverObject = value.d;
            value.d.isHovered = true;

            // Display the anchor point if the hover object is an edge.
            if (value.d instanceof DrawableEdge) {
                const spt = value.d.sourcePoint;
                const apt = value.pt;
                if (spt.x === apt.x && spt.y === apt.y) {
                    value.d.destination.clearAnchor();
                    value.d.source.anchorPoint = apt;
                }
                else {
                    value.d.source.clearAnchor();
                    value.d.destination.anchorPoint = apt;
                }
                value.d.source.updateDraw(this.canvas);
                value.d.destination.updateDraw(this.canvas);
            }

            // Update the anchor point if the hover object is a node.
            else if (value.d instanceof DrawableNode) {
                if (this.graph.isValidEdge(value.d))
                    value.d.anchorPoint = value.pt;
                else
                    value.d.clearAnchor();
                value.d.updateDraw(this.canvas);
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
    private updateDragNodes(dragNode: DrawableNode, dPt: pt) {
        this.suspendRedraw();
        if (dragNode.isSelected && this.graph.selectedItemCount > 0) {
            for (const d of this.graph.selectedItems)
                if (d instanceof DrawableNode)
                    this.updateDragNode(d, dPt);
        }
        else
            this.updateDragNode(dragNode, dPt);
        this.resumeRedraw();
    }

    /**
     * updateDragNode
     *   Updates a single node being dragged.
     */
    private updateDragNode(n: DrawableNode, dPt: pt): void {
        n.position = MathEx.subtract(n.position, dPt);
        for (const e of n.edges)
            e.update(this.canvas);
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
            const dp = MathEx.subtract(curr, prev);
            this.canvas.origin.x += dp.x / this.canvas.scale;
            this.canvas.origin.y += dp.y / this.canvas.scale;
        }
        this.redraw();
    }

    /**
     * zoom
     *   Updates the scale of the canvas.
     */
    private zoom(p: pt, s: number) {
        // Get the canvas coordinates before zoom.
        const pt1 = this.canvas.getPt(p);
        // Apply zoom.
        this.scale = this.canvas.scale * s;
        // Get the canvas coordinates after zoom.
        const pt2 = this.canvas.getPt(p);
        // Get the delta between pre- and post-zoom canvas pts.
        const dpt = MathEx.subtract(pt2, pt1);
        // Move the canvas origin by the delta.
        this.origin = MathEx.add(this.canvas.origin, dpt);
        this.redraw();
    }

    private focusHiddenArea() {
        this.hiddenInputElementRef.nativeElement.value = " ";
        this.hiddenInputElementRef.nativeElement.focus();
    }

    /**
     * hitPtTest
     *   Gets the first graph component that is hit by a pt.
     *
     * TODO:
     *   Should this return the entity closest to the given point?
     */
    private hitPtTest(pt: pt): { d: DrawableElement, pt: pt } | null {
        let hit = null;
        for (const n of this.drawList.filter(v => v instanceof DrawableNode)) {
            hit = n.hitPoint(pt);
            if (hit)
                return { d: n, pt: hit };
        }
        for (const e of this.drawList.filter(v => v instanceof DrawableEdge)) {
            hit = e.hitPoint(pt);
            if (hit)
                return { d: e, pt: hit };
        }
        return hit;
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
    private loadImage(n: DrawableNode) {
        if (n.image !== "" && !IMAGES.has(n.image)) {
            const img = new Image();
            IMAGES.set(n.image, img);
            img.onload = () => {
                n.update(this.canvas);
                this.redraw();
            };
            img.src = n.image;
        }
    }

    /**
     * checkValidEdgeDrop
     *   Checks if dropping an edge will be successfull.
     */
    private checkValidEdgeDrop(e: DrawableEdge, pt: point): boolean {
        let hit: { d: DrawableNode, pt: point } | null = null;
        let src = e.source;
        let dst = e.destination;
        const like = (this.moveEdge ? this.moveEdge : undefined);
        const nodes = this.drawList.filter(v => {
            return v instanceof DrawableNode;
        }) as DrawableNode[];

        // Find the first node on which the edge can be dropped.
        for (const n of nodes) {
            const d = n;
            const hitPt = n.hitPoint(pt);
            if (hitPt && this.graph.isValidEdge(
                (src === this.dragObject ? d : src),
                (dst === this.dragObject ? d : dst),
                like
            )) {
                // Get the anchor point where the edge will be dropped.
                if (n.anchorPoints.length > 0)
                    hit = { d: n, pt: hitPt };
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
                    hit = { d: n, pt: n.getBoundaryPt(u) };
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
        n: DrawableNode,
        isSrc: boolean,
        like?: DrawableEdge
    ) {
        const h = new HiddenNode(this.graph);
        h.position = this.dragPt!;
        const src = (isSrc ? n : h);
        const dst = (isSrc ? h : n);
        const bnd = (isSrc ? src : dst);
        const d = new DrawableEdge(this.graph, src, dst, like);
        d.isDragging = true;
        this.dragObject = h;
        this.drawList.push(d);
        return d;
    }

    /**
     * dropEdge
     *   Drops the dragged edge when the mouse is released.
     */
    private dropEdge(
        graph: DrawableGraph,
        pt: pt
    ): void {
        const e = this.drawList.pop() as DrawableEdge;
        const like = (this.moveEdge ? this.moveEdge : undefined);
        this.moveEdge = null;
        // Move or create the edge if it was dropped on a node.
        if (this.hoverObject instanceof DrawableNode) {
            this.suspendRedraw();
            let srcNode = (e.source.isHidden ? this.hoverObject : e.source);
            let dstNode = (e.destination.isHidden ? this.hoverObject : e.destination);
            const edge = (like ? this.graph.moveEdge(srcNode, dstNode, like) : this.graph.createEdge(srcNode, dstNode, like));
            e.source.removeEdge(e);
            e.destination.removeEdge(e);
            if (edge)
                this.updateSelected(edge);
            this.resumeRedraw();
        }
        // Update the original edge if one was being moved.
        else if (like) {
            like.isDragging = false;
            this.updateSelected(like);
        }
    }

    /**
     * dropNodes
     *   Drops the collection of nodes or single node that is being dragged
     *   when the mouse is released.
     */
    private dropNodes(dragNode: DrawableNode, pt: pt): void {
        const posn = dragNode.position;
        this.updateDragNodes(dragNode, pt);
        //
        // TODO:
        // Pevent nodes from being dropped on top of eachother.
        //
        this.updateSelected(dragNode);
    }

}
