// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


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
import * as MathEx from "./math";

import { GraphEditorCanvas, point, rect } from "./canvas";
import {
    cloneEdge,
    DefaultEdge,
    Drawable,
    DrawableEdge,
    DrawableNode,
    DrawableGraph,
    getOverlappedEdges,
    isDrawableEdge,
    isDrawableNode
} from "./drawable-interfaces";


// Re-exports //////////////////////////////////////////////////////////////////


export {
    DrawableGraph,
    DrawableEdge,
    DrawableNode,
    isDrawableEdge,
    isDrawableNode,
    Drawable,
    LineStyles,
    Shapes
} from "./drawable-interfaces";


// Type aliases ////////////////////////////////////////////////////////////////


type callback = () => void;
type DrawMap = Map<Drawable, callback>;
type DrawList = Array<Drawable>;
type EdgePointMap = Map<DrawableEdge, point[]>;
type NodeDimensionMap = Map<DrawableNode, any>;
type EdgeSet = Set<DrawableEdge>;
type NodeEdgeMap = Map<DrawableNode, EdgeSet>;


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


    // Constructor /////////////////////////////////////////////////////////////


    constructor(private el: ElementRef) {
        this.removePublicMethods();
    }


    // Private Fields //////////////////////////////////////////////////////////


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
     * panPt  
     *   The previous point from panning the canvas.
     */
    private panPt: point | null = null;

    /**
     * zoom  
     *   Zoom levels from input events.
     */
    private zoom: { level: number, min: number, max: number } =
    { level: 0, min: -5, max: 5 };

    /**
     * downEvt  
     *   The previous down event payload.
     */
    private downEvt: MouseEvent | null = null;

    /**
     * stickyTimeout  
     *   Timer reference for the sticky delay.
     */
    private stickyTimeout: NodeJS.Timer | number | null = null;

    /**
     * dragObect  
     *   The graph component being dragged by the cursor.
     */
    private dragObject: Drawable | null = null;

    /**
     * hoverObject  
     *   The graph component over which the cursor is hovering.
     */
    private hoverObject: Drawable | null = null;

    /**
     * hoverAnchor  
     *   The node with its associated anchor point being hovered over.
     * 
     *  TODO:
     *  Make use of this
     */
    private hoverAnchor: { d: DrawableNode | null, pt: point } =
    { d: null, pt: { x: 0, y: 0 } };

    /**
     * moveEdge  
     *   The edge to be replaced once the new edge has been created.
     */
    private moveEdge: DrawableEdge | null = null;

    /**
     * unselectedItems  
     *   The set of unselected graph components.
     */
    private unselectedItems: Set<Drawable> = new Set<Drawable>();

    /**
     * senectedItems  
     *   The set of selected graph components.
     */
    private selectedItems: Set<Drawable>;

    /**
     * selectedDrawMap  
     *   Maps drawable elements to draw functions for the selection outline.
     */
    private selectedDrawMap: DrawMap = new Map<Drawable, callback>();

    /**
     * drawMap  
     *   Maps drawable nodes and edges to draw functions.
     */
    private drawMap: DrawMap = new Map<Drawable, callback>();

    /**
     * drawList  
     *   Maintains the draw order of drawable graph elements.
     */
    private drawList: DrawList = new Array<Drawable>();

    /**
     * edgePoints  
     *   Maps edges to points.  
     * 
     *   The first two points are the end points; the third point is the
     *   midpoint. All other points are control points for bezier curves.
     */
    private edgePoints: EdgePointMap = new Map<DrawableEdge, point[]>();

    /**
     * nodeDimensions  
     *   Maps nodes to geometry dimensions.
     */
    private nodeDimensions: NodeDimensionMap = new Map<DrawableNode, any>();

    /**
     * nodeEdges  
     *   Maps nodes to incoming and outgoing edges.
     */
    private nodeEdges: NodeEdgeMap = new Map<DrawableNode, EdgeSet>();


    // Public Fields ///////////////////////////////////////////////////////////


    /**
     * selectionChanged  
     *   An event emitter that is emitted when the selected items is changed.
     */
    @Output()
    selectionChanged = new EventEmitter();

    /**
     * setGraph  
     *   Input property for the graph context.
     */
    @Input("graph")
    set setGraph(value: DrawableGraph | null) {
        if (value) {
            this.graph = value;
            this.selectedItems = value.selectedItems;
            this.scale = value.scale;
            this.origin = value.origin;
            this.initDrawables();
            this.addEventListeners(this.el.nativeElement);
            this.addPublicMethods();
        }
        else {
            this.removeEventListeners(this.el.nativeElement);
            this.removePublicMethods();
        }
        this.redraw();
    }

    /**
     * dragNode  
     *   Sets the node being dragged by the cursor.
     */
    @Input()
    dragNode(value: DrawableNode) {
        this.dragObject = value;
    }

    /**
     * scale  
     *   Sets the scaling factor of the canvas.
     */
    @Input()
    set scale(value: number) {
        this.setScaleDelegate(value);
    }

    // TODO:
    // scaleChanged @Output

    /**
     * origin  
     *   Sets the origin point of the canvas.
     */
    set origin(value: point) {
        this.setOriginDelegate(value);
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
     * clearSelected  
     *   Clears the selected items.
     */
    clearSelected(): void {
        this.clearSelectedDelegate();
    }

    /**
     * update  
     *   Temporary to force update drawable element geometries.
     * 
     *   TODO:
     *   Replace this with property binding on drawable elements.
     */
    update(d: Drawable | DrawableGraph, key: string) {
        setTimeout(() => {
            if (isDrawableNode(d)) {
                this.updateNodeDimensions(d);
                for (const e of (this.nodeEdges.get(d) as EdgeSet)) {
                    this.updateEdgePoints(e);
                    this.updateDrawable(e);
                }
            }
            else if (isDrawableEdge(d))
                this.updateDrawable(d);
            this.redraw();
        }, 0);
    }

    /**
     * resize  
     *   Resizes the canvas.
     */
    resize(): void {
        let el = this.canvasElementRef.nativeElement;
        let pel = (el.parentNode as HTMLElement);
        let h = pel.offsetHeight;
        let w = pel.offsetWidth;
        this.canvas.size = { h: h, w: w };
        this.redraw();
    }

    /**
     * redraw  
     *   Redraws the graph.
     */
    redraw(): void {
        this.redrawDelegate();
    }


    // Delegates ///////////////////////////////////////////////////////////////


    /**
     * onKeyDown  
     *   Handles the delete key.
     * 
     * Note:
     *   I don't like where this is.
     */
    private onKeyDown = (e: KeyboardEvent): void => {
        // Delete keyCode is 46; backspace is 8.
        if (e.keyCode == 46 || e.keyCode == 8) {
            let remove = [...this.selectedItems];
            for (const item of remove) {
                if (isDrawableEdge(item))
                    this.removeEdge(this.graph, item);
                else if (isDrawableNode(item))
                    this.removeNode(this.graph, item);
            }
            this.clearSelected();
            this.redraw();
        }
    }

    /**
     * onMouseDown  
     *   Handles the mousedown event.
     */
    private onMouseDown = (e: MouseEvent): void => {

        switch (e.buttons) {
            // Handle the left mouse button event.
            case 1:
                // Swap up and down events.
                this.el.nativeElement.removeEventListener(
                    "mousedown",
                    this.onMouseDown
                );
                this.el.nativeElement.addEventListener(
                    "mouseup",
                    this.onMouseUp
                );

                // Clear the hover object.
                this.updateHoverObject(null);

                // Save the event payload.
                this.downEvt = e;

                // Set a timeout.
                this.stickyTimeout = (this.stickyTimeout ?
                    this.stickyTimeout :
                    setTimeout(this.onStickey, CONST.STICKY_DELAY));
                break;

            // Handle the right mouse button event.
            case 2:
                // Capture the down point.
                this.panPt = e;
                break;
        }
    }

    /**
     * onMouseMove  
     *   Handles the mousemove event.
     */
    private onMouseMove = (e: MouseEvent): void => {
        let ePt = this.canvas.getPt(e);

        // Capture the down event if the drag object has been set.
        if (this.dragObject && e.buttons == 1 && !this.downEvt)
            this.downEvt = e;

        // Make sure the down event was previously captured.
        if (this.downEvt) {

            // Get the change in x and y locations of the cursor.
            let downPt = this.canvas.getPt(this.downEvt);
            let dPt = { x: downPt.x - ePt.x, y: downPt.y - ePt.y };

            // Update the canvas if waiting is not set.
            if (!this.stickyTimeout) {

                // Update the selection box if selecting.
                if (!this.dragObject)
                    this.updateSelectionBox(downPt, ePt);

                // Update node position if dragging node.
                else if (isDrawableNode(this.dragObject))
                    this.updateDragNodes(
                        this.dragObject,
                        {
                            x: ePt.x - this.dragObject.position.x,
                            y: ePt.y - this.dragObject.position.y
                        }
                    );

                // Update edge endpoint if dragging edge.
                else if (isDrawableEdge(this.dragObject)) {
                    this.updateEdgePoints(this.dragObject, ePt);
                    this.updateDrawable(this.dragObject);
                    this.redraw();
                }
            }

            // Reset waiting if waiting is still active and the mouse has moved
            // too far.
            else if (MathEx.dot(dPt, dPt) > CONST.NUDGE * CONST.NUDGE) {
                clearTimeout(this.stickyTimeout as NodeJS.Timer);
                this.stickyTimeout = null;

                // Check the drag object.
                let hit = this.hitTest(ePt);

                // Clear the selection if nothing was hit.
                if (!hit)
                    this.clearSelected();

                // Update the drag object if it is a node.
                else if (isDrawableNode(hit.d)) {
                    this.dragObject = hit.d;
                    this.updateDrawable(this.dragObject);
                }

                // Clear the drag object if it is an edge.
                //
                // TODO:
                // Maybe don't clear the drag object if it is an edge.
                else
                    this.dragObject = null;
            }
        }

        // Panning.
        else if (e.buttons == 2) {
            this.pan(e);
            this.panPt = e;
        }

        // Hover.
        else if (e.buttons === 0) {
            this.updateHoverObject(this.hitTest(ePt));
        }
    }

    /**
     * onMouseUp  
     *   Handles the mouseup event.
     */
    private onMouseUp = (e: MouseEvent): void => {

        // Make sure a down event was previously captured.
        if (this.downEvt) {

            // Swap up and down events.
            this.el.nativeElement.removeEventListener(
                "mouseup",
                this.onMouseUp
            )
            this.el.nativeElement.addEventListener(
                "mousedown",
                this.onMouseDown
            );

            // Get the canvas coordinates of the event.
            let ePt = this.canvas.getPt(e);

            // Set the selected graph component if waiting.
            if (this.stickyTimeout) {
                this.clearSelected();
                let hit = this.hitTest(ePt);
                if (hit &&
                    (isDrawableNode(hit.d) || isDrawableEdge(hit.d)))
                    this.addSelectedItem(hit.d);
            }

            // Drop the node if one is being dragged.
            else if (isDrawableNode(this.dragObject)) {
                this.dropNodes(this.dragObject, ePt);
            }

            // Drop the edge if one is being dragged.
            else if (isDrawableEdge(this.dragObject)) {
                this.dropEdge(this.graph, this.dragObject, ePt);
            }

            // Reset input states.
            this.resetState();

            // Redraw the canvas.
            this.redraw();
        }

        // Panning.
        else if (e.buttons == 2) {
            this.pan(e);
            this.panPt = null;
        }
    }

    private onWheel = (e: WheelEvent) => {
        if (e.deltaY > 0 && this.zoom.level > this.zoom.min)
            this.zoom.level = Math.max(this.zoom.level - 1, this.zoom.min);
        else if (e.deltaY < 0 && this.zoom.level < this.zoom.max)
            this.zoom.level = Math.min(this.zoom.level + 1, this.zoom.max);

        this.scale = Math.pow(1.25, this.zoom.level);
        // TODO:
        // Center on zoom point.
        this.redraw();
    }

    /**
     * onStickey  
     *   Delayed mousedown event for creating nodes or edges.
     */
    private onStickey = (): void => {
        // Set the drag object and reset sticky.
        if (this.downEvt) {
            let downPt = this.canvas.getPt(this.downEvt);
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;
            let hit = this.hitTest(downPt);

            // Create a new node and set it as the drag object if no drag
            // object was set.
            if (!hit) {
                this.dragObject = this.addNode(this.graph, downPt);
                this.clearSelected();
                this.addSelectedItem(this.dragObject);
                this.updateDrawable(this.dragObject);
                this.redraw();
            }

            // Create a new dummy edge with the source node as the drag object.
            else if (isDrawableNode(hit.d)) {
                let e = new DefaultEdge(hit.d);
                this.dragObject = e;
                e.lineStyle = CONST.EDGE_DRAG_LINESTYLE;
                e.destination = null;
                this.drawList.push(e);
                this.updateEdgePoints(e, downPt);
                this.updateDrawable(e);
                this.redraw();
            }

            // Set the drag object to some dummy edge and the replace edge to
            // the original drag object if the drag object was an edge.
            else if (isDrawableEdge(hit.d)) {
                let pts = this.edgePoints.get(hit.d) as point[];
                let e = cloneEdge(hit.d);
                this.moveEdge = hit.d;
                this.dragObject = e;
                e.lineStyle = CONST.EDGE_DRAG_LINESTYLE;
                if (hit.pt === pts[0])
                    e.source = null;
                else
                    e.destination = null;
                this.drawList.push(e);
                this.updateEdgePoints(e, downPt);
                this.updateDrawable(e);
                this.redraw();
            }
        }
    }

    /**
     * setScaleDelegate  
     *   Delegate for setting the canvas scaling factor.
     * 
     *   This is set by `addPublicMethods` and `removePublicMethods`.
     */
    private setScaleDelegate: (value: number) => void;

    /**
     * setOriginDelegate  
     *   Delegate for setting the canvas origin.
     * 
     *   This is set by `addPublicMethods` and `removePublicMethods`.
     */
    private setOriginDelegate: (value: point) => void;

    /**
     * clearSelectedDelegate  
     *   Delegate for clearing the selected graph elements
     * 
     *   This is set by `addPublicMethods` and `removePublicMethods`.
     */
    private clearSelectedDelegate: () => void;

    /**
     * redrawDelegate  
     *   Delegate for redrawing the canvas.
     * 
     *   This is set by `addPublicMethods` and `removePublicMethods`.
     */
    private redrawDelegate: () => void;


    // Add and Remove Methods //////////////////////////////////////////////////


    /**
     * addEventListeners  
     *   Adds input event listeners.
     */
    private addEventListeners(el: any) {
        el.addEventListener("mousedown", this.onMouseDown);
        el.addEventListener("mousemove", this.onMouseMove);
        el.addEventListener("wheel", this.onWheel);
        // TODO:
        // Use pointer events to handle gesture pan and zoom.
        el.addEventListener("pointerdown", (e: PointerEvent) => console.log(e));
        el.addEventListener("pointermove", (e: PointerEvent) => console.log(e));
        el.addEventListener("keydown", this.onKeyDown);
    }

    /**
     * removeEventListeners  
     *   Removes event listeners.
     */
    private removeEventListeners(el: any) {
        el.removeEventListener("mousedown", this.onMouseDown);
        el.removeEventListener("mouseup", this.onMouseUp);
        el.removeEventListener("mousemove", this.onMouseMove);
        el.removeEventListener("wheel", this.onWheel);
        el.removeEventListener("keydown", this.onKeyDown);
    }

    /**
     * addPublicMethods  
     *   Sets public method delegates.
     */
    private addPublicMethods(): void {
        this.setScaleDelegate = (v: number) => {
            this.canvas.scale = v;
            this.graph.scale = v;
        };
        this.setOriginDelegate = (v: point) => {
            this.canvas.origin.x = v.x;
            this.canvas.origin.y = v.y;
            this.graph.origin.x = v.x;
            this.graph.origin.y = v.y;
        };
        this.clearSelectedDelegate = () => {
            for (const d of this.selectedItems) {
                if (moveItem(this.selectedItems, this.unselectedItems, d))
                    this.updateDrawable(d);
            }
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        };
        this.redrawDelegate = () => {
            this.canvas.clear(this.graph ? this.graph.backgroundColor : "#fff");
            this.canvas.drawGrid();
            for (const d of this.selectedItems)
                (this.selectedDrawMap.get(d) as callback)();
            for (const d of this.drawList)
                (this.drawMap.get(d) as callback)();
        }
    }

    /**
     * removePublicMethods  
     *   Unsets public method delegates.
     */
    private removePublicMethods(): void {
        this.setScaleDelegate = (v: number) => { };
        this.setOriginDelegate = (v: point) => { };
        this.clearSelectedDelegate = () => { };
        if (this.canvas)
            this.redrawDelegate = () => this.canvas.clear();
        else
            this.redrawDelegate = () => { };
    }

    /**
     * addNodeEdge  
     *   Adds a given edge to the set of edges connected to a node.
     */
    private addNodeEdge(e: DrawableEdge): void {
        if (e.source)
            (this.nodeEdges.get(e.source) as EdgeSet).add(e);
        if (e.destination)
            (this.nodeEdges.get(e.destination) as EdgeSet).add(e);
    }

    /**
     * addNode  
     *   Adds a node to the graph editor.
     */
    private addNode(
        graph: DrawableGraph,
        pt?: point
    ): DrawableNode {
        let n = graph.createNode();
        if (pt)
            n.position = pt;
        this.nodeEdges.set(n, new Set<DrawableEdge>());
        this.updateNodeDimensions(n);
        this.updateDrawable(n);
        this.drawList.push(n);
        return n;
    }

    /**
     * removeNode  
     *   Removes a node from the graph editor.
     */
    private removeNode(
        graph: DrawableGraph,
        n: DrawableNode
    ): void {
        if (this.hoverObject && n === this.hoverObject)
            this.updateHoverObject(null);
        let edges = [...(this.nodeEdges.get(n) as EdgeSet)];
        for (const e of edges)
            this.removeEdge(graph, e);
        graph.removeNode(n);
        this.removeSelectedItem(n);
        this.unselectedItems.delete(n);
        this.nodeEdges.delete(n);
        this.nodeDimensions.delete(n);
        this.drawMap.delete(n);
        this.selectedDrawMap.delete(n);
        this.drawList = this.drawList.filter((v) => v !== n);
    }

    /**
     * addEdge  
     *   Adds an edge to the graph editor.
     */
    private addEdge(
        graph: DrawableGraph,
        src: DrawableNode,
        dst: DrawableNode,
        like?: DrawableEdge
    ): DrawableEdge {
        let e = graph.createEdge(src, dst, like);
        (this.nodeEdges.get(src) as EdgeSet).add(e);
        (this.nodeEdges.get(dst) as EdgeSet).add(e);
        this.updateEdgePoints(e);
        this.updateDrawable(e);
        this.drawList = this.drawList.filter((v) => v !== src && v !== dst);
        this.drawList.push(e);
        this.drawList.push(src);
        this.drawList.push(dst);
        return e;
    }

    /**
     * removeEdge  
     *   Removes an edge from the graph editor.
     */
    private removeEdge(
        graph: DrawableGraph,
        e: DrawableEdge
    ): void {
        if (this.hoverObject && e === this.hoverObject)
            this.updateHoverObject(null);
        if (e.source)
            (this.nodeEdges.get(e.source) as EdgeSet).delete(e);
        if (e.destination)
            (this.nodeEdges.get(e.destination) as EdgeSet).delete(e);
        graph.removeEdge(e);
        this.removeSelectedItem(e);
        this.unselectedItems.delete(e);
        this.edgePoints.delete(e);
        this.drawMap.delete(e);
        this.selectedDrawMap.delete(e);
        this.drawList = this.drawList.filter((v) => v !== e);
        if (e.source !== e.destination) {
            let overlapped = getOverlappedEdges(e, this.nodeEdges);
            for (let edge of overlapped)
                this.updateDrawable(edge);
        }
    }

    /**
     * addSelectedItem  
     *   Adds an item to the selected items set.
     */
    private addSelectedItem(item: Drawable) {
        if (moveItem(
            this.unselectedItems,
            this.selectedItems,
            item)) {
            this.updateDrawable(item);
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        }
    }

    /**
     * removeSelectedItem  
     *   Removes an item from the selected items set.
     */
    private removeSelectedItem(item: Drawable) {
        if (moveItem(
            this.selectedItems,
            this.unselectedItems,
            item)) {
            this.updateDrawable(item);
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        }
    }


    // Update Methods //////////////////////////////////////////////////////////


    /**
     * updateSelectionBox  
     *   Updates the selection box.
     */
    private updateSelectionBox(downPt: point, ePt: point): void {
        let rect = this.canvas.makeRect(downPt, ePt);

        // Update the selected components.
        for (let i of this.selectedItems) {
            if (!this.rectHitTest(i, rect)) {
                moveItem(this.selectedItems, this.unselectedItems, i);
                this.updateDrawable(i);
            }
        }
        for (let i of this.unselectedItems) {
            if (this.rectHitTest(i, rect)) {
                moveItem(this.unselectedItems, this.selectedItems, i);
                this.updateDrawable(i);
            }
        }
        this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));

        // Update the canvas.
        this.redraw();
        this.canvas.drawSelectionBox(rect);
    }

    /**
     * updateSelected  
     *   Updates the selected graph element.
     */
    private updateSelected(dragObject: Drawable) {
        // Reset the selected item.
        if (this.selectedItems.size < 2) {
            this.clearSelected();
            this.addSelectedItem(dragObject);
        }
    }

    /**
     * updateDrawable  
     *   Updates the draw function for a given drawable.
     */
    private updateDrawable(d: Drawable | null): void {
        let isDragging = this.dragObject === d;
        let isHovered = this.hoverObject === d;
        if (isDrawableEdge(d)) {
            let pts = this.edgePoints.get(d) as point[];
            if (this.selectedItems.has(d)) {
                this.selectedDrawMap.set(
                    d,
                    this.canvas
                        .makeDrawSelectedEdge(d, pts, isHovered)
                );
                this.drawMap.set(
                    d,
                    this.canvas
                        .makeDrawEdge(d, pts, isDragging, false)
                );
            }
            else {
                this.selectedDrawMap.set(d, () => { });
                this.drawMap.set(
                    d,
                    this.canvas
                        .makeDrawEdge(d, pts, isDragging, isHovered)
                );
            }
        }
        else if (isDrawableNode(d)) {
            let dim = this.nodeDimensions.get(d);
            if (this.selectedItems.has(d)) {
                this.selectedDrawMap.set(
                    d,
                    this.canvas
                        .makeDrawSelectedNode(d, dim, isDragging, isHovered)
                );
                this.drawMap.set(
                    d,
                    this.canvas
                        .makeDrawNode(d, dim, false, false)
                );
            }
            else {
                this.selectedDrawMap.set(d, () => { });
                this.drawMap.set(
                    d,
                    this.canvas
                        .makeDrawNode(d, dim, isDragging, isHovered)
                );
            }
        }
    }

    /**
     * updateEdgePoints  
     *   Updates the end points, midpoint, and any control points associated
     *   with an edge.
     */
    private updateEdgePoints(
        e: DrawableEdge,
        pt?: point
    ): void {
        console.assert(
            e.source || e.destination,
            "error GraphEditorComponent.updateEdgePoints: drawable edge must " +
            "have either a source or a destination"
        );
        // TODO:
        // Something about anchor points for custom node images.
        if (e.source && e.destination) {
            if (e.source === e.destination)
                this.edgePoints.set(
                    e,
                    this.canvas.getLoopEdgePoints(
                        e,
                        e.source,
                        this.nodeDimensions.get(e.source)
                    )
                );
            else {
                let overlapped = getOverlappedEdges(e, this.nodeEdges);
                if (overlapped.size > 0) {
                    this.edgePoints.set(
                        e,
                        this.canvas.getQuadraticEdgePoints(
                            e,
                            e.source,
                            e.destination,
                            this.nodeDimensions.get(e.source),
                            this.nodeDimensions.get(e.destination)
                        )
                    );
                    for (let edge of overlapped) {
                        this.edgePoints.set(
                            edge,
                            this.canvas.getQuadraticEdgePoints(
                                edge,
                                e.destination,
                                e.source,
                                this.nodeDimensions.get(e.destination),
                                this.nodeDimensions.get(e.source)
                            )
                        );
                        this.updateDrawable(edge);
                    }
                }
                else
                    this.edgePoints.set(
                        e,
                        this.canvas.getStraightEdgePoints(
                            e,
                            this.nodeDimensions.get(e.source),
                            this.nodeDimensions.get(e.destination),
                            pt
                        )
                    );
            }
        }
        else
            this.edgePoints.set(
                e,
                this.canvas.getStraightEdgePoints(
                    e,
                    (e.source ?
                        this.nodeDimensions.get(e.source) :
                        undefined),
                    (e.destination ?
                        this.nodeDimensions.get(e.destination) :
                        undefined),
                    pt
                )
            );
    }

    /**
     * updateNodeDimensions  
     *   Updates the dimensions of a node based on its geometry.
     */
    private updateNodeDimensions(n: DrawableNode): void {
        this.nodeDimensions.set(n, this.canvas.getNodeDimensions(n));
    }

    /**
     * setHoverObject  
     *   Sets the object being hovered over.
     */
    private updateHoverObject(value: { d: Drawable, pt: point } | null): void {
        if (value && value.d !== this.hoverObject ||
            (!value && this.hoverObject)) {
            // TODO:
            // Handle pt.
            let prev = this.hoverObject;
            this.hoverObject = (value ? value.d : null);
            this.updateDrawable(prev);
            this.updateDrawable(this.hoverObject);
            this.redraw();
        }
    }

    /**
     * updateDragNodes  
     *   Updates the collection of nodes being dragged.
     */
    private updateDragNodes(dragNode: DrawableNode, dPt: point) {
        if (this.selectedItems.has(dragNode) &&
            this.selectedItems.size > 0) {
            for (let o of this.selectedItems)
                if (isDrawableNode(o))
                    this.updateDragNode(o, dPt);
        }
        else
            this.updateDragNode(dragNode, dPt);
        this.redraw();
    }

    /**
     * updateDragNode  
     *   Updates a single node being dragged.
     */
    private updateDragNode(n: DrawableNode, dPt: point): void {
        n.position.x += dPt.x;
        n.position.y += dPt.y;
        for (let e of (this.nodeEdges.get(n) as Set<DrawableEdge>)) {
            this.updateEdgePoints(e);
            this.updateDrawable(e);
        }
        this.updateDrawable(n);
    }


    // Hit Methods /////////////////////////////////////////////////////////////


    /**
     * hitTest  
     *   Gets the first graph component that is hit by a point.
     */
    private hitTest(pt: point): { d: Drawable, pt: point } | null {
        for (const n of this.graph.nodes) {
            let hitObject = this.hitTestNode(n, pt);
            if (hitObject)
                return hitObject;
        }
        for (const e of this.graph.edges) {
            let hitObject = this.hitTestEdge(e, pt);
            if (hitObject)
                return hitObject;
        }
        return null;
    }

    /**
     * hitTestNode  
     *   Checks if a point is within the boundary of a node.
     */
    private hitTestNode(
        n: DrawableNode,
        pt: point
    ): { d: Drawable, pt: point } | null {
        let dim = this.nodeDimensions.get(n);
        switch (n.shape) {
            case "circle":
                let r = dim.r + CONST.GRID_SPACING / 4;
                let v = { x: pt.x - n.position.x, y: pt.y - n.position.y };
                let d = MathEx.mag(v);
                if (d <= r) {
                    r -= CONST.GRID_SPACING / 2;
                    let anchor: point = n.position;
                    if (d < r) {
                        let shift = this.canvas.getEdgePtShift(
                            { x: v.x / d, y: v.y / d },
                            n,
                            dim
                        );
                        anchor = {
                            x: anchor.x + shift.x,
                            y: anchor.y + shift.y
                        }
                    }
                    return {
                        d: n,
                        pt: anchor
                    };
                }

            case "square":
                let hs = dim.s / 2 + CONST.GRID_SPACING / 4;
                let rect = this.canvas.makeRect(
                    { x: n.position.x - hs, y: n.position.y - hs },
                    { x: n.position.x + hs, y: n.position.y + hs }
                );
                if ((pt.x >= rect.x && pt.x <= rect.x + rect.w) &&
                    (pt.y >= rect.y && pt.y <= rect.y + rect.w)) {
                    let v = { x: pt.x - n.position.x, y: pt.y - n.position.y };
                    let d = MathEx.mag(v);
                    rect.x += CONST.GRID_SPACING / 2;
                    rect.y += CONST.GRID_SPACING / 2;
                    rect.h -= CONST.GRID_SPACING / 2;
                    rect.w -= CONST.GRID_SPACING / 2;
                    let anchor: point = n.position;
                    if ((pt.x >= rect.x && pt.x <= rect.x + rect.w) &&
                        (pt.y >= rect.y && pt.y <= rect.y + rect.w)) {
                        let shift = this.canvas.getEdgePtShift(
                            { x: v.x / d, y: v.y / d },
                            n,
                            dim
                        );
                        anchor = {
                            x: anchor.x + shift.x,
                            y: anchor.y + shift.y
                        }
                    }
                    return { d: n, pt: anchor };
                }
        }
        return null;
    }

    /**
     * hitTestEdge  
     *   Checks if a point is within the hit boundary of an edge.
     */
    private hitTestEdge(
        e: DrawableEdge,
        pt: point
    ): { d: Drawable, pt: point } | null {
        if (e.source && e.destination) {
            let pts = this.edgePoints.get(e) as point[];
            let src = pts[0];
            let dst = pts[1];

            switch (pts.length) {
                // case 5:
                //     break;

                // case 4:
                //     break;

                default:
                    // Edge vector src -> dst
                    let ve = {
                        x: e.destination.position.x - e.source.position.x,
                        y: e.destination.position.y - e.source.position.y,
                    };
                    // Cursor vector e.src -> cursor
                    let vm = {
                        x: pt.x - e.source.position.x,
                        y: pt.y - e.source.position.y
                    };
                    let dotee = MathEx.dot(ve, ve); // edge dot edge
                    let dotem = MathEx.dot(ve, vm); // edge dot cursor
                    // Projection vector cursor -> edge
                    let p = { x: ve.x * dotem / dotee, y: ve.y * dotem / dotee };
                    // Rejection vector cursor -^ edge
                    let r = { x: vm.x - p.x, y: vm.y - p.y };

                    let dotpp = MathEx.dot(p, p); // proj dot proj
                    let dotrr = MathEx.dot(r, r); // rej dot rej

                    let dep = { x: ve.x - p.x, y: ve.y - p.y };
                    let dotdep = MathEx.dot(dep, dep);

                    if (dotpp <= dotee &&
                        dotdep <= dotee &&
                        dotrr <
                        e.lineWidth *
                        e.lineWidth +
                        CONST.EDGE_HIT_MARGIN *
                        CONST.EDGE_HIT_MARGIN)
                        return { d: e, pt: (dotpp < dotee / 4 ? src : dst) };
            }
        }
        return null;
    }

    /**
     * rectHitTest  
     *   Checks if a graph component was hit by a rectangle.
     */
    private rectHitTest(c: Drawable, rect: rect): boolean {

        // TODO:
        // A possible solution is to check if the boundary of the selection box
        // intersects with the boundary of a node or edge.

        return (isDrawableNode(c) &&
            c.position.x >= rect.x && c.position.x <= rect.x + rect.w &&
            c.position.y >= rect.y && c.position.y <= rect.y + rect.h) ||
            (isDrawableEdge(c) &&
                (c.source && c.destination) &&
                (this.rectHitTest(c.source, rect) ||
                    this.rectHitTest(c.destination, rect))) ||
            false;
    }


    // Other Methods ///////////////////////////////////////////////////////////


    private pan(p: point) {
        let prev = this.panPt;
        let curr: point = p;
        if (prev) {
            let dp = { x: curr.x - prev.x, y: curr.y - prev.y };
            this.canvas.origin.x += dp.x / this.canvas.scale;
            this.canvas.origin.y += dp.y / this.canvas.scale;
        }
        this.redraw();
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
        this.downEvt = null;
        this.dragObject = null;
        this.moveEdge = null;
    }

    /**
     * dropEdge  
     *   Drops the dragged edge when the mouse is released.
     */
    private dropEdge(
        graph: DrawableGraph,
        e: DrawableEdge,
        pt: point
    ): void {
        let dummyEdge = this.drawList.pop() as DrawableEdge;
        this.drawMap.delete(dummyEdge);
        this.edgePoints.delete(dummyEdge);

        // Move or create the edge if it was dropped on a node.
        let hit = this.hitTest(pt);
        if (hit && isDrawableNode(hit.d)) {
            let srcNode = (e.source ? e.source : hit.d);
            let dstNode = (e.destination ? e.destination : hit.d);
            let like = (this.moveEdge ? this.moveEdge : undefined);
            if (graph.canCreateEdge(srcNode, dstNode, like)) {
                let e = this.addEdge(graph, srcNode, dstNode, like);
                if (like)
                    this.removeEdge(graph, like);
                this.updateSelected(e);
            }
        }
    }

    /**
     * dropNodes  
     *   Drops the collection of nodes or single node that is being dragged
     *   when the mouse is released.
     */
    private dropNodes(dragNode: DrawableNode, pt: point): void {
        this.updateDragNodes(
            dragNode,
            { x: pt.x - dragNode.position.x, y: pt.y - dragNode.position.y }
        );
        //
        // TODO:
        // Pevent nodes from being dropped on top of eachother.
        //
        this.updateSelected(dragNode);
    }

    /**
     * initDrawables  
     *   Initializes the drawing behavior of graph elements.
     */
    private initDrawables(): void {
        this.unselectedItems.clear();
        this.drawMap.clear();
        this.drawList = new Array<Drawable>();
        this.edgePoints.clear();
        this.nodeDimensions.clear();
        this.nodeEdges.clear();
        for (const n of this.graph.nodes) {
            if (!this.selectedItems.has(n))
                this.unselectedItems.add(n);
            this.drawList.push(n);
            this.nodeEdges.set(n, new Set<DrawableEdge>());
            this.updateNodeDimensions(n);
            this.updateDrawable(n);
        }
        for (const e of this.graph.edges) {
            if (!this.selectedItems.has(e))
                this.unselectedItems.add(e);
            this.drawList.push(e);
            this.addNodeEdge(e);
            this.updateEdgePoints(e);
            this.updateDrawable(e);
        }
        this.drawList = this.drawList.reverse();
        this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
    }

}


// Static functions ////////////////////////////////////////////////////////////


/**
 * moveItem  
 *   Moves an item from one set to the other.
 */
function moveItem(
    src: Set<Drawable>,
    dst: Set<Drawable>,
    itm: Drawable
): boolean {
    dst.add(itm);
    return src.delete(itm);
}
