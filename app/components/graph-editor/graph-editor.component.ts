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

Input to the graph editor is handled through mouse events. The `mousedown` event
starts a timer to determine whether or not a node or edge should be created.
[This behavior is set to be changed so that creating an edge does not require
a timer.] The `mousemove` event either activates hovering on graph elements,
creates a selection box, moves a node, or moves an edge. The `mouseup` event
either finishes selecting graph elements, drops a node being dragged, drops an
edge being dragged, or creates an edge if possible.


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
import * as Drawables from "./drawable-interfaces";
import * as MathEx from "./math";
import * as canvas from "./canvas";

import { makeFnEdge } from "./make-fn-edge";
import { makeFnNode } from "./make-fn-node";


// Re-exports //////////////////////////////////////////////////////////////////


export {
    DrawableGraph,
    DrawableEdge,
    DrawableNode,
    isDrawableEdge,
    isDrawableNode,
    GraphContext,
    Drawable,
    LineStyles,
    Shapes
} from "./drawable-interfaces";


// Type aliases ////////////////////////////////////////////////////////////////


type Drawable = Drawables.Drawable;
type DrawableGraph = Drawables.DrawableGraph;
type DrawableEdge = Drawables.DrawableEdge;
type DrawableNode = Drawables.DrawableNode;

