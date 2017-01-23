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
- Need a way to listen for label change events.
- Zoom and Pan
  pinch to zoom/two-touch drag to pan
- Snap to grid.
- Custom shapes/images for nodes.
- Custom lines for edges (default/quadratic/bezier/orthogonal).
- Make sure to handle hit testing of custom shapes.
- Make it so that if any part of a component is caught within the selection box,
  it is selected.
- @Input height/width
- Something about deep binding for the graph components? [For now, use redraw].
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

type point = number[];
type DrawableSet = Set<Drawable>;
type timer = NodeJS.Timer | number;
type callback = () => void;
type DrawMap = Map<Drawable, callback>;
type DrawList = Array<Drawable>;
type EdgePointMap = Map<DrawableEdge, number[][]>;
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
    private stickyTimeout: timer | null = null;

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
     * moveEdge  
     *   The edge to be replaced once the new edge has been created.
     */
    private moveEdge: DrawableEdge | null = null;

    /**
     * unselectedItems  
     *   The set of unselected graph components.
     */
    private unselectedItems: DrawableSet = new Set<Drawable>();

    /**
     * senectedItems  
     *   The set of selected graph components.
     */
    private selectedItems: DrawableSet;

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
    private edgePoints: EdgePointMap = new Map<DrawableEdge, number[][]>();

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
        console.log("meh");
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

    public update(d: Drawable | DrawableGraph, key: string) {
        if (Drawables.isDrawableEdge(d) || Drawables.isDrawableNode(d)) {
            this.updateDrawable(d);
        }
        this.redraw();
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
                (this.drawMap.get(d) as () => void)();
        }
    }

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
                    this.removeEdge(item);
                else if (Drawables.isDrawableNode(item))
                    this.removeNode(item);
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
            this.setHoverObject(null);

            // Save mouse click canvas coordinates and set waiting to true.
            this.downEvt = e;

            // Set a timeout.
            this.stickyTimeout = setTimeout(
                () => {
                    // Set the drag object and reset sticky.
                    if (this.downEvt) {
                        let downPt = canvas.getMousePt(this.g, this.downEvt);
                        clearTimeout(this.stickyTimeout as NodeJS.Timer);
                        this.stickyTimeout = null;
                        this.dragObject = this.hitTest(downPt);

                        // Create a new node and set it as the drag object if no
                        // drag object was set.
                        if (!this.dragObject) {
                            if ((this.dragObject = this.addNode(downPt))) {
                                this.clearSelected();
                                this.addSelectedItem(this.dragObject);
                                this.updateDrawable(this.dragObject);
                                this.redraw();
                            }
                        }

                        // Set the drag object to some dummy edge and the
                        // replace edge to the  original drag object if the drag
                        // object was an edge.
                        else if (Drawables.isDrawableEdge(this.dragObject)) {
                            //
                            // TODO:
                            // Determine which side of the edge the hit test
                            // landed on.
                            this.moveEdge = this.dragObject;
                            this.dragObject =
                                Drawables.cloneEdge(this.moveEdge);
                            this.dragObject.lineStyle =
                                CONST.EDGE_DRAG_LINESTYLE;
                            this.dragObject.destination = null;
                            this.drawList.push(this.dragObject);
                            this.setEdgePoints(this.dragObject, downPt);
                            this.updateDrawable(this.dragObject);
                            this.redraw();
                        }

                        // Create a new dummy edge with the source node as the
                        // drag object.
                        else if (Drawables.isDrawableNode(this.dragObject)) {
                            this.dragObject =
                                new Drawables.DefaultEdge(this.dragObject);
                            this.dragObject.lineStyle =
                                CONST.EDGE_DRAG_LINESTYLE;
                            this.dragObject.destination = null;
                            this.drawList.push(this.dragObject);
                            this.setEdgePoints(this.dragObject, downPt);
                            this.updateDrawable(this.dragObject);
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

                    // Clear the drag object if it is an edge.
                    else if (Drawables.isDrawableEdge(this.dragObject))
                        this.dragObject = null;

                    // Update the drag object if it is a node.
                    else if (Drawables.isDrawableNode(this.dragObject))
                        this.updateDrawable(this.dragObject);
                }

                // Update the canvas if waiting is not set.
                else if (!this.stickyTimeout) {

                    // Update the selection box if selecting.
                    if (!this.dragObject) {
                        let rect = canvas.makeRect(
                            downPt[0],
                            downPt[1],
                            ePt[0],
                            ePt[1]
                        );

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

                    // Update edge endpoint if dragging edge.
                    else if (Drawables.isDrawableEdge(this.dragObject)) {
                        this.setEdgePoints(this.dragObject, ePt);
                        this.updateDrawable(this.dragObject);
                        this.redraw();
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
                }
            }

            // Mouse hover.
            else {
                this.setHoverObject(this.hitTest(ePt));
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
                this.dragObject = this.hitTest(ePt);
            }

            // Create the edge if one is being dragged.
            else if (Drawables.isDrawableEdge(this.dragObject)) {

                let dummyEdge = this.drawList.pop() as DrawableEdge;
                this.drawMap.delete(dummyEdge);
                this.edgePoints.delete(dummyEdge);

                // Check that the mouse was released at a node.
                let hit = this.hitTest(ePt);
                if (Drawables.isDrawableNode(hit)) {

                    // Move the edge if one is being dragged and it can be
                    // moved.
                    if (
                        this.moveEdge &&
                        this.dragObject.source &&
                        this.graph.canCreateEdge(
                            this.dragObject.source,
                            hit,
                            this.moveEdge
                        )
                    ) {
                        this.removeEdge(this.moveEdge);
                        this.dragObject =
                            this.addEdge(
                                this.dragObject.source,
                                hit,
                                this.moveEdge
                            );
                    }

                    // Create a new edge if none is being moved and it can be
                    // created.
                    else if (
                        !this.moveEdge &&
                        this.dragObject.source &&
                        this.graph.canCreateEdge(this.dragObject.source, hit)
                    ) {
                        this.clearSelected();
                        this.dragObject =
                            this.addEdge(this.dragObject.source, hit);
                    }
                }

                // Clear the drag object if the edge was dropped on nothing.
                else
                    this.dragObject = null;
            }

            // Drop the node if one is being dragged.
            else if (Drawables.isDrawableNode(this.dragObject)) {
                if (
                    this.selectedItems.has(this.dragObject) &&
                    this.selectedItems.size > 0
                ) {
                    let dx = ePt[0] - this.dragObject.position.x;
                    let dy = ePt[1] - this.dragObject.position.y;
                    for (let o of this.selectedItems) {
                        if (Drawables.isDrawableNode(o)) {
                            o.position.x += dx;
                            o.position.y += dy;
                        }
                    }
                }
                else {
                    //
                    // TODO:
                    // Pevent nodes from being dropped on top of eachother.
                    //
                    this.dragObject.position.x = ePt[0];
                    this.dragObject.position.y = ePt[1];
                }
            }

            // Reset the selected item.
            if (this.dragObject && this.selectedItems.size < 2) {
                this.clearSelected();
                this.addSelectedItem(this.dragObject);
            }

            // Reset input states.
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;
            this.downEvt = null;
            this.dragObject = null;
            this.moveEdge = null;

            // Redraw the canvas.
            this.redraw();
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
                this.setNodeDimensions(n);
                this.updateDrawable(n);
            }
            for (const e of this.graph.edges) {
                if (!this.selectedItems.has(e))
                    this.unselectedItems.add(e);
                this.drawList.push(e);
                this.addNodeEdge(e);
                this.setEdgePoints(e);
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
        if (this.graph && d) {
            if (Drawables.isDrawableEdge(d)) {
                this.drawMap.set(
                    d,
                    makeFnEdge(
                        this.g,
                        d,
                        this.edgePoints.get(d) as number[][],
                        d === this.dragObject,
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
     * setEdgePoints  
     *   Sets the end points, midpoint, and any control points associated with
     *   an edge.
     */
    private setEdgePoints(
        e: DrawableEdge,
        pt?: number[]
    ): void {
        console.assert(
            e.source || e.destination,
            "error GraphEditorComponent.setEdgePoints: drawable edge must " +
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
     * setNodeDimensions  
     *   Sets the dimensions of a node based on its geometry.
     */
    private setNodeDimensions(n: DrawableNode): void {
        this.nodeDimensions.set(
            n,
            canvas.getNodeDimensions(this.g, n)
        );
    }

    /**
     * addNode  
     *   Adds a node to the graph editor.
     */
    private addNode(pt?: number[]): DrawableNode | null {
        if (this.graph) {
            let n = this.graph.createNode();
            if (pt) {
                n.position.x = pt[0];
                n.position.y = pt[1];
            }
            this.nodeEdges.set(n, new Set<Drawables.DrawableEdge>());
            this.setNodeDimensions(n);
            this.updateDrawable(n);
            this.drawList.push(n);
            return n;
        }
        return null;
    }

    /**
     * removeNode  
     *   Removes a node from the graph editor.
     */
    private removeNode(n: DrawableNode): void {
        if (this.graph) {
            if (n === this.hoverObject)
                this.setHoverObject(null);
            let edges = [...(this.nodeEdges.get(n) as EdgeSet)];
            for (const e of edges)
                this.removeEdge(e);
            this.graph.removeNode(n);
            this.removeSelectedItem(n);
            this.unselectedItems.delete(n);
            this.nodeEdges.delete(n);
            this.nodeDimensions.delete(n);
            this.drawMap.delete(n);
            this.drawList = this.drawList.filter((v) => {
                return (v !== n);
            });
        }
    }

    /**
     * addEdge  
     *   Adds an edge to the graph editor.
     */
    private addEdge(
        src: DrawableNode,
        dst: DrawableNode,
        like?: DrawableEdge
    ): DrawableEdge | null {
        if (this.graph) {
            let e = this.graph.createEdge(src, dst, like);
            (this.nodeEdges.get(src) as EdgeSet).add(e);
            (this.nodeEdges.get(dst) as EdgeSet).add(e);
            this.setEdgePoints(e);
            this.updateDrawable(e);
            this.drawList = this.drawList.filter((v) => {
                return v !== src && v !== dst;
            });
            this.drawList.push(e);
            this.drawList.push(src);
            this.drawList.push(dst);
            return e;
        }
        return null;
    }

    /**
     * removeEdge  
     *   Removes an edge from the graph editor.
     */
    private removeEdge(e: DrawableEdge): void {
        if (this.graph) {
            if (e === this.hoverObject)
                this.setHoverObject(null);
            if (e.source)
                (this.nodeEdges.get(e.source) as EdgeSet).delete(e);
            if (e.destination)
                (this.nodeEdges.get(e.destination) as EdgeSet).delete(e);
            this.graph.removeEdge(e);
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
    }

    /**
     * setHoverObject  
     *   Sets the object being hovered over by the mouse.
     */
    private setHoverObject(value: Drawable | null): void {
        if (value !== this.hoverObject) {
            let prev = this.hoverObject;
            this.hoverObject = value;
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
            this.setEdgePoints(e);
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
     * 
     *   Nodes take priority over edges.
     */
    private hitTest(pt: number[]): Drawable | null {

        // TODO:
        // This needs to be reworked to handle curved edges.

        if (this.graph) {
            // Hit test nodes first.
            for (let n of this.graph.nodes) {
                let dx = n.position.x - pt[0];
                let dy = n.position.y - pt[1];
                let size = canvas.getTextSize(
                    this.g,
                    n.label.split("\n"),
                    CONST.NODE_FONT_FAMILY,
                    CONST.NODE_FONT_SIZE
                );
                let hs = (
                    CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
                        CONST.GRID_SPACING :
                        size.h + 1.5 * CONST.NODE_FONT_SIZE
                );
                hs = (
                    hs < size.w + CONST.NODE_FONT_SIZE ?
                        size.w + CONST.NODE_FONT_SIZE :
                        hs
                ) / 2;
                if ((n.shape === "circle" && dx * dx + dy * dy <= hs * hs) ||
                    (n.shape === "square" &&
                        pt[0] <= n.position.x + hs && pt[0] >= n.position.x - hs &&
                        pt[1] <= n.position.y + hs && pt[1] >= n.position.y - hs))
                    return n;
            }

            // Hit test edges.
            for (let e of this.graph.edges) {
                if (e.source && e.destination) {
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
                        return e;
                }
            }
        }
        return null;
    }

    /**
     * rectHitTest  
     *   Checks if a graph component was hit by a rectangle.
     */
    private rectHitTest(c: Drawable, rect: any): boolean {

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
