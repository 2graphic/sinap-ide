/*******************************************************************************
File: graph-editor.component.ts
Created by: CJ Dimaano
Date created: October 10, 2016


# Remarks
The graph editor component maps graph elements to draw functions. Draw functions
are designed to minimize conditional branching as much as possible. This is the
reasoning behind the `makeFnEdge` and `makeFnNode` functions. These functions
make appropriate draw functions based on whether or not the graph element is
selected, has a label, or is being hovered or dragged by the mouse. There are
additional conditions, such as shapes for nodes and line types for edges.

In addition to mapping graph elements to draw functions, nodes are mapped to
shape dimensions and sets of edges, and edges are mapped to a list of points.

A list of drawables is used to keep track of the order in which the graph
elements should be drawn.

The geometrical properties of nodes and edges are not recomputed for each call
to redraw. These properties should only be recomputed whenever the properties of
a node are changed that affects its geometry or position. Only the affected
graph elements should be updated in this manner.

Input to the graph editor is handled through pointer events. The `pointerdown`
event starts a timer to determine whether or not a node or edge should be
created. [This behavior is set to be changed so that creating an edge does not
require a timer.] The `pointermove` event either activates hovering on graph
elements, creates a selection box, moves a node, or moves an edge. The
`pointerup` event either finishes selecting graph elements, drops a node being
dragged, drops an edge being dragged, or creates an edge if possible.


# Notes
For deleting graph components, it would be better to have a global keybinding
with the keybind activation event calling some method to delete the selected
components. It may be better to have such functionality outside of the graph
editor component.

The canvas element needs to have its height and width properties updated in
order for its rendering context to be resized properly. Using css to handle
resizing for the canvas will stretch the image on the cavas as well as its
"pixels" rather than having the canvas map 1:1 with the screen.


# Resources
- System colors:
  https://www.w3.org/TR/REC-CSS2/ui.html#system-colors


# Discussion
- Special drawing start/final nodes should be the concern of the plugin; the
  graph editor should not have to be aware of _any_ type information or behavior
  properties of any of the drawable elements.
- Should drawable interfaces have optional properties/methods?
- backgroundColor should not be a property of a DrawableGraph; it should be a
  property of the graph editor component.


# TODO
- Update hit detection.
  - Either map drawables to hit functions or utilize built-in canvas hit
    regions.
- Drawable elements need to update geometry based on properties. [This is
  related to property binding.]
  - Node Position
  - Node Shape
  - Edge Arrows
  - Label
  - LineWidth
  - LineStyle
- Zoom and Pan
  - pinch to zoom/two-touch drag to pan
- Snap to grid.
- More shapes/custom images for nodes.
  - Anchor points on nodes for edges?
- Orthogonal Lines. [Should users be able to have full control over bezier
  curves?]
- Make sure to handle hit testing of custom shapes.
- Make it so that if any part of a component is caught within the selection box,
  it is selected.
- @Input height/width?
- Change edge creation behavior.
  Highlight edge creation region around the boundary of a node [or nearby anchor
  points if those get implemented] to indicate that an edge will be created if
  the user clicks and drags from within the region.
- Have a visual indication for determining if an edge can be moved from one node
  to another.
- Text location options. [Maybe]
  - Top, Left, Bottom, Right, Center
  - Inside, Outside, Center
- Consolidate code duplication.
- Update documentation.


*******************************************************************************/


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
     * graphEditorCanvas  
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
     * downEvt  
     *   The previous pointerdown event payload.
     */
    private downEvt: PointerEvent | null = null;

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
    private hoverObject: { d: Drawable, pt: point } | null = null;

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
            this.canvas.scale = value.scale;
            this.canvas.originPt = [value.origin.x, value.origin.y];
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

    @Input()
    set scale(value: number) {
        this.setScaleDelegate(value);
    }


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
                this.updateDrawable(d);
                for (const e of (this.nodeEdges.get(d) as EdgeSet)) {
                    this.updateEdgePoints(e);
                    this.updateDrawable(e);
                }
            }
            else if (isDrawableEdge(d)) {
                this.updateDrawable(d);
            }
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


    // Private Delegates ///////////////////////////////////////////////////////


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
     * onPointerDown  
     *   Handles the pointerdown event.
     */
    private onPointerDown = (e: PointerEvent): void => {

        // Make sure only the left mouse button is down.
        if (e.buttons == 1) {

            // Swap mouse up and down events.
            this.el.nativeElement.removeEventListener(
                "mousedown",
                this.onPointerDown
            )
            this.el.nativeElement.addEventListener(
                "mouseup",
                this.onPointerUp
            );

            // Clear the hover object.
            this.updateHoverObject(null);

            // Save mouse click canvas coordinates and set waiting to true.
            this.downEvt = e;

            // Set a timeout.
            this.stickyTimeout = (
                this.stickyTimeout ?
                    this.stickyTimeout :
                    setTimeout(
                        this.onStickey,
                        CONST.STICKY_DELAY
                    )
            );
        }
    }

    /**
     * onPointerMove  
     *   Handles the mousemove event.
     */
    private onPointerMove = (e: PointerEvent): void => {
        let ePt = this.canvas.getPt(e);

        // Capture the down event if the drag object has been set.
        if (this.dragObject && e.buttons == 1 && !this.downEvt)
            this.downEvt = e;

        // Make sure the mousedown event was previously captured.
        if (this.downEvt) {

            // Get the change in x and y locations of the cursor.
            let downPt = this.canvas.getPt(this.downEvt);
            let dPt = [
                downPt[0] - ePt[0],
                downPt[1] - ePt[1]
            ];

            // Reset waiting if waiting is still active and the mouse has moved
            // too far.
            if (
                this.stickyTimeout &&
                (MathEx.dot(dPt, dPt) > CONST.NUDGE * CONST.NUDGE)
            ) {
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

            // Update the canvas if waiting is not set.
            else if (!this.stickyTimeout) {

                // Update the selection box if selecting.
                if (!this.dragObject) {
                    this.updateSelectionBox(downPt, ePt);
                }

                // Update node position if dragging node.
                else if (isDrawableNode(this.dragObject)) {
                    this.updateDragNodes(
                        this.dragObject,
                        [
                            ePt[0] - this.dragObject.position.x,
                            ePt[1] - this.dragObject.position.y
                        ]
                    );
                }

                // Update edge endpoint if dragging edge.
                else if (isDrawableEdge(this.dragObject)) {
                    this.updateEdgePoints(this.dragObject, ePt);
                    this.updateDrawable(this.dragObject);
                    this.redraw();
                }
            }
        }

        // Mouse hover.
        else {
            this.updateHoverObject(this.hitTest(ePt));
        }
    }

    /**
     * onPointerUp  
     *   Handles the mouseup event.
     */
    private onPointerUp = (e: PointerEvent): void => {

        // Make sure a mousedown event was previously captured.
        if (this.downEvt) {
            this.el.nativeElement.removeEventListener(
                "mouseup",
                this.onPointerUp
            )
            this.el.nativeElement.addEventListener(
                "mousedown",
                this.onPointerDown
            );

            let ePt = this.canvas.getPt(e);

            // Set the selected graph component if waiting.
            if (this.stickyTimeout) {
                this.clearSelected();
                let hit = this.hitTest(ePt);
                if (
                    hit &&
                    (
                        isDrawableNode(hit.d) ||
                        isDrawableEdge(hit.d)
                    )
                )
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
    }

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

    private setScaleDelegate: (value: number) => void;
    private setOriginDelegate: (value: point) => void;
    private clearSelectedDelegate: () => void;
    private redrawDelegate: () => void;

    // Private Methods /////////////////////////////////////////////////////////

    private resetState() {
        if (this.stickyTimeout) {
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;
        }
        this.downEvt = null;
        this.dragObject = null;
        this.moveEdge = null;
    }

    private dropEdge(
        graph: DrawableGraph,
        dragEdge: DrawableEdge,
        pt: point
    ): void {

        let dummyEdge = this.drawList.pop() as DrawableEdge;
        this.drawMap.delete(dummyEdge);
        this.edgePoints.delete(dummyEdge);

        // Move or create the edge if it was dropped on a node.
        let hit = this.hitTest(pt);
        if (hit && isDrawableNode(hit.d)) {
            let srcNode = (dragEdge.source ? dragEdge.source : hit.d);
            let dstNode = (
                dragEdge.destination ?
                    dragEdge.destination :
                    hit.d
            );
            let like = (this.moveEdge ? this.moveEdge : undefined);
            if (graph.canCreateEdge(
                srcNode,
                dstNode,
                like
            )) {
                let e = this.addEdge(
                    graph,
                    srcNode,
                    dstNode,
                    like
                );
                if (like)
                    this.removeEdge(graph, like);
                this.updateSelected(e);
            };
        }
    }

    private dropNodes(dragNode: DrawableNode, pt: point): void {
        this.updateDragNodes(
            dragNode,
            [
                pt[0] - dragNode.position.x,
                pt[1] - dragNode.position.y
            ]
        );
        //
        // TODO:
        // Pevent nodes from being dropped on top of eachother.
        //
        this.updateSelected(dragNode);
    }

    private updateSelectionBox(downPt: point, ePt: point): void {
        let rect = this.canvas.makeRect(downPt, ePt);

        // Update the selected components.
        for (let i of this.selectedItems) {
            if (!this.rectHitTest(i, rect)) {
                moveItem(
                    this.selectedItems,
                    this.unselectedItems,
                    i
                );
                this.updateDrawable(i);
            }
        }
        for (let i of this.unselectedItems) {
            if (this.rectHitTest(i, rect)) {
                moveItem(
                    this.unselectedItems,
                    this.selectedItems,
                    i
                );
                this.updateDrawable(i);
            }
        }
        this.selectionChanged.emit(new Set<Drawable>(
            this.selectedItems
        ));

        // Update the canvas.
        this.redraw();
        this.canvas.drawSelectionBox(rect);
    }

    private updateSelected(dragObject: Drawable) {
        // Reset the selected item.
        if (this.selectedItems.size < 2) {
            this.clearSelected();
            this.addSelectedItem(dragObject);
        }
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
        this.selectionChanged.emit(
            new Set<Drawable>(this.selectedItems)
        );
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
     * updateDrawable  
     *   Updates the draw function for a given drawable.
     */
    private updateDrawable(d: Drawable, pt?: point): void {
        if (isDrawableEdge(d)) {
            this.drawMap.set(
                d,
                this.canvas.makeDrawEdge(
                    d,
                    this.edgePoints.get(d) as point[],
                    d === this.dragObject,
                    (this.hoverObject ? d === this.hoverObject.d : false),
                    this.selectedItems.has(d),
                    pt
                )
            );
        }
        else if (isDrawableNode(d)) {
            this.drawMap.set(
                d,
                this.canvas.makeDrawNode(
                    d,
                    this.nodeDimensions.get(d),
                    d === this.dragObject,
                    (this.hoverObject ? d === this.hoverObject.d : false),
                    this.selectedItems.has(d),
                    pt
                )
            );
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
                let overlapped =
                    getOverlappedEdges(e, this.nodeEdges);
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
                    (
                        e.source ?
                            this.nodeDimensions.get(e.source) :
                            undefined
                    ),
                    (
                        e.destination ?
                            this.nodeDimensions.get(e.destination) :
                            undefined
                    ),
                    pt
                )
            )
    }

    /**
     * updateNodeDimensions  
     *   Updates the dimensions of a node based on its geometry.
     */
    private updateNodeDimensions(n: DrawableNode): void {
        this.nodeDimensions.set(
            n,
            this.canvas.getNodeDimensions(n)
        );
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
        if (pt) {
            n.position.x = pt[0];
            n.position.y = pt[1];
        }
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
        if (this.hoverObject && n === this.hoverObject.d)
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
        this.drawList = this.drawList.filter((v) => {
            return (v !== n);
        });
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
        this.drawList = this.drawList.filter((v) => {
            return v !== src && v !== dst;
        });
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
        if (this.hoverObject && e === this.hoverObject.d)
            this.updateHoverObject(null);
        if (e.source)
            (this.nodeEdges.get(e.source) as EdgeSet).delete(e);
        if (e.destination)
            (this.nodeEdges.get(e.destination) as EdgeSet).delete(e);
        graph.removeEdge(e);
        this.removeSelectedItem(e);
        this.unselectedItems.delete(e);
        this.edgePoints.delete(e);
        this.drawList = this.drawList.filter((v) => {
            return (v !== e);
        });
        if (e.source !== e.destination) {
            let overlapped =
                getOverlappedEdges(e, this.nodeEdges);
            for (let edge of overlapped)
                this.updateDrawable(edge);
        }
    }

    private addEventListeners(el: any) {
        el.addEventListener(
            "mousedown",
            this.onPointerDown
        );
        el.addEventListener(
            "mousemove",
            this.onPointerMove
        );
        el.addEventListener(
            "keydown",
            this.onKeyDown
        );
    }

    private removeEventListeners(el: any) {
        el.removeEventListener(
            "mousedown",
            this.onPointerDown
        );
        el.removeEventListener(
            "mousemove",
            this.onPointerMove
        );
        el.removeEventListener(
            "mouseup",
            this.onPointerUp
        );
        el.removeEventListener(
            "keydown",
            this.onKeyDown
        );
    }

    /**
     * setHoverObject  
     *   Sets the object being hovered over by the mouse.
     */
    private updateHoverObject(
        value: { d: Drawable, pt: point } | null
    ): void {
        if (value !== this.hoverObject) {
            let prev = this.hoverObject;
            this.hoverObject = value;
            if (prev)
                this.updateDrawable(prev.d);
            if (this.hoverObject)
                this.updateDrawable(this.hoverObject.d);
            this.redraw();
        }
    }

    /**
     * updateDragNodes  
     *   Updates the collection of nodes being dragged.
     */
    private updateDragNodes(dragNode: DrawableNode, dPt: point) {
        if (
            this.selectedItems.has(dragNode) &&
            this.selectedItems.size > 0
        ) {
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
        n.position.x += dPt[0];
        n.position.y += dPt[1];
        for (let e of (this.nodeEdges.get(n) as Set<DrawableEdge>)) {
            this.updateEdgePoints(e);
            this.updateDrawable(e);
        }
    }

    private addPublicMethods(): void {
        this.setScaleDelegate = (v: number) => {
            this.canvas.scale = v;
            this.graph.scale = v;
        };
        this.setOriginDelegate = (v: point) => {
            this.canvas.originPt = v;
            this.graph.origin.x = v[0];
            this.graph.origin.y = v[1];
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
            for (const d of this.drawList)
                (this.drawMap.get(d) as callback)();
        }
    }

    private removePublicMethods(): void {
        this.setScaleDelegate = (v: number) => { };
        this.setOriginDelegate = (v: point) => { };
        this.clearSelectedDelegate = () => { };
        if (this.canvas)
            this.redrawDelegate = () => {
                this.canvas.clear();
            };
        else
            this.redrawDelegate = () => { };
    }

    /**
     * addSelectedItem  
     *   Adds an item to the selected items set.
     */
    private addSelectedItem(item: Drawable) {
        if (moveItem(
            this.unselectedItems,
            this.selectedItems,
            item
        )) {
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
            item
        )) {
            this.updateDrawable(item);
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        }
    }

    /**
     * hitTest  
     *   Gets the first graph component that is hit by a point.
     */
    private hitTest(
        pt: point
    ): { d: Drawable, pt: point } | null {
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
                if (this.canvas.hitTestCircle(
                    [n.position.x, n.position.y],
                    pt,
                    dim.r + CONST.GRID_SPACING / 4
                )) {
                    let v = [
                        pt[0] - n.position.x,
                        pt[1] - n.position.y
                    ];
                    let d = MathEx.mag(v);
                    return {
                        d: n,
                        pt: (
                            d < dim.r - CONST.GRID_SPACING / 4 ?
                                [n.position.x, n.position.y] :
                                this.canvas.getEdgePtShift(
                                    [v[0] / d, v[1] / d],
                                    n,
                                    dim
                                )
                        )
                    };
                }

            case "square":
                if (this.canvas.hitTestSquare(
                    [n.position.x, n.position.y],
                    pt,
                    dim.s + CONST.GRID_SPACING / 4
                )) {
                    let v = [
                        pt[0] - n.position.x,
                        pt[1] - n.position.y
                    ];
                    let d = MathEx.mag(v);
                    return {
                        d: n,
                        pt: (
                            d < dim.s - CONST.GRID_SPACING / 4 ?
                                [n.position.x, n.position.y] :
                                this.canvas.getEdgePtShift(
                                    [v[0] / d, v[1] / d],
                                    n,
                                    dim
                                )
                        )
                    };
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
                    let ve = [
                        e.destination.position.x - e.source.position.x,
                        e.destination.position.y - e.source.position.y,
                    ];
                    // Cursor vector e.src -> mouse
                    let vm = [
                        pt[0] - e.source.position.x,
                        pt[1] - e.source.position.y
                    ];
                    let dotee = MathEx.dot(ve, ve); // edge dot edge
                    let dotem = MathEx.dot(ve, vm); // edge dot mouse
                    // Projection vector mouse -> edge
                    let p = [
                        ve[0] * dotem / dotee,
                        ve[1] * dotem / dotee
                    ];
                    // Rejection vector mouse -^ edge
                    let r = [
                        vm[0] - p[0],
                        vm[1] - p[1]
                    ];

                    let dotpp = MathEx.dot(p, p); // proj dot proj
                    let dotrr = MathEx.dot(r, r); // rej dot rej

                    let dep = [
                        ve[0] - p[0],
                        ve[1] - p[1]
                    ];
                    let dotdep = MathEx.dot(dep, dep);

                    if (
                        dotpp <= dotee &&
                        dotdep <= dotee &&
                        dotrr <
                        e.lineWidth *
                        e.lineWidth +
                        CONST.EDGE_HIT_MARGIN *
                        CONST.EDGE_HIT_MARGIN
                    )
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
