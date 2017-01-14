// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
//
// Notes:
//
// For deleting graph components, it would be better to have a global keybinding
// with the keybind activation event calling some method to delete the selected
// components. It may be better to have such functionality outside of the
// graph editor component.
//
// The canvas element needs to have its height and width properties updated in
// order for its rendering context to be resized properly. Using css to handle
// resizing for the canvas will stretch the image on the cavas as well as its
// "pixels" rather than having the canvas map 1:1 with the screen.
//
//
// Resources:
// - System colors:
//   https://www.w3.org/TR/REC-CSS2/ui.html#system-colors
//
//
// Discussion:
// - Special drawing start/final nodes should be the concern of the plugin;
//   the graph editor should not have to be aware of _any_ type information or
//   behavior properties of any of the drawable elements.
// - Should drawable interfaces have optional properties/methods?
// - backgroundColor should not be a property of a DrawableGraph; it should be
//   a property of the graph editor component.
//
//
// TODO:
// - Need a way to listen for label change events.
// - Zoom and Pan
//   pinch to zoom/two-touch drag to pan
// - Snap to grid.
// - Custom shapes/images for nodes.
// - Custom lines for edges (default/quadratic/bezier/orthogonal).
// - Make sure to handle hit testing of custom shapes.
// - Make it so that if any part of a component is caught within the selection
//   box, it is selected
// - @Input height/width
// - Something about deep binding for the graph components? [For now, use
//   redraw]
// - Have a visual indication for determining if an edge can be moved from one
//   node to another.
// - Update documentation.
// - Text location options. [Maybe]
//   - Top, Left, Bottom, Right, Center
//   - Inside, Outside, Center
// - Consolidate code duplication.
//
//


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
    Drawable
} from "./drawable-interfaces";


// Type aliases ////////////////////////////////////////////////////////////////


type Drawable = Drawables.Drawable;
type DrawableGraph = Drawables.DrawableGraph;
type DrawableEdge = Drawables.DrawableEdge;
type DrawableNode = Drawables.DrawableNode;
type GraphContext = Drawables.GraphContext;

