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

import * as DEFAULT from "./defaults";
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
     *   Maps drawable elements to draw functions.
     */
    private drawMap: DrawMap = new Map<Drawable, callback>();

    /**
     * drawList  
     *   Maintains the draw order of drawable elements.
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

                // Save the event payload.
                this.downEvt = e;

                // Set a timer for creating a node if nothing is being hovered.
                if (!this.hoverObject) {
                    this.updateHover(null);
                    this.dragObject = null;
                    this.stickyTimeout = (this.stickyTimeout ?
                        this.stickyTimeout :
                        setTimeout(this.onStickey, DEFAULT.STICKY_DELAY));
                }

                // Check if the hover object is a node.
                else if (isDrawableNode(this.hoverObject)) {
                    // Create a new edge if an anchor point is being displayed
                    // on the node.
                    if (this.hoverAnchor.d) {
                        let edge = new DefaultEdge(this.hoverAnchor.d);
                        this.dragObject = edge;
                        edge.lineStyle = DEFAULT.EDGE_DRAG_LINESTYLE;
                        edge.destination = null;
                        this.drawList.push(edge);
                        this.updateEdgePoints(edge, this.canvas.getPt(e));
                        this.updateDrawable(edge);
                    }

                    // Set the drag object to the node if no anchor point is
                    // being displayed.
                    else {
                        this.dragObject = this.hoverObject;
                        this.updateHover(null);
                    }
                }

                // Set the drag object to a dummy edge and mark the hover object
                // as the move edge if the hover object is an edge.
                else if (isDrawableEdge(this.hoverObject)) {
                    let pts = this.edgePoints.get(this.hoverObject) as point[];
                    let edge = cloneEdge(this.hoverObject);
                    this.moveEdge = this.hoverObject;
                    this.dragObject = edge;
                    edge.lineStyle = DEFAULT.EDGE_DRAG_LINESTYLE;
                    if (this.hoverAnchor.pt === pts[0])
                        edge.source = null;
                    else
                        edge.destination = null;
                    this.drawList.push(edge);
                    this.updateEdgePoints(edge, this.canvas.getPt(e));
                    this.updateDrawable(edge);
                }
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
                    let edge = this.dragObject;
                    let pt = ePt;
                    // Update the hover object if the edge can be created at the
                    // node being hovered.
                    let hit = this.hitTest(ePt);
                    if (hit && isDrawableNode(hit.d) && hit.pt !== hit.d.position) {
                        let src = (edge.source ? edge.source : hit.d);
                        let dst = (edge.destination ? edge.destination : hit.d);
                        let like = (this.moveEdge ? this.moveEdge : undefined);
                        if (this.graph.canCreateEdge(src, dst, like)) {
                            pt = hit.d.position;
                            if (src !== dst) {
                                let u = { x: 0, y: 0 };
                                if (edge.destination) {
                                    u = {
                                        x: dst.position.x - src.position.x,
                                        y: dst.position.y - src.position.y
                                    };
                                }
                                else {
                                    u = {
                                        x: src.position.x - dst.position.x,
                                        y: src.position.y - dst.position.y
                                    };
                                }
                                let d = MathEx.mag(u);
                                u.x /= d;
                                u.y /= d;
                                pt = this.canvas.getEdgePtShift(
                                    u,
                                    hit.d,
                                    this.nodeDimensions.get(hit.d)
                                );
                                pt.x += hit.d.position.x;
                                pt.y += hit.d.position.y;
                                hit.pt = pt;
                            }
                        }
                        else
                            hit = null;
                    }
                    else
                        hit = null;
                    this.updateHover(hit);
                    this.updateEdgePoints(edge, pt);
                    this.updateDrawable(edge);
                }
            }

            // Reset waiting if waiting is still active and the mouse has moved
            // too far.
            else if (MathEx.dot(dPt, dPt) > DEFAULT.NUDGE * DEFAULT.NUDGE) {
                clearTimeout(this.stickyTimeout as NodeJS.Timer);
                this.stickyTimeout = null;
                this.clearSelected();
            }
        }

        // Panning.
        else if (e.buttons == 2) {
            this.pan(e);
            this.panPt = e;
        }

        // Hover.
        else if (e.buttons == 0) {
            this.updateHover(this.hitTest(ePt));
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
            );
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
                if (hit)
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

    /**
     * onWheel  
     *   Handles the mouse wheel event for devices that do not register touch
     *   events for zooming.
     */
    private onWheel = (e: WheelEvent) => {
        // Get the canvas coordinates before zoom.
        let pt1 = this.canvas.getPt(e);
        // Apply zoom.
        if (e.deltaY > 0)
            this.scale = this.canvas.scale / 1.1;
        else if (e.deltaY < 0)
            this.scale = this.canvas.scale * 1.1;
        // Get the canvas coordinates after zoom.
        let pt2 = this.canvas.getPt(e);
        // Get the delta between pre- and post-zoom canvas points.
        let dpt = {
            x: pt2.x - pt1.x,
            y: pt2.y - pt1.y
        };
        // Move the canvas origin by the delta.
        this.canvas.origin.x += dpt.x;
        this.canvas.origin.y += dpt.y;
        this.redraw();
    }

    /**
     * onStickey  
     *   Delayed mousedown event for creating nodes.
     */
    private onStickey = (): void => {
        // Create a new node and reset sticky.
        if (this.downEvt) {
            let downPt = this.canvas.getPt(this.downEvt);
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;

            // Create a new node and set it as the drag object.
            this.dragObject = this.addNode(this.graph, downPt);
            this.clearSelected();
            this.addSelectedItem(this.dragObject);
            this.updateDrawable(this.dragObject);
            this.redraw();
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
            this.updateHover(null);
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
            this.updateHover(null);
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
        this.drawList = this.drawList.filter(v => v !== e);
        if (e.source !== e.destination) {
            let overlapped = getOverlappedEdges(e, this.nodeEdges);
            for (let edge of overlapped)
                this.updateEdgePoints(edge);
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
        if (isDrawableEdge(d))
            this.updateDrawableEdge(d);
        else if (isDrawableNode(d))
            this.updateDrawableNode(d);
    }

    private updateDrawableEdge(e: DrawableEdge) {
        let isSelected = (e ? this.selectedItems.has(e) : false);
        let isDragging = this.dragObject === e;
        let isHovered = this.hoverObject === e;
        let pts = this.edgePoints.get(e) as point[];
        this.selectedDrawMap.set(
            e,
            (isSelected ?
                this.canvas.makeDrawSelectedEdge(e, pts, isHovered) :
                () => { })
        );
        this.drawMap.set(
            e,
            this.canvas.makeDrawEdge(
                e,
                pts,
                isDragging,
                isHovered && !isSelected
            )
        );
    }

    private updateDrawableNode(n: DrawableNode) {
        let isSelected = (n ? this.selectedItems.has(n) : false);
        let isDragging = this.dragObject === n;
        let isHovered = this.hoverObject === n;
        let dim = this.nodeDimensions.get(n);
        this.selectedDrawMap.set(
            n,
            (isSelected ?
                this.canvas
                    .makeDrawSelectedNode(n, dim, isDragging, isHovered) :
                () => { })
        );
        this.drawMap.set(
            n,
            this.canvas.makeDrawNode(
                n,
                dim,
                isDragging && !isSelected,
                isHovered && !isSelected,
                (n === this.hoverAnchor.d ?
                    this.hoverAnchor.pt :
                    undefined)
            )
        );
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
     * hoverObject  
     *   Updates the hovered object and hover anchor.
     */
    private updateHover(value: { d: Drawable, pt: point } | null): void {

        let prev = this.hoverObject;
        this.hoverObject = (value ? value.d : null);
        if (prev !== this.hoverObject) {
            this.updateDrawable(prev);
            this.updateDrawable(this.hoverObject);
        }

        prev = this.hoverAnchor.d;
        if (value) {
            if (isDrawableEdge(value.d)) {
                let pts = this.edgePoints.get(value.d) as point[];
                this.hoverAnchor.d = (value.pt === pts[0] ?
                    value.d.source :
                    value.d.destination);
            }
            else if (isDrawableNode(value.d))
                this.hoverAnchor.d = (value.pt === value.d.position ?
                    null :
                    value.d);
            this.hoverAnchor.pt = value.pt;
        }
        else
            this.hoverAnchor.d = null;
        this.updateDrawable(prev);
        this.updateDrawable(this.hoverAnchor.d);
        this.redraw();

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
                let r = dim.r + DEFAULT.GRID_SPACING / 4;
                let v = { x: pt.x - n.position.x, y: pt.y - n.position.y };
                let d = MathEx.mag(v);
                if (d <= r) {
                    r -= DEFAULT.GRID_SPACING / 4;
                    let anchor: point = n.position;
                    if (d >= r) {
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
                let hs = dim.s / 2 + DEFAULT.GRID_SPACING / 4;
                let rect = this.canvas.makeRect(
                    { x: n.position.x - hs, y: n.position.y - hs },
                    { x: n.position.x + hs, y: n.position.y + hs }
                );
                if ((pt.x >= rect.x && pt.x <= rect.x + rect.w) &&
                    (pt.y >= rect.y && pt.y <= rect.y + rect.w)) {
                    let v = { x: pt.x - n.position.x, y: pt.y - n.position.y };
                    let d = MathEx.mag(v);
                    rect.x += DEFAULT.GRID_SPACING / 4;
                    rect.y += DEFAULT.GRID_SPACING / 4;
                    rect.h -= DEFAULT.GRID_SPACING / 4;
                    rect.w -= DEFAULT.GRID_SPACING / 4;
                    let anchor: point = n.position;
                    if ((pt.x <= rect.x || pt.x >= rect.x + rect.w) &&
                        (pt.y <= rect.y || pt.y >= rect.y + rect.w)) {
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
                        DEFAULT.EDGE_HIT_MARGIN *
                        DEFAULT.EDGE_HIT_MARGIN)
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
        let like = (this.moveEdge ? this.moveEdge : undefined);
        if (isDrawableNode(this.hoverObject)) {
            let srcNode = (e.source ? e.source : this.hoverObject);
            let dstNode = (e.destination ? e.destination : this.hoverObject);
            let edge = this.addEdge(graph, srcNode, dstNode, like);
            if (like)
                this.removeEdge(graph, like);
            this.updateSelected(edge);
        }
        else if (like)
            this.updateDrawable(like);
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