type point = canvas.point;
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


    // Private Fields //////////////////////////////////////////////////////////


    /**
     * graphEditorCanvas  
     *   Reference to the canvas child element.
     */
    @ViewChild("sinapGraphEditorCanvas")
    private graphEditorCanvas: ElementRef;

    /**
     * g  
     *   The 2D graphics rendering context from the canvas element.
     */
    private g: CanvasRenderingContext2D;

    /**
     * graph  
     *   The graph object.
     */
    private graph: DrawableGraph | null = null;

    /**
     * gridOriginPt  
     *   The coordinates of the grid origin.
     */
    private gridOriginPt: point = [0, 0];

    /**
     * downEvt  
     *   The previous mousedown event payload.
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
    private dragObject: DrawableNode | { e: DrawableEdge, pt: point } | null =
    null;

    /**
     * hoverObject  
     *   The graph component over which the cursor is hovering.
     */
    private hoverObject: Drawable | null = null;

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
            this.selectedItems = value.selection;
            this.initDrawables();
            if (this.g)
                this.redraw();
        } else {
            // TODO:
            // Discuss what it means when the graph context is set to null.
            // this.context = null;
            this.graph = null;
            if (this.g)
                this.g.clearRect(
                    0,
                    0,
                    this.g.canvas.width,
                    this.g.canvas.height
                );
        }
    }

    /**
     * dragNode  
     *   Sets the node being dragged by the cursor.
     */
    @Input()
    dragNode(value: DrawableNode) {
        this.dragObject = value;
    }


    // Public Methods //////////////////////////////////////////////////////////


    /**
     * ngAfterViewInit  
     *   Gets the canvas rendering context and resizes the canvas element.
     */
    ngAfterViewInit() {
        this.g = this.graphEditorCanvas.nativeElement.getContext("2d");
        this.g.mozImageSmoothingEnabled = true;
        this.g.msImageSmoothingEnabled = true;
        this.g.oImageSmoothingEnabled = true;
        this.resize();
    }

    /**
     * clearSelected  
     *   Clears the selected items.
     */
    clearSelected(): void {
        if (this.graph) {
            for (const d of this.selectedItems) {
                if (moveItem(this.selectedItems, this.unselectedItems, d))
                    this.updateDrawable(d);
            }
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        }
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
            if (Drawables.isDrawableNode(d)) {
                this.updateNodeDimensions(d);
                this.updateDrawable(d);
                for (const e of (this.nodeEdges.get(d) as EdgeSet)) {
                    this.updateEdgePoints(e);
                    this.updateDrawable(e);
                }
            }
            else if (Drawables.isDrawableEdge(d)) {
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
        let el = this.graphEditorCanvas.nativeElement;
        let pel = (el.parentNode as HTMLElement);
        let h = pel.offsetHeight;
        let w = pel.offsetWidth;
        el.height = h * CONST.AA_SCALE;
        el.width = w * CONST.AA_SCALE;
        this.g.scale(CONST.AA_SCALE, CONST.AA_SCALE);
        this.redraw();
    }

    /**
     * redraw  
     *   Redraws the graph.
     */
    redraw(): void {
        canvas.clear(this.g, this.graph ? this.graph.backgroundColor : "#fff");
        if (this.graph) {
            canvas.drawGrid(this.g, this.gridOriginPt);
            for (const d of this.drawList)
                (this.drawMap.get(d) as callback)();
        }
    }


    // Private Methods /////////////////////////////////////////////////////////


    /**
     * onKeyDown  
     *   Handles the delete key.
     * 
     * Note:
     *   I don't like where this is.
     */
    private onKeyDown(e: KeyboardEvent): void {
        // Delete keyCode is 46; backspace is 8.
        if (this.graph && (e.keyCode == 46 || e.keyCode == 8)) {
            let remove = [...this.selectedItems];
            for (const item of remove) {
                if (Drawables.isDrawableEdge(item))
                    this.removeEdge(this.graph, item);
                else if (Drawables.isDrawableNode(item))
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
    private onMouseDown(e: MouseEvent): void {

        // Make sure only the left mouse button is down.
        if (this.graph && e.buttons == 1) {

            // Clear the hover object.
            this.updateHoverObject(null);

            // Save mouse click canvas coordinates and set waiting to true.
            this.downEvt = e;

            // Set a timeout.
            this.stickyTimeout = setTimeout(
                () => {
                    // Set the drag object and reset sticky.
                    if (this.graph && this.downEvt) {
                        let downPt = canvas.getMousePt(this.g, this.downEvt);
                        clearTimeout(this.stickyTimeout as NodeJS.Timer);
                        this.stickyTimeout = null;
                        this.dragObject = this.hitTest(downPt);

                        // Create a new node and set it as the drag object if no
                        // drag object was set.
                        if (!this.dragObject) {
                            this.dragObject = this.addNode(this.graph, downPt);
                            this.clearSelected();
                            this.addSelectedItem(this.dragObject);
                            this.updateDrawable(this.dragObject);
                            this.redraw();
                        }

                        // Create a new dummy edge with the source node as the
                        // drag object.
                        else if (Drawables.isDrawableNode(this.dragObject)) {
                            this.dragObject = {
                                e: new Drawables.DefaultEdge(this.dragObject),
                                pt: downPt
                            };
                            this.dragObject.e.lineStyle =
                                CONST.EDGE_DRAG_LINESTYLE;
                            this.dragObject.e.destination = null;
                            this.drawList.push(this.dragObject.e);
                            this.updateEdgePoints(this.dragObject.e, downPt);
                            this.updateDrawable(this.dragObject.e);
                            this.redraw();
                        }

                        // Set the drag object to some dummy edge and the
                        // replace edge to the  original drag object if the drag
                        // object was an edge.
                        //
                        // TODO:
                        // Make sure that this.dragObject is an instance of
                        // `{ d: DrawableEdge, pt: point }`
                        else {
                            let pts = this.edgePoints.get(
                                this.dragObject.e
                            ) as point[];
                            this.moveEdge = this.dragObject.e;
                            this.dragObject = {
                                e: Drawables.cloneEdge(this.moveEdge),
                                pt: this.dragObject.pt
                            };
                            this.dragObject.e.lineStyle =
                                CONST.EDGE_DRAG_LINESTYLE;
                            if (this.dragObject.pt === pts[0])
                                this.dragObject.e.source = null;
                            else
                                this.dragObject.e.destination = null;
                            this.drawList.push(this.dragObject.e);
                            this.updateEdgePoints(this.dragObject.e, downPt);
                            this.updateDrawable(this.dragObject.e);
                            this.redraw();
                        }
                    }
                },
                CONST.STICKY_DELAY
            );
        }
    }

    /**
     * onMouseMove  
     *   Handles the mousemove event.
     */
    private onMouseMove(e: MouseEvent): void {
        if (this.graph) {
            let ePt = canvas.getMousePt(this.g, e);

            // Capture the down event if the drag object has been set.
            if (this.dragObject && !this.downEvt)
                this.downEvt = e;

            // Make sure the mousedown event was previously captured.
            if (this.downEvt) {

                // Get the change in x and y locations of the cursor.
                let downPt = canvas.getMousePt(this.g, this.downEvt);
                let dPt = [
                    downPt[0] - ePt[0],
                    downPt[1] - ePt[1]
                ];

                // Reset waiting if waiting is still active and the mouse
                // has moved too far.
                if (
                    this.stickyTimeout &&
                    (MathEx.dot(dPt, dPt) > CONST.NUDGE * CONST.NUDGE)
                ) {
                    clearTimeout(this.stickyTimeout as NodeJS.Timer);
                    this.stickyTimeout = null;

                    // Check the drag object.
                    this.dragObject = this.hitTest(ePt);

                    // Clear the selection if nothing was hit.
                    if (!this.dragObject)
                        this.clearSelected();

                    // Update the drag object if it is a node.
                    else if (Drawables.isDrawableNode(this.dragObject))
                        this.updateDrawable(this.dragObject);

                    // Clear the drag object if it is an edge.
                    //
                    // TODO:
                    // Make sure that this.dragObject is an instance of
                    // `{ d: DrawableEdge, pt: point }`
                    else
                        this.dragObject = null;
                }

                // Update the canvas if waiting is not set.
                else if (!this.stickyTimeout) {

                    // Update the selection box if selecting.
                    if (!this.dragObject) {
                        let rect = canvas.makeRect(downPt, ePt);

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
                        canvas.drawSelectionBox(this.g, rect);
                    }

                    // Update node position if dragging node.
                    else if (Drawables.isDrawableNode(this.dragObject)) {
                        this.updateDragNodes(
                            this.dragObject,
                            [
                                ePt[0] - this.dragObject.position.x,
                                ePt[1] - this.dragObject.position.y
                            ]
                        );
                    }

                    // Update edge endpoint if dragging edge.
                    //
                    // TODO:
                    // Make sure that this.dragObject is an instance of
                    // `{ d: DrawableEdge, pt: point }`
                    else {
                        this.updateEdgePoints(this.dragObject.e, ePt);
                        this.updateDrawable(this.dragObject.e);
                        this.redraw();
                    }
                }
            }

            // Mouse hover.
            else {
                this.updateHoverObject(this.hitTest(ePt));
            }
        }
    }

    /**
     * onMouseUp  
     *   Handles the mouseup event.
     */
    private onMouseUp(e: MouseEvent): void {

        // Make sure a mousedown event was previously captured.
        if (this.graph && this.downEvt) {
            let ePt = canvas.getMousePt(this.g, e);

            // Set the selected graph component if waiting.
            if (this.stickyTimeout) {
                this.clearSelected();
                let hitObject = this.hitTest(ePt);
                if (Drawables.isDrawableNode(hitObject))
                    this.addSelectedItem(hitObject);
                else if (hitObject)
                    this.addSelectedItem(hitObject.e);
            }

            // Drop the node if one is being dragged.
            else if (Drawables.isDrawableNode(this.dragObject)) {
                this.dropNodes(this.dragObject, ePt);
            }

            // Create the edge if one is being dragged.
            else if (this.dragObject) {
                this.dropEdge(this.graph, this.dragObject.e, ePt);
            }

            // Reset input states.
            this.resetState();

            // Redraw the canvas.
            this.redraw();
        }
    }

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
        let hitObject = this.hitTest(pt);
        if (Drawables.isDrawableNode(hitObject)) {
            let srcNode = (dragEdge.source ? dragEdge.source : hitObject);
            let dstNode = (
                dragEdge.destination ?
                    dragEdge.destination :
                    hitObject
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
        if (this.graph) {
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
        else
            this.selectionChanged.emit(new Set<Drawable>());
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
    private updateDrawable(d: Drawable): void {
        if (this.graph) {
            if (Drawables.isDrawableEdge(d)) {
                this.drawMap.set(
                    d,
                    makeFnEdge(
                        this.g,
                        d,
                        this.edgePoints.get(d) as point[],
                        (typeof this.dragObject === "{ e: DrawableEdge, pt: point }" ? d === (this.dragObject as { e: DrawableEdge, pt: point }).e : false),
                        d === this.hoverObject,
                        this.selectedItems.has(d)
                    )
                );
            }
            else if (Drawables.isDrawableNode(d)) {
                this.drawMap.set(
                    d,
                    makeFnNode(
                        this.g,
                        d,
                        this.nodeDimensions.get(d),
                        d === this.dragObject,
                        d === this.hoverObject,
                        this.selectedItems.has(d)
                    )
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
                    canvas.getLoopEdgePoints(
                        e,
                        e.source,
                        this.nodeDimensions.get(e.source)
                    )
                );
            else {
                let overlapped =
                    Drawables.getOverlappedEdges(e, this.nodeEdges);
                if (overlapped.size > 0) {
                    this.edgePoints.set(
                        e,
                        canvas.getQuadraticEdgePoints(
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
                            canvas.getQuadraticEdgePoints(
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
                        canvas.getStraightEdgePoints(
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
                canvas.getStraightEdgePoints(
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
            canvas.getNodeDimensions(this.g, n)
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
        this.nodeEdges.set(n, new Set<Drawables.DrawableEdge>());
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
        if (n === this.hoverObject)
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
        if (e === this.hoverObject)
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
                Drawables.getOverlappedEdges(e, this.nodeEdges);
            for (let edge of overlapped)
                this.updateDrawable(edge);
        }
    }

    /**
     * setHoverObject  
     *   Sets the object being hovered over by the mouse.
     */
    private updateHoverObject(
        value: DrawableNode | { e: DrawableEdge, pt: point } | null
    ): void {
        if (value !== this.hoverObject) {
            let prev = this.hoverObject;
            if (!value || Drawables.isDrawableNode(value))
                this.hoverObject = value;
            else
                this.hoverObject = value.e;
            if (prev)
                this.updateDrawable(prev);
            if (this.hoverObject)
                this.updateDrawable(this.hoverObject);
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
                if (Drawables.isDrawableNode(o))
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
        for (let e of (this.nodeEdges.get(n) as Set<Drawables.DrawableEdge>)) {
            this.updateEdgePoints(e);
            this.updateDrawable(e);
        }
    }

    /**
     * addSelectedItem  
     *   Adds an item to the selected items set.
     */
    private addSelectedItem(item: Drawable) {
        if (this.graph && moveItem(
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
        if (this.graph && moveItem(
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
    ): DrawableNode | { e: DrawableEdge, pt: point } | null {
        if (this.graph) {
            for (const d of this.drawList) {
                let hitObject = (Drawables.isDrawableEdge(d) ?
                    this.hitTestEdge(d, pt) :
                    this.hitTestNode(d, pt));
                if (hitObject) {
                    return hitObject;
                }
            }
        }
        return null;
    }

    /**
     * hitTestNode  
     *   Checks if a point is within the boundary of a node.
     */
    private hitTestNode(n: DrawableNode, pt: point): DrawableNode | null {
        let dim = this.nodeDimensions.get(n);
        switch (n.shape) {
            case "circle":
                return (
                    canvas.hitTestCircle(
                        [n.position.x, n.position.y],
                        pt,
                        dim.r
                    ) ?
                        n :
                        null
                );

            case "square":
                return (
                    canvas.hitTestSquare(
                        [n.position.x, n.position.y],
                        pt,
                        dim.s
                    ) ?
                        n :
                        null
                );
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
    ): { e: DrawableEdge, pt: point } | null {
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
                        return { e: e, pt: (dotpp < dotee / 4 ? src : dst) };
            }
        }
        return null;
    }

    /**
     * rectHitTest  
     *   Checks if a graph component was hit by a rectangle.
     */
    private rectHitTest(c: Drawable, rect: canvas.rect): boolean {

        // TODO:
        // A possible solution is to check if the boundary of the selection box
        // intersects with the boundary of a node or edge.

        return (Drawables.isDrawableNode(c) &&
            c.position.x >= rect.x && c.position.x <= rect.x + rect.w &&
            c.position.y >= rect.y && c.position.y <= rect.y + rect.h) ||
            (Drawables.isDrawableEdge(c) &&
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