type point = number[];
type DrawableSet = Set<Drawable>;
type timer = NodeJS.Timer | number;
type callback = () => void;
type DrawMap = Map<Drawable, callback>;
type DrawList = Array<Drawable>;
type EdgePointMap = Map<DrawableEdge, number[]>;
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
     *   The first two points are the end points. All other points are control
     *   points for bezier curves.
     */
    private edgePoints: EdgePointMap = new Map<DrawableEdge, number[]>();

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
     * setGraphContext    
     *   Input property for the graph context.
     */
    @Input("context")
    set setGraphContext(value: GraphContext | null) {
        if (value) {
            this.graph = value.graph;
            this.selectedItems = value.selectedDrawables;
            this.initSelectedItems();
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
            for (const d of this.selectedItems)
                this.removeSelectedItem(d);
        }
    }

    private initSelectedItems(): void {
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

    private addNodeEdge(e: DrawableEdge): void {
        if (e.source)
            (this.nodeEdges.get(e.source) as EdgeSet).add(e);
        if (e.destination)
            (this.nodeEdges.get(e.destination) as EdgeSet).add(e);
    }

    private updateDrawable(d: Drawable): void {
        if (this.graph && d) {
            if (Drawables.isDrawableEdge(d)) {
                // TODO:
                // Update edge points.
                this.drawMap.set(
                    d,
                    makeFnEdge(
                        this.g,
                        d,
                        this.edgePoints.get(d) as number[],
                        d === this.dragObject,
                        d === this.hoverObject,
                        this.selectedItems.has(d)
                    )
                );
            }
            else if (Drawables.isDrawableNode(d)) {
                // TODO:
                // Update edge points.
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
     * isOverlapping  
     *   Checks if two edges are overlapping.  
     *   It is assumed that the edge being checked does not have the same source
     *   and destination nodes.
     */
    private isOverlapping(e: Drawables.DrawableEdge): boolean {
        if (this.graph) {
            for (const edge of this.graph.edges) {
                if (
                    e !== edge &&
                    e.source === edge.destination &&
                    e.destination === edge.source
                )
                    return true;
            }
        }
        return false;
    }

    /**
     * getEdgePtShift  
     *   Gets the vector in the direction of `u` that is on the boundary of a
     *   node based on its geometry.
     */
    private getEdgePtShift(u: number[], n: Drawables.DrawableNode): number[] {
        let v = [0, 0];

        // The boundary of a circle is just its radius plus half its border width.
        if (n.shape === "circle") {
            v[0] = u[0] * this.nodeDimensions.get(n).r + n.borderWidth / 2;
            v[1] = u[1] * this.nodeDimensions.get(n).r + n.borderWidth / 2;
        }

        // The boundary of a square depends on the direction of u.
        else if (n.shape === "square") {
            let up = [
                (u[0] < 0 ? -u[0] : u[0]),
                (u[1] < 0 ? -u[1] : u[1])
            ];
            let s = this.nodeDimensions.get(n).s;
            if (up[0] < up[1]) {
                let ratio = up[0] / up[1];
                let b = s / up[1];
                let a = ratio * up[0];
                s = MathEx.mag([a, b]);
            }
            else {
                let ratio = up[1] / up[0];
                let a = s / up[0];
                let b = ratio * up[1];
                s = MathEx.mag([a, b]);
            }
            v[0] = u[0] * s + n.borderWidth / 2;
            v[1] = u[1] * s + n.borderWidth / 2;
        }
        return v;
    }

    /**
     * setEdgePoints  
     *   Sets the end points and any control points associated with an edge.
     */
    private setEdgePoints(
        e: Drawables.DrawableEdge,
        x?: number,
        y?: number
    ): void {
        console.assert(e.source || e.destination,
            "error GraphEditorComponent.setEdgePoints: drawable edge must have either a source or a destination");
        // TODO:
        // Something about anchor points for custom node images.
        if (e.source && e.destination) {
            if (e.source === e.destination)
                this.setLoopEdgePoints(e, e.source);
            else if (this.isOverlapping(e))
                this.setQuadraticEdgePoints(e, e.source, e.destination);
            else
                this.setStraightEdgePoints(e, x, y);
        }
        else
            this.setStraightEdgePoints(e, x, y);
    }

    /**
     * setStraightEdgePoints  
     *   Sets the end points of a straight line.
     */
    private setStraightEdgePoints(e: Drawables.DrawableEdge, x?: number, y?: number): void {
        let pts: number[] = [];
        this.edgePoints.set(e, pts);
        if (e.source && e.destination) {
            let v = [
                e.destination.x - e.source.x,
                e.destination.y - e.source.y
            ];
            let d = MathEx.mag(v);
            let u = [v[0] / d, v[1] / d];
            let shiftPt = this.getEdgePtShift(u, e.source);
            pts.push(e.source.x + shiftPt[0]);
            pts.push(e.source.y + shiftPt[1]);
            u[0] *= -1;
            u[1] *= -1;
            shiftPt = this.getEdgePtShift(u, e.destination);
            pts.push(e.source.x + v[0] + shiftPt[0]);
            pts.push(e.source.y + v[1] + shiftPt[1]);
        }
        else if (e.source && !e.destination) {
            console.assert(x && y, "error GraphEditorComponent.setStraightEdgePoints: x and y must be defined.");
            let v = [
                x - e.source.x,
                y - e.source.y
            ];
            let d = MathEx.mag(v);
            let u = [v[0] / d, v[1] / d];
            let shiftPt = this.getEdgePtShift(u, e.source);
            pts.push(e.source.x + shiftPt[0]);
            pts.push(e.source.y + shiftPt[1]);
            pts.push(x as number);
            pts.push(y as number);
        }
        else if (!e.source && e.destination) {
            console.assert(x && y, "error GraphEditorComponent.setStraightEdgePoints: x and y must be defined.");
            let v = [
                e.destination.x - x,
                e.destination.y - y
            ];
            let d = MathEx.mag(v);
            let u = [-v[0] / d, -v[1] / d];
            pts.push(x as number);
            pts.push(y as number);
            let shiftPt = this.getEdgePtShift(u, e.destination);
            pts.push(x + v[0] + shiftPt[0]);
            pts.push(y + v[1] + shiftPt[1]);
        }
    }

    /**
     * setLoopEdgePoints  
     *   Sets the edge points of a self-referencing node.
     */
    private setLoopEdgePoints(e: Drawables.DrawableEdge, n: Drawables.DrawableNode): void {
        // TODO:
        this.edgePoints.set(e, []);
    }

    /**
     * setQuadraticEdgePoints  
     *   Sets the edge points of an overlapping edge.
     */
    private setQuadraticEdgePoints(
        e: Drawables.DrawableEdge,
        src: Drawables.DrawableNode,
        dst: Drawables.DrawableNode
    ): void {
        let v = [
            dst.x - src.x,
            dst.y - src.y
        ];
        let d = MathEx.mag(v);
        let n = [
            v[1] / d,
            -v[0] / d
        ];

        let pt1 = [
            v[0] / 2 + n[0] * CONST.GRID_SPACING,
            v[1] / 2 + n[1] * CONST.GRID_SPACING
        ];
        d = MathEx.mag(pt1);
        let shiftPt = this.getEdgePtShift([pt1[0] / d, pt1[1] / d], src);
        let pt0 = [
            src.x + shiftPt[0],
            src.y + shiftPt[1]
        ];
        shiftPt = this.getEdgePtShift([(pt1[0] - v[0]) / d, (pt1[1] - v[1]) / d], dst);
        let pt2 = [
            src.x + v[0] + shiftPt[0],
            src.y + v[1] + shiftPt[1]
        ];
        this.edgePoints.set(e, [pt0[0], pt0[1], pt2[0], pt2[1], pt1[0], pt1[1]]);
    }

    private setNodeDimensions(n: Drawables.DrawableNode): void {
        if (n.shape === "circle") {
            let lines = n.label.split("\n");
            let size = canvas.getTextSize(
                this.g,
                lines,
                CONST.NODE_FONT_FAMILY,
                CONST.NODE_FONT_SIZE
            );
            let s = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
                CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
            this.nodeDimensions.set(n, { r: (s < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : s) / 2, th: size.h });
        }
        else if (n.shape === "square") {
            let lines = n.label.split("\n");
            let size = canvas.getTextSize(
                this.g,
                lines,
                CONST.NODE_FONT_FAMILY,
                CONST.NODE_FONT_SIZE
            );
            let s = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
                CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
            this.nodeDimensions.set(n, { s: (s < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : s), th: size.h });
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
            for (const item in remove) {
                if (Drawables.isDrawableEdge(item))
                    this.removeEdge(item);
                else if (Drawables.isDrawableNode(item))
                    this.removeNode(item);
            }
            this.clearSelected();
            this.redraw();
        }
    }

    private addNode(pt?: number[]): DrawableNode | null {
        if (this.graph) {
            let n = this.graph.createNode();
            if (pt) {
                n.x = pt[0];
                n.y = pt[1];
            }
            this.nodeEdges.set(n, new Set<Drawables.DrawableEdge>());
            this.setNodeDimensions(n);
            this.updateDrawable(n);
            this.drawList.push(n);
            return n;
        }
        return null;
    }

    private removeNode(n: DrawableNode): void {
        if (this.graph) {
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

    private addEdge(src: DrawableNode, dst: DrawableNode, like?: DrawableEdge): DrawableEdge | null {
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

    private removeEdge(e: DrawableEdge): void {
        if (this.graph) {
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

                        // if (this.graph) {
                        // Create a new node and set it as the drag object if no drag object
                        // was set.
                        if (!this.dragObject && (this.dragObject = this.addNode(downPt))) {
                            this.clearSelected();
                            this.addSelectedItem(this.dragObject);
                            this.redraw();
                        }

                        // Set the drag object to some dummy edge and the replace edge to the
                        // original drag object if the drag object was an edge.
                        else if (Drawables.isDrawableEdge(this.dragObject)) {
                            //
                            // TODO:
                            // Determine which side of the edge the hit test landed on.
                            //
                            this.moveEdge = this.dragObject;
                            this.dragObject = Drawables.cloneEdge(this.moveEdge);
                            this.dragObject.lineStyle = CONST.EDGE_DRAG_LINESTYLE;
                            this.dragObject.destination = null;
                            this.setEdgePoints(this.dragObject, downPt[0], downPt[1]);
                            this.updateDrawable(this.dragObject);
                            this.drawList.push(this.dragObject);
                            this.redraw();
                            // this.g.globalAlpha = 0.5;
                            // TODO:
                            // this.drawEdge(this.dragObject, downPt[0], downPt[1]);
                            // this.g.globalAlpha = 1;
                        }

                        // Create a new dummy edge with the source node as the drag object.
                        else if (Drawables.isDrawableNode(this.dragObject)) {
                            this.dragObject = new Drawables.DefaultEdge(this.dragObject);
                            this.dragObject.lineStyle = CONST.EDGE_DRAG_LINESTYLE;
                            this.dragObject.destination = null;
                            this.setEdgePoints(this.dragObject, downPt[0], downPt[1]);
                            this.updateDrawable(this.dragObject);
                            this.drawList.push(this.dragObject);
                            this.redraw();
                            // this.g.globalAlpha = 0.3;
                            // TODO:
                            // this.drawEdge(this.dragObject, downPt[0], downPt[1]);
                            // this.g.globalAlpha = 1;
                        }
                        // }
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

                // Reset waiting if waiting is still active and the mouse has moved too
                // far.
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
                }

                // Update the canvas if waiting is not set.
                else if (!this.stickyTimeout) {

                    // Update the selection box if selecting.
                    if (!this.dragObject) {
                        let rect = canvas.makeRect(downPt[0], downPt[1], ePt[0], ePt[1]);

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
                        this.selectionChanged.emit(new Set<Drawable>(
                            this.selectedItems
                        ));

                        // Update the canvas.
                        this.redraw();
                        canvas.drawSelectionBox(this.g, rect);
                    }

                    // Update edge endpoint if dragging edge.
                    else if (Drawables.isDrawableEdge(this.dragObject)) {
                        this.setEdgePoints(this.dragObject, downPt[0], downPt[1]);
                        this.updateDrawable(this.dragObject);
                        this.redraw();
                        // this.g.globalAlpha = 0.3;
                        // TODO:
                        // this.drawEdge(this.dragObject, ePt[0], ePt[1]);
                        // this.g.globalAlpha = 1;
                    }

                    // Update node position if dragging node.
                    else if (Drawables.isDrawableNode(this.dragObject)) {
                        this.updateDragNodes(
                            this.dragObject,
                            [ePt[0] - this.dragObject.x, ePt[1] - this.dragObject.y]
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

    private updateDragNode(n: DrawableNode, dPt: point): void {
        n.x += dPt[0];
        n.y += dPt[1];
        for (let e of (this.nodeEdges.get(n) as Set<Drawables.DrawableEdge>))
            this.updateDrawable(e);
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

            // Set the selected graph component if none is set and the mouse is
            // hovering over a component.
            // else if (!this.dragObject && this.hoverObject) {
            //     this.dragObject = this.hoverObject;
            // }

            // Create the edge if one is being dragged.
            else if (Drawables.isDrawableEdge(this.dragObject)) {

                // Check that the mouse was released at a node.
                let hit = this.hitTest(ePt);
                if (Drawables.isDrawableNode(hit)) {

                    // Move the edge if one is being dragged and it can be moved.
                    if (
                        this.moveEdge &&
                        this.dragObject.source &&
                        this.graph.canCreateEdge(this.dragObject.source, hit, this.moveEdge)
                    ) {
                        this.removeEdge(this.moveEdge);
                        this.dragObject =
                        this.addEdge(this.dragObject.source, hit, this.moveEdge);
                    }

                    // Create a new edge if none is being moved and it can be created.
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
            }

            // Drop the node if one is being dragged.
            else if (Drawables.isDrawableNode(this.dragObject)) {
                if (
                    this.selectedItems.has(this.dragObject) &&
                    this.selectedItems.size > 0
                ) {
                    let dx = ePt[0] - this.dragObject.x;
                    let dy = ePt[1] - this.dragObject.y;
                    for (let o of this.selectedItems) {
                        if (Drawables.isDrawableNode(o)) {
                            o.x += dx;
                            o.y += dy;
                        }
                    }
                }
                else {
                    //
                    // TODO:
                    // Pevent nodes from being dropped on top of eachother.
                    //
                    this.dragObject.x = ePt[0];
                    this.dragObject.y = ePt[1];
                }
            }

            // Reset the selected item.
            if (this.dragObject && this.selectedItems.size < 2) {
                this.clearSelected();
                this.addSelectedItem(this.dragObject);
            }

            if (this.dragObject && !this.selectedItems.has(this.dragObject) && !this.unselectedItems.has(this.dragObject))
                this.drawList.pop();

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
        canvas.clear(this.g, this.graph ? this.graph.backgroundColor : "AppWorkspace");
        if (this.graph) {
            canvas.drawGrid(this.g, this.gridOriginPt);
            for (const d of this.drawList)
                (this.drawMap.get(d) as () => void)();

            // if (Drawables.isDrawableEdge(this.dragObject)) {
            //     this.g.globalAlpha = 0.5;
            //     (this.drawMap.get(this.dragObject) as () => void)();
            //     this.g.globalAlpha = 1;
            // }

            // for (let e of this.graph.edges)
            //     this.drawEdge(e);
            // for (let n of this.graph.nodes)
            //     this.drawNode(n);

            // if (Drawables.isDrawableEdge(this.hoverObject)) {
            //     //
            //     // TODO:
            //     // Draw anchor points
            //     //
            // }
        }
    }

    // /**
    //  * drawNode  
    //  *   Draws a node on the canvas.
    //  */
    // private drawNode(n: Drawables.DrawableNode): void {

    //     // Calculate the radius.
    //     let lines = n.label.split("\n");
    //     let size = canvas.getTextSize(
    //         this.g,
    //         lines,
    //         CONST.NODE_FONT_FAMILY,
    //         CONST.NODE_FONT_SIZE
    //     );
    //     let s = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
    //         CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
    //     s = (s < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : s);

    //     // Draw selected shape.
    //     if (this.selectedItems.has(n)) {
    //         if (n.shape === "circle") {
    //             canvas.drawCircle(
    //                 this.g,
    //                 n.x, n.y,
    //                 (s + n.borderWidth) / 2 + 2,
    //                 "solid",
    //                 n.borderWidth,
    //                 CONST.SELECTION_COLOR,
    //                 CONST.SELECTION_COLOR,
    //                 (n === this.dragObject || n === this.hoverObject ?
    //                     20 * CONST.AA_SCALE : undefined),
    //                 (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
    //                     (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
    //             );
    //             canvas.drawCircle(
    //                 this.g,
    //                 n.x, n.y,
    //                 s / 2,
    //                 n.borderStyle,
    //                 n.borderWidth,
    //                 n.borderColor,
    //                 n.color
    //             );
    //         }
    //         else if (n.shape === "square") {
    //             let hs = (s + n.borderWidth) / 2 + 2;
    //             canvas.drawSquare(
    //                 this.g,
    //                 n.x - hs,
    //                 n.y - hs,
    //                 2 * hs,
    //                 2 * hs,
    //                 "solid",
    //                 n.borderWidth,
    //                 CONST.SELECTION_COLOR,
    //                 CONST.SELECTION_COLOR,
    //                 (n === this.dragObject || n === this.hoverObject ?
    //                     20 * CONST.AA_SCALE : undefined),
    //                 (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
    //                     (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
    //             );
    //             hs = s / 2;
    //             canvas.drawSquare(
    //                 this.g,
    //                 n.x - hs, n.y - hs,
    //                 hs * 2, hs * 2,
    //                 n.borderStyle,
    //                 n.borderWidth,
    //                 n.borderColor,
    //                 n.color
    //             );
    //         }
    //     }

    //     // Draw unselected shape.
    //     else {
    //         if (n.shape === "circle") {
    //             canvas.drawCircle(
    //                 this.g,
    //                 n.x, n.y,
    //                 s / 2,
    //                 n.borderStyle,
    //                 n.borderWidth,
    //                 n.borderColor,
    //                 n.color,
    //                 (n === this.dragObject || n === this.hoverObject ?
    //                     20 * CONST.AA_SCALE : undefined),
    //                 (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
    //                     (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
    //             );
    //         }
    //         else if (n.shape === "square") {
    //             let hs = s / 2;
    //             canvas.drawSquare(
    //                 this.g,
    //                 n.x - hs, n.y - hs,
    //                 hs * 2, hs * 2,
    //                 n.borderStyle,
    //                 n.borderWidth,
    //                 n.borderColor,
    //                 n.color,
    //                 (n === this.dragObject || n === this.hoverObject ?
    //                     20 * CONST.AA_SCALE : undefined),
    //                 (n === this.dragObject ? CONST.NODE_DRAG_SHADOW_COLOR :
    //                     (n === this.hoverObject ? CONST.SELECTION_COLOR : undefined))
    //             );
    //         }
    //     }

    //     // Label
    //     canvas.drawText(
    //         this.g,
    //         n.x, n.y - size.h / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
    //         lines,
    //         CONST.NODE_FONT_SIZE,
    //         CONST.NODE_FONT_FAMILY,
    //         "#fff",
    //         2,
    //         "#000"
    //     );
    // }

    // /**
    //  * drawEdge  
    //  *   Draws an edge on the canvas.
    //  */
    // private drawEdge(e: Drawables.DrawableEdge, x?: number, y?: number): void {

    //     // Edge
    //     if (e === this.hoverObject) {
    //         this.g.shadowColor = CONST.SELECTION_COLOR;
    //         this.g.shadowBlur = 20 * CONST.AA_SCALE;
    //     }
    //     if (this.selectedItems.has(e)) {
    //         let d = Drawables.cloneEdge(e);
    //         d.color = CONST.SELECTION_COLOR;
    //         d.lineStyle = "solid";
    //         d.lineWidth += 3;
    //         this.drawEdge(d);
    //     }
    //     if (e === this.moveEdge)
    //         this.g.globalAlpha = 0.3;
    //     this.g.strokeStyle = e.color;
    //     this.g.lineWidth = e.lineWidth;
    //     canvas.setLineStyle(this.g, e.lineStyle, e.lineWidth);
    //     if (x && y) {
    //         if (e.source)
    //             canvas.drawLine(this.g, e.source.x, e.source.y, x, y);
    //         else if (e.destination)
    //             canvas.drawLine(this.g, x, y, e.destination.x, e.destination.y);
    //     }
    //     else if (e.source && e.destination) {
    //         canvas.drawLine(this.g, e.source.x, e.source.y, e.destination.x, e.destination.y);
    //         if (e.showSourceArrow)
    //             canvas.drawArrow(this.g, e.destination, e.source);
    //         if (e.showDestinationArrow)
    //             canvas.drawArrow(this.g, e.source, e.destination);
    //     }
    //     this.g.globalAlpha = 1;

    //     // Label
    //     if (e.source && e.destination && e.label && e.label.trim() !== "") {
    //         let lines = e.label.split("\n");
    //         let size = canvas.getTextSize(this.g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    //         let srcPt = canvas.getEdgeBorderPt(this.g, e.destination, e.source);
    //         let dstPt = canvas.getEdgeBorderPt(this.g, e.source, e.destination);
    //         let rect = makeRect(
    //             srcPt.x, srcPt.y,
    //             dstPt.x, dstPt.y
    //         );
    //         x = rect.x + rect.w / 2;
    //         y = rect.y + rect.h / 2;
    //         size.w /= 2;
    //         size.h /= 2;
    //         rect = makeRect(
    //             x - size.w - 6, y - size.h,
    //             x + size.w + 6, y + size.h);
    //         this.g.lineWidth = e.lineWidth;
    //         this.g.fillStyle = this.graph.backgroundColor;
    //         canvas.setLineStyle(this.g, e.lineStyle);
    //         this.g.lineJoin = "round";
    //         this.g.fillRect(rect.x, rect.y, rect.w, rect.h);
    //         this.g.shadowBlur = 0;
    //         this.g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    //         canvas.drawText(
    //             this.g,
    //             x, y - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
    //             lines,
    //             CONST.EDGE_FONT_SIZE,
    //             CONST.EDGE_FONT_FAMILY,
    //             "#000"
    //         );
    //     }
    //     else
    //         this.g.shadowBlur = 0;
    // }

    /**
     * addSelectedItem  
     *   Adds an item to the selected items set.
     */
    private addSelectedItem(item: Drawable) {
        if (this.graph && moveItem(this.unselectedItems, this.selectedItems, item)) {
            this.updateDrawable(item);
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        }
    }

    /**
     * removeSelectedItem  
     *   Removes an item from the selected items set.
     */
    private removeSelectedItem(item: Drawable) {
        if (this.graph && moveItem(this.selectedItems, this.unselectedItems, item)) {
            this.updateDrawable(item);
            this.selectionChanged.emit(new Set<Drawable>(this.selectedItems));
        }
    }

    /**
     * hitTest  
     *   Gets the first graph component that is hit by a point.
     * 
     * <p>
     *   Nodes take priority over edges.
     * </p>
     */
    private hitTest(pt: number[]): Drawable | null {

        if (this.graph) {
            // Hit test nodes first.
            for (let n of this.graph.nodes) {
                let dx = n.x - pt[0];
                let dy = n.y - pt[1];
                let size = canvas.getTextSize(
                    this.g,
                    n.label.split("\n"),
                    CONST.NODE_FONT_FAMILY,
                    CONST.NODE_FONT_SIZE
                );
                let hs = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
                    CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
                hs = (hs < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : hs) / 2;
                if ((n.shape === "circle" && dx * dx + dy * dy <= hs * hs) ||
                    (n.shape === "square" &&
                        pt[0] <= n.x + hs && pt[0] >= n.x - hs &&
                        pt[1] <= n.y + hs && pt[1] >= n.y - hs))
                    return n;
            }

            // Hit test edges.
            for (let e of this.graph.edges) {
                if (e.source && e.destination) {
                    // Edge vector src -> dst
                    let ve = [
                        e.destination.x - e.source.x,
                        e.destination.y - e.source.y,
                    ];
                    // Cursor vector e.src -> mouse
                    let vm = [
                        pt[0] - e.source.x,
                        pt[1] - e.source.y
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

                    if (dotpp <= dotee &&
                        dotdep <= dotee &&
                        dotrr < e.lineWidth * e.lineWidth + CONST.EDGE_HIT_MARGIN * CONST.EDGE_HIT_MARGIN)
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
        return (Drawables.isDrawableNode(c) &&
            c.x >= rect.x && c.x <= rect.x + rect.w &&
            c.y >= rect.y && c.y <= rect.y + rect.h) ||
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
