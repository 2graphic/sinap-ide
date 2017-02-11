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

import { GraphEditorCanvas, point as pt, rect } from "./canvas";
import {
    cloneEdge,
    DefaultEdge,
    Drawable,
    DrawableEdge,
    DrawableNode,
    DrawableGraph,
    getOpposingEdges,
    getAdjacentEdges,
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


type num = number;
type callback = () => void;
type DrawMap = Map<Drawable, callback>;
type DrawList = Array<Drawable>;
type EdgePointMap = Map<DrawableEdge, pt[]>;
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
     *   The previous pt from panning the canvas.
     */
    private panPt: pt | null = null;

    /**
     * downEvt  
     *   The previous down event payload.
     */
    private downEvt: MouseEvent | null = null;

    /**
     * stickyTimeout  
     *   Timer reference for the sticky delay.
     */
    private stickyTimeout: NodeJS.Timer | num | null = null;

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
     *   The node with its associated anchor pt being hovered over.
     */
    private hoverAnchor: { d: DrawableNode | null, pt: pt } =
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
     *   Maps edges to pts.  
     * 
     *   The first two pts are the end pts; the third pt is the
     *   midpt. The next two pts for cubic bezier curves are 1/3rd pts
     *   along the curve. All other pts are control pts.
     */
    private edgePoints: EdgePointMap = new Map<DrawableEdge, pt[]>();

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
    set scale(value: num) {
        this.setScaleDelegate(value);
    }

    // TODO:
    // scaleChanged @Output

    /**
     * origin  
     *   Sets the origin pt of the canvas.
     */
    set origin(value: pt) {
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
        if (this.canvas.size.h != h || this.canvas.size.w != w) {
            this.canvas.size = { h: h, w: w };
            this.redraw();
        }
    }

    /**
     * redraw  
     *   Redraws the graph.
     */
    redraw(): void {
        this.redrawDelegate();
    }

    copy(): void {
        console.log("Editor copy");
    }

    cut(): void {
        console.log("Editor cut");
    }

    paste(): void {
        console.log("Editor paste");
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
            }
            // Note:
            // It is necessary to keep the loops separate and remove edges
            // before nodes to avoid null reference exceptions.
            for (const item of remove) {
                if (isDrawableNode(item))
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
                    this.updateHoverObject(null);
                    this.dragObject = null;
                    this.stickyTimeout = (this.stickyTimeout ?
                        this.stickyTimeout :
                        setTimeout(this.onStickey, DEFAULT.STICKY_DELAY));
                }

                // Check if the hover object is a node.
                else if (isDrawableNode(this.hoverObject)) {
                    // Create a new edge if an anchor pt is being displayed
                    // on the node.
                    if (this.hoverAnchor.d) {
                        let edge = new DefaultEdge(this.hoverAnchor.d);
                        this.dragObject = edge;
                        edge.lineStyle = DEFAULT.EDGE_DRAG_LINESTYLE;
                        edge.destination = null;
                        this.drawList.push(edge);
                        this.updateEdgePoints(edge, this.canvas.getPt(e));
                        this.clearSelected();
                        this.updateDrawable(edge);
                    }

                    // Set the drag object to the node if no anchor pt is
                    // being displayed.
                    else {
                        this.dragObject = this.hoverObject;
                        this.updateHoverObject(null);
                    }
                }

                // Set the drag object to a dummy edge and mark the hover object
                // as the move edge if the hover object is an edge.
                else if (isDrawableEdge(this.hoverObject)) {
                    let pts = this.edgePoints.get(this.hoverObject) as pt[];
                    let edge = cloneEdge(this.hoverObject);
                    this.moveEdge = this.hoverObject;
                    this.dragObject = edge;
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
                // Capture the down pt.
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

                // Update edge endpt if dragging edge.
                else if (isDrawableEdge(this.dragObject)) {
                    this.updateDragEdge(this.dragObject, ePt);
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
            this.updateHoverObject(this.hitPtTest(ePt));
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
                let hit = this.hitPtTest(ePt);
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
    private onStickey = (): void => {
        // Create a new node and reset sticky.
        if (this.downEvt) {
            let downPt = this.canvas.getPt(this.downEvt);
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;

            // Create a new node and set it as the drag object.
            this.dragObject = this.addNode(this.graph, downPt);
            this.clearSelected();
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
    private setScaleDelegate: (value: num) => void;

    /**
     * setOriginDelegate  
     *   Delegate for setting the canvas origin.
     * 
     *   This is set by `addPublicMethods` and `removePublicMethods`.
     */
    private setOriginDelegate: (value: pt) => void;

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
        // Use touch events to handle gesture pan and zoom.
        // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
        el.addEventListener("touchstart", (e: TouchEvent) => console.log(e));
        el.addEventListener("touchend", (e: TouchEvent) => console.log(e));
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
        this.setScaleDelegate = (v: num) => {
            this.canvas.scale = v;
            this.graph.scale = v;
        };
        this.setOriginDelegate = (v: pt) => {
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
        this.setScaleDelegate = (v: num) => { };
        this.setOriginDelegate = (v: pt) => { };
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
        pt?: pt
    ): DrawableNode {
        let n = graph.createNode();
        if (pt)
            n.position = pt;
        this.nodeEdges.set(n, new Set<DrawableEdge>());
        this.updateNodeDimensions(n);
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
        let edges = [...(this.nodeEdges.get(n) as EdgeSet)];
        for (const e of edges)
            this.removeEdge(graph, e);
        if (n === this.hoverObject)
            this.hoverObject = null;
        this.unselectedItems.delete(n);
        this.selectedItems.delete(n);
        this.nodeEdges.delete(n);
        this.nodeDimensions.delete(n);
        this.drawMap.delete(n);
        this.selectedDrawMap.delete(n);
        this.drawList = this.drawList.filter((v) => v !== n);
        graph.removeNode(n);
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
        this.unselectedItems.delete(e);
        this.selectedItems.delete(e);
        this.edgePoints.delete(e);
        this.drawMap.delete(e);
        this.selectedDrawMap.delete(e);
        this.drawList = this.drawList.filter(v => v !== e);
        graph.removeEdge(e);
        if (e === this.hoverObject) {
            this.hoverObject = null;
            let n = this.hoverAnchor.d;
            this.hoverAnchor.d = null;
            this.updateDrawable(n);
        }
        if (e.source)
            (this.nodeEdges.get(e.source) as EdgeSet).delete(e);
        if (e.destination)
            (this.nodeEdges.get(e.destination) as EdgeSet).delete(e);
        if (e.source !== e.destination)
            this.updateOverlappedEdges(e);
    }

    /**
     * addSelectedItem  
     *   Adds an item to the selected items set.
     */
    private addSelectedItem(item: Drawable) {
        if (moveItem(
            this.unselectedItems,
            this.selectedItems,
            item))
            this.updateDrawable(item);
        this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
    }

    /**
     * removeSelectedItem  
     *   Removes an item from the selected items set.
     */
    private removeSelectedItem(item: Drawable) {
        if (moveItem(
            this.selectedItems,
            this.unselectedItems,
            item))
            this.updateDrawable(item);
        this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
    }


    // Update Methods //////////////////////////////////////////////////////////


    /**
     * updateSelectionBox  
     *   Updates the selection box.
     */
    private updateSelectionBox(downPt: pt, ePt: pt): void {
        let rect = this.canvas.makeRect(downPt, ePt);

        // Update the selected components.
        for (let i of this.selectedItems) {
            if (!this.hitRectTest(i, rect)) {
                moveItem(this.selectedItems, this.unselectedItems, i);
                this.updateDrawable(i);
            }
        }
        for (let i of this.unselectedItems) {
            if (this.hitRectTest(i, rect)) {
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
        let isDragging = this.moveEdge === e;
        let isHovered = this.hoverObject === e;
        let pts = this.edgePoints.get(e) as pt[];
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
     *   Updates the end pts, midpt, and any control pts associated
     *   with an edge.
     */
    private updateEdgePoints(
        e: DrawableEdge,
        pt?: pt
    ): void {
        console.assert(
            e.source || e.destination,
            "error GraphEditorComponent.updateEdgePoints: drawable edge must " +
            "have either a source or a destination"
        );
        // TODO:
        // Something about anchor pts for custom node images.
        if (e.source === e.destination) {
            let n = e.source as DrawableNode;
            let dim = this.nodeDimensions.get(n);
            this.edgePoints.set(e, this.canvas.getLoopEdgePoints(e, n, dim));
        }
        else
            this.updateOverlappedEdges(e, pt);
    }

    private updateOverlappedEdges(e: DrawableEdge, pt?: pt) {
        let edges = this.nodeEdges;
        let ePts = this.edgePoints;
        let dims = this.nodeDimensions;
        // let qep = this.canvas.getQuadraticEdgePoints;
        // let sep = this.canvas.getStraightEdgePoints;
        let src = e.source;
        let dst = e.destination;
        let srcDim = (src ? dims.get(src) : undefined);
        let dstDim = (dst ? dims.get(dst) : undefined);
        if (src && dst) {
            let opposing = getOpposingEdges(src, dst, edges);
            let adjacent = getAdjacentEdges(src, dst, edges);
            if (opposing.size > 0) {
                for (const edge of adjacent) {
                    ePts.set(edge, this.canvas.getQuadraticEdgePoints(
                        edge,
                        src,
                        dst,
                        srcDim,
                        dstDim
                    ));
                    this.updateDrawable(edge);
                }
            }
            else {
                for (const edge of adjacent) {
                    ePts.set(edge, this.canvas.getStraightEdgePoints(
                        edge,
                        srcDim,
                        dstDim
                    ));
                    this.updateDrawable(edge);
                }
            }
            if (adjacent.size > 0) {
                for (const edge of opposing) {
                    ePts.set(edge, this.canvas.getQuadraticEdgePoints(
                        edge,
                        dst,
                        src,
                        dstDim,
                        srcDim
                    ));
                    this.updateDrawable(edge);
                }
            }
            else {
                for (const edge of opposing) {
                    ePts.set(edge, this.canvas.getStraightEdgePoints(
                        edge,
                        dstDim,
                        srcDim
                    ));
                    this.updateDrawable(edge);
                }
            }
        }
        else
            ePts.set(e, this.canvas.getStraightEdgePoints(
                e,
                srcDim,
                dstDim,
                pt
            ));
    }

    /**
     * updateNodeDimensions  
     *   Updates the dimensions of a node based on its geometry.
     */
    private updateNodeDimensions(n: DrawableNode): void {
        this.nodeDimensions.set(n, this.canvas.getNodeDimensions(n));
        this.updateDrawable(n);
    }

    /**
     * updateHoverObject  
     *   Updates the hovered object and hover anchor.
     */
    private updateHoverObject(value: { d: Drawable, pt: pt } | null): void {

        let prev = this.hoverObject;
        this.hoverObject = (value ? value.d : null);
        if (prev !== this.hoverObject) {
            this.updateDrawable(prev);
            this.updateDrawable(this.hoverObject);
        }

        prev = this.hoverAnchor.d;
        if (value) {
            if (isDrawableEdge(value.d)) {
                let pts = this.edgePoints.get(value.d) as pt[];
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
    private updateDragNodes(dragNode: DrawableNode, dPt: pt) {
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
    private updateDragNode(n: DrawableNode, dPt: pt): void {
        n.position.x += dPt.x;
        n.position.y += dPt.y;
        for (let e of (this.nodeEdges.get(n) as Set<DrawableEdge>)) {
            this.updateEdgePoints(e);
            this.updateDrawable(e);
        }
        this.updateDrawable(n);
    }

    private updateDragEdge(e: DrawableEdge, ePt: pt) {
        let pt = ePt;
        // Update the hover object if the edge can be created at the
        // node being hovered.
        let hit = this.hitPtTestNodes(ePt);
        if (hit) {
            let src = (e.source ? e.source : hit.d);
            let dst = (e.destination ? e.destination : hit.d);
            let like = (this.moveEdge ? this.moveEdge : undefined);
            if (this.graph.canCreateEdge(src, dst, like)) {
                pt = hit.d.position;
                if (src !== dst) {
                    let u = { x: 0, y: 0 };
                    if (e.destination) {
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
        this.updateHoverObject(hit);
        this.updateEdgePoints(e, pt);
        this.updateDrawable(e);
    }


    // Hit Methods /////////////////////////////////////////////////////////////


    /**
     * hitPtTest  
     *   Gets the first graph component that is hit by a pt.
     */
    private hitPtTest(pt: pt): { d: Drawable, pt: pt } | null {
        return this.hitPtTestNodes(pt) || this.hitPtTestEdges(pt);
    }

    private hitPtTestNodes(pt: pt): { d: DrawableNode, pt: pt } | null {
        for (const n of this.graph.nodes) {
            let hitObject = this.hitPtTestNode(n, pt);
            if (hitObject)
                return hitObject;
        }
        return null;
    }

    private hitPtTestEdges(pt: pt): { d: DrawableEdge, pt: pt } | null {
        for (const e of this.graph.edges) {
            let hitObject = this.hitPtTestEdge(e, pt);
            if (hitObject)
                return hitObject;
        }
        return null;
    }

    /**
     * hitTestNode  
     *   Checks if a pt is within the boundary of a node.
     */
    private hitPtTestNode(
        n: DrawableNode,
        pt: pt
    ): { d: DrawableNode, pt: pt } | null {
        let dim = this.nodeDimensions.get(n);
        switch (n.shape) {
            case "circle":
                let r = dim.out;
                let v = { x: pt.x - n.position.x, y: pt.y - n.position.y };
                let d = MathEx.mag(v);
                if (d <= r) {
                    r = dim.in;
                    let anchor: pt = n.position;
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
                let hs = dim.out / 2;
                let rect = this.canvas.makeRect(
                    { x: n.position.x - hs, y: n.position.y - hs },
                    { x: n.position.x + hs, y: n.position.y + hs }
                );
                if ((pt.x >= rect.x && pt.x <= rect.x + rect.w) &&
                    (pt.y >= rect.y && pt.y <= rect.y + rect.w)) {
                    let v = { x: pt.x - n.position.x, y: pt.y - n.position.y };
                    let d = MathEx.mag(v);
                    hs = dim.in / 2;
                    rect = this.canvas.makeRect(
                        { x: n.position.x - hs, y: n.position.y - hs },
                        { x: n.position.x + hs, y: n.position.y + hs }
                    );
                    let anchor: pt = n.position;
                    if ((pt.x <= rect.x || pt.x >= rect.x + rect.w) ||
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
     *   Checks if a pt is within the hit boundary of an edge.
     */
    private hitPtTestEdge(
        e: DrawableEdge,
        pt: pt
    ): { d: DrawableEdge, pt: pt } | null {
        if (e.source && e.destination) {
            let pts = this.edgePoints.get(e) as pt[];
            let src = pts[0];
            let dst = pts[1];
            let mid = pts[2];
            let margin = e.lineWidth * e.lineWidth +
                DEFAULT.EDGE_HIT_MARGIN * DEFAULT.EDGE_HIT_MARGIN;

            let tl = {
                x: Math.min(src.x, dst.x, mid.x) - DEFAULT.GRID_SPACING / 2,
                y: Math.min(src.y, dst.y, mid.y) - DEFAULT.GRID_SPACING / 2
            };
            let br = {
                x: Math.max(src.x, dst.x, mid.x) + DEFAULT.GRID_SPACING / 2,
                y: Math.max(src.y, dst.y, mid.y) + DEFAULT.GRID_SPACING / 2
            };
            if (pt.x >= tl.x && pt.y >= tl.y && pt.x <= br.x && pt.y <= br.y) {
                switch (pts.length) {
                    // Cubic Bezier.
                    case 7: {
                        let pt1 = pts[3];
                        let pt2 = pts[4];
                        let hitPt1 = this.hitPtTestLine(src, pt1, pt, margin);
                        let hitPt2 = this.hitPtTestLine(pt1, pt2, pt, margin);
                        let hitPt3 = this.hitPtTestLine(pt2, dst, pt, margin);
                        if (hitPt2 === pt1 || hitPt1 === pt1)
                            hitPt1 = src;
                        else if (hitPt2 === pt2 || hitPt3 === pt2)
                            hitPt3 = dst;
                        if (hitPt1 && hitPt3) {
                            let v = { x: pt.x - src.x, y: pt.y - src.y };
                            let d1 = MathEx.dot(v, v);
                            v.x = pt.x - dst.x;
                            v.y = pt.y - dst.y;
                            let d2 = MathEx.dot(v, v);
                            return { d: e, pt: (d2 < d1 ? dst : src) };
                        }
                        else if (hitPt1)
                            return { d: e, pt: src };
                        else if (hitPt3)
                            return { d: e, pt: dst };

                    } break;

                    // Quadratic Bezier.
                    case 4: {
                        let hitPt = this.hitPtTestLine(src, mid, pt, margin);
                        if (hitPt)
                            return { d: e, pt: src };
                        hitPt = this.hitPtTestLine(mid, dst, pt, margin);
                        if (hitPt)
                            return { d: e, pt: dst };
                    } break;

                    // Straight Line.
                    default: {
                        let hitPt = this.hitPtTestLine(src, dst, pt, margin);
                        if (hitPt)
                            return { d: e, pt: hitPt };
                    } break;
                }
            }
        }
        return null;
    }

    private hitPtTestLine(
        src: pt,
        dst: pt,
        pt: pt,
        margin: num
    ): pt | null {
        // Edge vector src -> dst
        let ve = {
            x: dst.x - src.x,
            y: dst.y - src.y,
        };
        // Cursor vector e.src -> cursor
        let vm = {
            x: pt.x - src.x,
            y: pt.y - src.y
        };
        let dotee = MathEx.dot(ve, ve); // edge dot edge
        let dotem = MathEx.dot(ve, vm); // edge dot cursor
        // Projection vector cursor -> edge
        let p = {
            x: ve.x * dotem / dotee,
            y: ve.y * dotem / dotee
        };
        // Rejection vector cursor -^ edge
        let r = { x: vm.x - p.x, y: vm.y - p.y };

        let dotpp = MathEx.dot(p, p); // proj dot proj
        let dotrr = MathEx.dot(r, r); // rej dot rej

        let dep = { x: ve.x - p.x, y: ve.y - p.y };
        let dotdep = MathEx.dot(dep, dep);

        if (dotpp <= dotee && dotdep <= dotee && dotrr < margin)
            return (dotpp < dotee / 4 ? src : dst);
        return null;
    }

    /**
     * rectHitTest  
     *   Checks if a graph component was hit by a rectangle.
     */
    private hitRectTest(d: Drawable, rect: rect): boolean {
        if (isDrawableNode(d))
            return this.hitRectTestNode(d, rect);
        else if (isDrawableEdge(d))
            return this.hitRectTestEdge(d, rect);
        return false;
    }

    private hitRectTestEdge(e: DrawableEdge, rect: rect): boolean {
        const L = rect.x;
        const R = rect.x + rect.w;
        const T = rect.y;
        const B = rect.y + rect.h;
        let ps = this.edgePoints.get(e) as pt[];
        let p0 = ps[0];
        let p1 = ps[1];
        let p2 = ps[2];
        const inside = (p: pt) => {
            return (p.x <= R && p.x >= L && p.y <= B && p.y >= T);
        };
        if (inside(p0) || inside(p1) || inside(p2))
            return true;

        switch (ps.length) {
            // Cubic.
            case 7: {
                if (inside(ps[3]) || inside(ps[4]))
                    return true;
                return this.hitRectTestCubicEdge(
                    T, L, B, R,
                    p0, ps[5], ps[6], p1
                );
            }

            // Quadratic.
            case 4:
                return this.hitRectTestQuadraticEdge(T, L, B, R, p0, ps[3], p1);

            // Straight.
            default:
                return this.hitRectTestStraighEdge(T, L, B, R, p0, p1);
        }
    }

    private hitRectTestCubicEdge(
        top: num,
        left: num,
        bottom: num,
        right: num,
        p0: pt,
        p1: pt,
        p2: pt,
        p3: pt
    ): boolean {
        // Sources:
        // https://www.particleincell.com/wp-content/uploads/2013/08/cubic-line.svg
        // https://en.wikipedia.org/wiki/Cubic_function
        // TODO:
        // Figure out why horizontal lines are not intersecting with the curve.
        // Hint: for the commented `intersect` calls, the `t` value in `checkT`
        // is NaN. Somewhere in the intermediate steps, one of the numbers goes
        // to infinity. The technique being used is straight line intersection
        // with a cubic bezier curve, which involves computing the roots of a
        // cubic function in standard form.
        const checkT = (t: num, a: num, b: num, c: num, d: num, min: num, max: num) => {
            if (t >= 0 && t <= 1) {
                let x = a * t * t * t + b * t * t + c * t + d;
                if (x >= min && x <= max)
                    return true;
            }
            return false;
        };
        let a = MathEx.cubBezAv(p0, p1, p2, p3);
        let b = MathEx.cubBezBv(p0, p1, p2);
        let c = MathEx.cubBezCv(p0, p1);
        let d = { x: p0.x - left, y: p0.y - top };
        console.log(a.y);

        let A = { x: b.x / a.x, y: b.y / a.y };
        let B = { x: c.x / a.x, y: c.y / a.y };
        let C = { x: d.x / a.x, y: d.y / a.y };

        let Q = {
            x: (3 * B.x - Math.pow(A.x, 2)) / 9,
            y: (3 * B.y - Math.pow(A.y, 2)) / 9
        };
        let Qp3 = { x: Math.pow(Q.x, 3), y: Math.pow(Q.y, 3) };
        let R = {
            x: (9 * A.x * B.x - 27 * C.x - 2 * Math.pow(A.x, 3)) / 54,
            y: (9 * A.y * B.y - 27 * C.y - 2 * Math.pow(A.y, 3)) / 54
        };
        let D = {
            x: Qp3.x + Math.pow(R.x, 2),
            y: Qp3.y + Math.pow(R.y, 2)
        };
        let A_3 = { x: -A.x / 3, y: -A.y / 3 };

        const intersect = (
            _D: num,
            _R: num,
            _A_3: num,
            _Q: num,
            _Qp3: num,
            _a: num,
            _b: num,
            _c: num,
            _d: num,
            min: num,
            max: num
        ) => {
            if (_D >= 0) {
                let sqrtD = Math.sqrt(_D);
                let rsqrtd = _R + sqrtD;
                let S = (rsqrtd < 0 ? -1 : 1) * Math.pow(Math.abs(rsqrtd), 1 / 3);
                rsqrtd = _R - sqrtD;
                let T = (rsqrtd < 0 ? -1 : 1) * Math.pow(Math.abs(rsqrtd), 1 / 3);
                let ST = S + T;

                if (checkT(_A_3 + ST, _a, _b, _c, _d, min, max))
                    return true;

                if (Math.abs(MathEx.SQRT3 * ST / 2) == 0 &&
                    checkT(_A_3 - ST / 2, _a, _b, _c, _d, min, max))
                    return true;
            }
            else {
                let sqrtQ = Math.sqrt(-_Q);
                let th = Math.acos(_R / Math.sqrt(-_Qp3));

                if (checkT(2 * sqrtQ * Math.cos(th / 3) + _A_3, _a, _b, _c, _d, min, max))
                    return true;
                if (checkT(2 * sqrtQ * Math.cos((th + 2 * Math.PI) / 3) + _A_3, _a, _b, _c, _d, min, max))
                    return true;
                if (checkT(2 * sqrtQ * Math.cos((th + 4 * Math.PI) / 3) + _A_3, _a, _b, _c, _d, min, max))
                    return true;
            }
            return false;
        };

        if (intersect(D.x, R.x, A_3.x, Q.x, Qp3.x, a.y, b.y, c.y, p0.y, top, bottom))
            return true;

        d.x = p0.x - right;
        C.x = d.x / a.x;
        R.x = (9 * A.x * B.x - 27 * C.x - 2 * Math.pow(A.x, 3)) / 54;
        D.x = Qp3.x + Math.pow(R.x, 2);
        if (intersect(D.x, R.x, A_3.x, Q.x, Qp3.x, a.y, b.y, c.y, p0.y, top, bottom)/* ||
            intersect(D.y, R.y, A_3.y, Q.y, Qp3.y, a.x, b.x, c.x, p0.x, left, right)*/)
            return true;
        // d.y = p0.y - bottom;
        // C.y = d.y / a.y;
        // R.y = (9 * A.y * B.y - 27 * C.y - 2 * Math.pow(A.y, 3)) / 54;
        // D.y = Qp3.y + Math.pow(R.y, 2);
        // if (intersect(D.y, R.y, A_3.y, Q.y, Qp3.y, a.x, b.x, c.x, p0.x, left, right))
        //     return true;
        return false;
    }

    private hitRectTestQuadraticEdge(
        T: num,
        L: num,
        B: num,
        R: num,
        p0: pt,
        p1: pt,
        p2: pt
    ): boolean {
        let a = MathEx.quadBezAv(p0, p1, p2);
        let b = MathEx.quadBezBv(p0, p2);
        let c = { x: p0.x - L, y: p0.y - T };
        let d = MathEx.quadBezDv(a, b, c);
        if (d.x < 0) {
            c.x = p0.x - R;
            d.x = MathEx.quadBezD(a.x, b.x, c.x);
        }
        if (d.x >= 0) {
            d.x = Math.sqrt(d.x);
            let t = (-b.x + d.x) / (2 * a.x);
            let y = a.y * t * t + b.y * t + p0.y;
            if (t >= 0 && t <= 1 && y >= T && y <= B)
                return true;
            t = (-b.x - d.x) / (2 * a.x);
            y = a.y * t * t + b.y * t + p0.y;
            if (t >= 0 && t <= 1 && y >= T && y <= B)
                return true;
        }
        if (d.y < 0) {
            c.y = p0.y - B;
            d.y = MathEx.quadBezD(a.y, b.y, c.y);
        }
        if (d.y < 0)
            return false;
        d.y = Math.sqrt(d.y);
        let t = (-b.y + d.y) / (2 * a.y);
        let x = a.x * t * t + b.x * t + p0.x;
        if (t >= 0 && t <= 1 && x >= L && x <= R)
            return true;
        t = (-b.y - d.y) / (2 * a.y);
        x = a.x * t * t + b.x * t + p0.x;
        return (t >= 0 && t <= 1 && x >= L && x <= R);
    }

    private hitRectTestStraighEdge(
        T: num,
        L: num,
        B: num,
        R: num,
        p0: pt,
        p1: pt
    ): boolean {
        let intersect = (
            i: num,      // Intersect line.
            px: num,     // p0 "x"-coordinate
            py: num,     // p0 "y"-coordinate
            pdx: num,    // delta "x"
            pdy: num,    // delta "y"
            bt: num,     // "top" boundary
            bb: num      // "bottom" boundary
        ) => {
            let t = 0;
            let y = 0;
            return (
                (t = (i - px) / pdx) >= 0 && t <= 1 &&
                (y = py + pdy * t) >= bt && y <= bb
            );
        };
        let Dx = p1.x - p0.x;
        let Dy = p1.y - p0.y;
        return (
            // Line intersects left boundary.
            intersect(L, p0.x, p0.y, Dx, Dy, T, B) ||
            // Line intersects right boundary.
            intersect(R, p0.x, p0.y, Dx, Dy, T, B) ||
            // Line intersects top boundary.
            intersect(T, p0.y, p0.x, Dy, Dx, L, R) ||
            // Line intersects bottom boundary.
            intersect(B, p0.y, p0.x, Dy, Dx, L, R)
        );
    }

    private hitRectTestNode(n: DrawableNode, rect: rect): boolean {
        const L = rect.x;
        const R = rect.x + rect.w;
        const T = rect.y;
        const B = rect.y + rect.h;
        let posn = n.position;
        let dim = this.nodeDimensions.get(n);
        let D = 0;
        switch (n.shape) {
            case "circle":
                D = dim.r;
                break;
            case "square":
                D = dim.s / 2;
                break;
        }
        return (posn.x >= L - D && posn.x <= R + D &&
            posn.y >= T - D && posn.y <= B + D);
    }


    // Other Methods ///////////////////////////////////////////////////////////


    private pan(p: pt) {
        let prev = this.panPt;
        let curr: pt = p;
        if (prev) {
            let dp = { x: curr.x - prev.x, y: curr.y - prev.y };
            this.canvas.origin.x += dp.x / this.canvas.scale;
            this.canvas.origin.y += dp.y / this.canvas.scale;
        }
        this.redraw();
    }

    private zoom(p: pt, s: number) {
        // Get the canvas coordinates before zoom.
        let pt1 = this.canvas.getPt(p);
        // Apply zoom.
        this.scale = this.canvas.scale * s;
        // Get the canvas coordinates after zoom.
        let pt2 = this.canvas.getPt(p);
        // Get the delta between pre- and post-zoom canvas pts.
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
        pt: pt
    ): void {
        let dummyEdge = this.drawList.pop() as DrawableEdge;
        this.drawMap.delete(dummyEdge);
        this.edgePoints.delete(dummyEdge);

        // Move or create the edge if it was dropped on a node.
        let like = (this.moveEdge ? this.moveEdge : undefined);
        this.moveEdge = null;
        if (isDrawableNode(this.hoverObject)) {
            let srcNode = (e.source ? e.source : this.hoverObject);
            let dstNode = (e.destination ? e.destination : this.hoverObject);
            let edge = this.addEdge(graph, srcNode, dstNode, like);
            if (like)
                this.removeEdge(graph, like);
            this.updateSelected(edge);
            this.updateDrawable(edge);
        }
        else if (like) {
            this.updateSelected(like);
            this.updateDrawable(like);
        }
    }

    /**
     * dropNodes  
     *   Drops the collection of nodes or single node that is being dragged
     *   when the mouse is released.
     */
    private dropNodes(dragNode: DrawableNode, pt: pt): void {
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
