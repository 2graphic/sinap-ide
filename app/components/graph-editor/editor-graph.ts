/**
 * @file `editor-graph.ts`
 *   Created on March 16, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @todo
 *   Remove draw calls and only have the editor component make calls to draw
 *   (except for events).
 */

// TODO: Make sure to not rely on this dependency long term.
// import { PLUGIN_DIRECTORY } from "../../services/plugin.service";
// import { remote } from "electron";
// const path = remote.require("path");

import { NUDGE, SELECTION_COLOR, STICKY_DELAY } from "./defaults";
import {
    DrawableEvent,
    MoveEdgeEvent,
    PropertyChangedEvent,
    SelectionChangedEvent
} from "./events";
import * as MathEx from "./math";
import { IMAGES, EditorCanvas, makeRect, point } from "./editor-canvas";
import { EditorElement } from "./editor-element";
import { EditorEdge } from "./editor-edge";
import { EditorNode, HIDDEN_NODE } from "./editor-node";
import { DrawableGraph } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";


export { DrawableGraph } from "./drawable-graph";


type callback = () => void;


/**
 * `EditorGraph`
 *
 *   Provides draw, hit, and update logic for a drawable graph.
 */
export class EditorGraph {
    constructor(
        public readonly drawable: DrawableGraph,
        private readonly g: EditorCanvas
    ) {
        drawable.addEventListener("created", this.onCreated);
        drawable.addEventListener("deleted", this.onDeleted);
        drawable.addEventListener("moved", this.onMovedEdge);
        drawable.addEventListener("change", this.onDrawablePropertyChanged);
        drawable.addEventListener("select", this.onGraphSelectionChanged);
        for (const d of [...drawable.edges, ...drawable.nodes])
            this.registerDrawable(d);
        this.selected.clear();
        for (const s of drawable.selectedItems)
            this.selected.add(this.drawables.get(s)!);
        this.unselected.clear();
        for (const u of drawable.unselectedItems)
            this.unselected.add(this.drawables.get(u)!);
    }


    // Private fields //////////////////////////////////////////////////////////


    /**
     * `dragObect`
     *
     *   The node being dragged by the cursor.
     */
    private dragObject: EditorNode | null
    = null;

    /**
     * `dragPt`
     *
     *   The previous drag event point.
     */
    private dragPoint: point | null
    = null;

    /**
     * `selectionPoint`
     *
     *   The starting point of the selection rectangle.
     */
    private selectionPoint: point | null
    = null;

    /**
     * `hoverObject`
     *
     *   The graph element over which the cursor is hovering.
     */
    private hoverObject: EditorElement<DrawableElement> | null
    = null;

    /**
     * `moveEdge`
     *
     *   The edge to be replaced once the new edge has been created.
     */
    private moveEdge: EditorEdge | null
    = null;

    /**
     * `selected`
     *
     *   The set of selected elements to prevent live selection from bombarding
     *   the `select` event on the drawable graph.
     */
    private readonly selected: Set<EditorElement<DrawableElement>>
    = new Set<EditorElement<DrawableElement>>();

    /**
     * `uselected`
     *
     *   The set of unselected elements to prevent live selection from
     *   bombarding the `select` event on the drawable graph.
     */
    private readonly unselected: Set<EditorElement<DrawableElement>>
    = new Set<EditorElement<DrawableElement>>();

    /**
     * `drawables`
     *
     *   The map of drawable elements to editor elements.
     */
    private readonly drawables:
    Map<DrawableElement, EditorElement<DrawableElement>>
    = new Map<DrawableElement, EditorElement<DrawableElement>>();

    /**
     * `nodes`
     *
     *   The list of nodes.
     */
    private nodes: EditorNode[]
    = [];

    /**
     * `_draw`
     *
     *   The `draw` delegate.
     */
    private _draw: callback
    = MathEx.NOOP;

    /**
     * `_drawSelectionBox`
     *
     *   The `drawSelectionBox` delegate.
     */
    private _drawSelectionBox: callback
    = MathEx.NOOP;


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * `isDragging`
     *
     *   Gets whether or not an object is currently being dragged.
     */
    get isDragging() {
        return this.dragObject !== null;
    }


    /**
     * `draw`
     *
     *   Draws the graph.
     */
    get draw() {
        return this._draw;
    }

    /**
     * `suspendDraw`
     *
     *   Suspends drawing of the graph.
     */
    suspendDraw() {
        this._draw = MathEx.NOOP;
    }

    /**
     * `resumeDraw`
     *
     *   Resumes drawing of the graph.
     */
    resumeDraw() {
        this._draw = () => {
            // Selection highlights.
            this.g.clear();
            this.selected.forEach(s => s.drawHighlight(this.g));
            this.g.globalCompositeOperation = "source-in";
            this.g.clear(SELECTION_COLOR);
            this.g.globalCompositeOperation = "source-over";
            // Graph.
            const visited = new Set<EditorElement<DrawableElement>>();
            if (this.dragObject)
                visited.add(this.dragObject);
            this.nodes.forEach(v => this.drawTree(v, visited));
            if (this.dragObject) {
                visited.delete(this.dragObject);
                this.drawTree(this.dragObject, visited);
            }
            this._drawSelectionBox();
        };
        this.draw();
    }

    /**
     * `dragStart`
     *
     *   Starts dragging on the graph.
     *
     * @param pt
     *   The canvas coordinates of the cursor.
     */
    dragStart(pt: point) {
        // Save the mouse point in canvas coordinates.
        this.dragPoint = pt;
        // Update the drag object.
        this.updateDragObject();
        // Get the initial selection coordinate if nothing is being dragged.
        if (!this.dragObject)
            this.selectionPoint = this.dragPoint;
    }

    /**
     * `drag`
     *
     *   Performs a drag on the graph.
     *
     * @param pt
     *   The canvas coordinates of the cursor.
     */
    drag(pt: point) {
        // Make sure the graph is being dragged.
        if (this.dragPoint) {
            // Get the change in x and y locations of the cursor.
            const dpt = MathEx.diff(this.dragPoint, pt);

            // Update the selection box if selecting.
            if (!this.dragObject)
                this.updateSelectionBox(pt);

            // Update node position.
            else {
                if (this.dragObject.isHidden &&
                    this.updateHoverObject(pt)) {
                    const hoverNode = this.hoverObject as EditorNode;
                    pt = MathEx.sum(hoverNode.position, hoverNode.anchor);
                    dpt.x = this.dragPoint.x - pt.x;
                    dpt.y = this.dragPoint.y - pt.y;
                }
                this.updateDragNodes(this.dragObject, dpt);
            }

            // Update the drag point.
            this.dragPoint = pt;
        }
    }

    /**
     * `drop`
     *
     *   Finishes dragging on the graph.
     *
     * @param pt
     *   The canvas coordinates of the cursor.
     *
     * @returns
     *   True if the graph was previously being dragged; otherwise, false.
     */
    drop(pt: point) {
        // Make sure a down event was previously captured.
        if (this.dragPoint) {

            // Finish selecting elements if nothing is being dragged.
            if (!this.dragObject) {
                this.updateSelectionBox(pt);
                this.drawable
                    .setSelected(...[...this.selected].map(v => v.drawable));
            }

            // Drop the edge if one is being dragged.
            else if (this.dragObject.isHidden) {
                this.dropEdge(pt);
            }

            // Drop the node if one is being dragged.
            else {
                this.dropNodes(
                    this.dragObject,
                    MathEx.diff(this.dragPoint, pt)
                );
            }

            // Reset input states.
            this.resetState();

            // Redraw the canvas.
            this.draw();
            return true;
        }
        return false;
    }

    /**
     * `updateHoverObject`
     *
     *   Updates the hovered object and hover anchor.
     *
     * @param pt
     *   The canvas coordinate used for hit detection.
     *
     * @returns
     *   True if the hover object is set to anything; otherwise, false.
     */
    updateHoverObject(pt?: point): boolean {

        // Update the previous hover object.
        if (this.hoverObject) {
            this.hoverObject.isHovered = false;
            if (this.hoverObject instanceof EditorNode) {
                this.hoverObject.clearAnchor();
                this.hoverObject.update(this.g);
            }
            else if (this.hoverObject instanceof EditorEdge) {
                const src = this.drawables
                    .get(this.hoverObject.drawable.source) as EditorNode;
                const dst = this.drawables
                    .get(this.hoverObject.drawable.destination) as EditorNode;
                src.clearAnchor();
                dst.clearAnchor();
                src.update(this.g);
                dst.update(this.g);
            }
        }

        // Hit test graph elements.
        let hit = null;
        if (pt) {
            if (this.dragObject === HIDDEN_NODE) {
                const dragEdge = HIDDEN_NODE.edges.values().next().value;
                const like = this.moveEdge ? this.moveEdge.drawable : undefined;
                let isValidEdge: (n: DrawableNode) => boolean;
                if (dragEdge.source.isHidden)
                    isValidEdge = (n: DrawableNode) => this.drawable
                        .isValidEdge(n, dragEdge.destination.drawable, like);
                else
                    isValidEdge = (n: DrawableNode) => this.drawable
                        .isValidEdge(dragEdge.source.drawable, n, like);
                hit = this.hitPointTest(
                    pt,
                    v => v instanceof EditorNode && isValidEdge(v.drawable)
                );
                // Snap to anchor.
                if (hit) {
                    const node = hit.e as EditorNode;
                    // Get the anchor point where the edge will be dropped.
                    if (node.drawable.anchorPoints.length === 0) {
                        const src = dragEdge.source.isHidden ?
                            node :
                            dragEdge.source;
                        const dst = dragEdge.destination.isHidden ?
                            node :
                            dragEdge.destination;
                        const spt = (src === dst ?
                            { x: src.position.x, y: src.position.y - 1 } :
                            src.position);
                        const dpt = dst.position;
                        const u = { x: 0, y: 0 };
                        if (dst === node) {
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
                        hit = { e: node, pt: node.getBoundaryPoint(u) };
                    }
                }
            }
            else
                hit = this.hitPointTest(pt);
        }

        // Set the new hover object.
        if (hit) {
            this.hoverObject = hit.e;
            this.hoverObject.isHovered = true;

            // Display the anchor point if the hover object is an edge.
            if (hit.e instanceof EditorEdge) {
                const spt = hit.e.drawable.sourcePoint;
                const apt = hit.pt;
                const src = this.drawables
                    .get(hit.e.drawable.source) as EditorNode;
                const dst = this.drawables
                    .get(hit.e.drawable.destination) as EditorNode;
                if (spt.x === apt.x && spt.y === apt.y) {
                    dst.clearAnchor();
                    src.anchor = apt;
                }
                else {
                    src.clearAnchor();
                    dst.anchor = apt;
                }
                src.update(this.g);
                dst.update(this.g);
            }

            // Update the anchor point if the hover object is a node.
            else if (hit.e instanceof EditorNode) {
                if (this.drawable.isValidEdge(hit.e.drawable))
                    hit.e.anchor = hit.pt;
                else
                    hit.e.clearAnchor();
                hit.e.update(this.g);
            }
        }
        else
            this.hoverObject = null;

        this.draw();
        return this.hoverObject !== null;
    }

    /**
     * `updateDragObject`
     *
     *   Updates the object being dragged depending on the hovered object.
     */
    private updateDragObject() {
        // Create an edge or pick up the node if one is bing hovered.
        if (this.hoverObject instanceof EditorNode) {
            // Create a new edge if an anchor pt is being displayed on the node.
            if (this.hoverObject.isAnchorVisible) {
                const n = this.hoverObject;
                const edge = this.createDragEdge(n, true);
                if (n.drawable.anchorPoints.length > 0)
                    edge.bindSourceAnchor(n.anchor);
                edge.update(this.g);
            }

            // Set the drag object to the node if no anchor point is being
            // displayed.
            else {
                this.dragObject = this.hoverObject;
                this.updateHoverObject();
                if (this.dragObject.drawable.isSelected) {
                    for (const n of this.drawable.selectedNodes)
                        this.drawables.get(n)!.isDragging = true;
                }
                else {
                    this.dragObject.isDragging = true;
                }
            }
            this.draw();
        }

        // Pick up the edge if one is being hovered.
        else if (this.hoverObject instanceof EditorEdge) {
            const hoverEdge = this.hoverObject;
            const spt = hoverEdge.drawable.sourcePoint;
            const apt = (this.drawables
                .get(hoverEdge.drawable.source) as EditorNode).anchor;
            const isSrc = spt.x !== apt.x || spt.y !== apt.y;
            const edge = this.createDragEdge(
                (isSrc ? hoverEdge.source : hoverEdge.destination),
                isSrc,
                hoverEdge
            );
            const n = isSrc ?
                hoverEdge.drawable.source :
                hoverEdge.drawable.destination;
            const pt = isSrc ?
                hoverEdge.drawable.sourcePoint :
                hoverEdge.drawable.destinationPoint;
            if (n.anchorPoints.length > 0) {
                if (isSrc)
                    edge.bindSourceAnchor(pt);
                else
                    edge.bindDestinationAnchor(pt);
            }
            this.hoverObject.isDragging = true;
            this.moveEdge = this.hoverObject;
            this.updateHoverObject();
        }

        // Clear the drag object if the hover object is not a node or edge.
        else if (this.dragObject) {
            this.dragObject.isDragging = false;
            this.dragObject = null;
            this.updateHoverObject();
            this.draw();
        }
    }

    /**
     * `updateSelectionBox`
     *
     *   Updates the selection box.
     *
     * @param pt
     *   The canvas coordinate of the cursor.
     */
    private updateSelectionBox(pt: point): void {
        const rect = makeRect(this.selectionPoint!, pt);

        // Update the selected components.
        for (const s of [...this.selected]) {
            if (!s.hitRect(rect)) {
                this.selected.delete(s);
                this.unselected.add(s);
            }
        }
        for (const u of [...this.unselected]) {
            if (u.hitRect(rect)) {
                this.selected.add(u);
                this.unselected.delete(u);
            }
        }

        // Update the draw delegate.
        this._drawSelectionBox = () => {
            this.g.drawSelectionBox(rect);
        };

        // Update the canvas.
        this.draw();
    }

    /**
     * `updateSelected`
     *
     *   Updates the selected graph element.
     */
    private updateSelected(drawable: DrawableElement) {
        // Reset the selected item.
        if (this.drawable.selectedItemCount < 2)
            this.drawable.setSelected(drawable);
    }

    /**
     * `updateDragNodes`
     *
     *   Updates the collection of nodes being dragged.
     */
    private updateDragNodes(dragNode: EditorNode, dpt: point) {
        this.suspendDraw();
        const selectedNodes = [...this.drawable.selectedNodes];
        if (dragNode.drawable.isSelected && selectedNodes.length > 0) {
            for (const n of selectedNodes)
                this.updateDragNode(
                    this.drawables.get(n) as EditorNode,
                    dpt
                );
        }
        else
            this.updateDragNode(dragNode, dpt);
        this.resumeDraw();
    }

    /**
     * `updateDragNode`
     *
     *   Updates a single node being dragged.
     */
    private updateDragNode(n: EditorNode, dpt: point): void {
        n.position = MathEx.diff(n.position, dpt);
        for (const e of n.drawable.edges)
            this.drawables.get(e)!.update(this.g);
    }

    /**
     * `drawTree`
     *
     *   Performs a graph traversal in order to draw the graph.
     */
    private drawTree(
        e: EditorElement<DrawableElement>,
        visited: Set<EditorElement<DrawableElement>>
    ) {
        if (!visited.has(e)) {
            visited.add(e);
            if (e instanceof EditorNode) {
                for (const edge of e.edges)
                    this.drawTree(edge, visited);
                e.draw(this.g);
            }
            else if (e instanceof EditorEdge) {
                e.draw(this.g);
                this.drawTree(e.source, visited);
                this.drawTree(e.destination, visited);
            }
        }
    }

    /**
     * `hitPtTest`
     *
     *   Gets the first graph component that is hit by a pt.
     *
     * TODO:
     *   Should this return the entity closest to the given point?
     */
    private hitPointTest(
        pt: point,
        filter = (v: EditorElement<DrawableElement>) => true
    ): { e: EditorElement<DrawableElement>, pt: point } | null {
        let hit = this.hoverObject ?
            this.hoverObject.hitPoint(pt) :
            null;
        if (hit)
            return { e: this.hoverObject!, pt: hit };
        const elements = [...this.drawables.values()]
            .filter(v => v !== this.hoverObject && filter(v));
        for (const e of elements) {
            hit = e.hitPoint(pt);
            if (hit)
                return { e: e, pt: hit };
        }
        return null;
    }

    /**
     * `createDragEdge`
     *
     *   Creates a ghost edge to be dragged.
     */
    private createDragEdge(
        node: EditorNode,
        isSrc: boolean,
        like?: EditorEdge
    ) {
        HIDDEN_NODE.position = this.dragPoint!;
        const src = (isSrc ? node : HIDDEN_NODE);
        const dst = (isSrc ? HIDDEN_NODE : node);
        const edge = new EditorEdge(
            new DrawableEdge(
                this.drawable,
                src.drawable,
                dst.drawable,
                like ? like.drawable : undefined
            ),
            src,
            dst
        );
        edge.isDragging = true;
        edge.update(this.g);
        this.dragObject = HIDDEN_NODE;
        this.drawables.set(edge.drawable, edge);
        this.unselected.add(edge);
        return edge;
    }

    /**
     * `dropEdge`
     *
     *   Drops the dragged edge when the mouse is released.
     */
    private dropEdge(pt: point): void {
        const hoverNode = this.hoverObject;
        const dragEdge = HIDDEN_NODE.edges.values().next().value;
        const like = this.moveEdge ? this.moveEdge : undefined;
        this.moveEdge = null;
        // Move or create the edge if it was dropped on a node.
        if (hoverNode instanceof EditorNode) {
            this.suspendDraw();
            // Get the source and destination nodes.
            const src = dragEdge.source === HIDDEN_NODE ?
                hoverNode :
                dragEdge.source;
            const dst = dragEdge.destination === HIDDEN_NODE ?
                hoverNode :
                dragEdge.destination;
            // Get the created or moved edge.
            const drawable = like ?
                this.drawable
                    .moveEdge(src.drawable, dst.drawable, like.drawable) :
                this.drawable
                    .createEdge(src.drawable, dst.drawable);
            // Bind edge anchors.
            if (drawable) {
                const edge = this.drawables.get(drawable) as EditorEdge;
                if (src.drawable.anchorPoints.length > 0)
                    edge.bindSourceAnchor(
                        MathEx.diff(
                            MathEx.sum(
                                dragEdge.source.position,
                                dragEdge.drawable.sourcePoint
                            ),
                            src.position
                        )
                    );
                if (dst.drawable.anchorPoints.length > 0)
                    edge.bindDestinationAnchor(
                        MathEx.diff(
                            MathEx.sum(
                                dragEdge.destination.position,
                                dragEdge.drawable.destinationPoint
                            ),
                            dst.position
                        )
                    );
                this.updateSelected(drawable);
            }
            this.resumeDraw();
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
     * `dropNodes`
     *
     *   Drops the collection of nodes or single node that is being dragged
     *   when the mouse is released.
     */
    private dropNodes(dragNode: EditorNode, pt: point): void {
        this.updateDragNodes(dragNode, pt);
        if (dragNode.drawable.isSelected) {
            for (const n of this.drawable.selectedNodes)
                this.drawables.get(n)!.isDragging = false;
        }
        else
            dragNode.isDragging = false;
        //
        // TODO:
        // Pevent nodes from being dropped on top of eachother.
        //
        this.updateSelected(dragNode.drawable);
    }

    /**
     * `registerDrawable`
     *
     *   Registers event listeners for a drawable.
     */
    private registerDrawable(d: DrawableElement) {
        if (!this.drawables.has(d)) {
            if (d instanceof DrawableEdge) {
                if (!this.drawables.has(d.source))
                    this.registerDrawable(d.source);
                if (!this.drawables.has(d.destination))
                    this.registerDrawable(d.destination);
                this.drawables.set(
                    d,
                    new EditorEdge(
                        d,
                        this.drawables.get(d.source) as EditorNode,
                        this.drawables.get(d.destination) as EditorNode
                    )
                );
            }
            else if (d instanceof DrawableNode) {
                const node = new EditorNode(d);
                this.drawables.set(d, node);
                if (d.shape === "image")
                    this.loadImage(d);
                this.nodes.push(node);
            }
        }

        const e = this.drawables.get(d)!;
        if (d.isSelected)
            this.selected.add(e);
        else
            this.unselected.add(e);
        e.update(this.g);
        d.addEventListener("change", this.onDrawablePropertyChanged);
        this.draw();
    }

    /**
     * `unregisterDrawable`
     *
     *   Unregisters event listeners for a drawable.
     */
    private unregisterDrawable(d: DrawableElement) {
        this.updateHoverObject();
        if (d instanceof DrawableEdge) {
            const edge = this.drawables.get(d) as EditorEdge;
            edge.source.outgoingEdges.delete(edge);
            edge.destination.incomingEdges.delete(edge);
            d.source.removeEdge(d);
            d.destination.removeEdge(d);
            edge.source.update(this.g);
            edge.destination.update(this.g);
        }
        else if (d instanceof DrawableNode)
            this.nodes = this.nodes.filter(v => v.drawable !== d);
        const e = this.drawables.get(d)!;
        this.selected.delete(e);
        this.unselected.delete(e);
        this.drawables.delete(d);
        d.removeEventListener("change", this.onDrawablePropertyChanged);
        this.draw();
    }

    /**
     * `loadImage`
     *
     *   Loads a node image.
     */
    private loadImage(node: DrawableNode) {
        // TODO:
        // Look into what Daniel was talking about SVG images and angular2.
        if (node.image !== "" && !IMAGES.has(node.image)) {
            const img = new Image();
            IMAGES.set(node.image, img);
            img.onload = () => {
                this.drawables.get(node)!.update(this.g);
                this.draw();
            };
            img.src = node.image;
        }
        else if (IMAGES.has(node.image)) {
            this.drawables.get(node)!.update(this.g);
            this.draw();
        }
    }

    /**
     * `resetState`
     *
     *   Resets input states.
     */
    private resetState() {
        this._drawSelectionBox = MathEx.NOOP;
        this.dragPoint = null;
        this.selectionPoint = null;
        this.moveEdge = null;
        this.updateHoverObject();
        this.updateDragObject();
    }

    /**
     * `onCreated`
     *
     *   Registers the element for drawing and listening for property changed
     *   events.
     */
    private onCreated
    = (evt: DrawableEvent<DrawableElement>) => {
        for (const e of evt.detail.drawables)
            this.registerDrawable(e[0]);
    }

    /**
     * `onDeleted`
     *
     *   Unregisters the element from drawing and removes the event listener for
     *   property changed events.
     */
    private onDeleted
    = (evt: DrawableEvent<DrawableElement>) => {
        for (const e of evt.detail.drawables) {
            this.unregisterDrawable(e[0]);
        }
    }

    /**
     * `onMovedEdge`
     *
     *   Unregisters the original edge and registers the replacement edge.
     */
    private onMovedEdge
    = (evt: MoveEdgeEvent) => {
        this.unregisterDrawable(evt.detail.original);
        this.registerDrawable(evt.detail.replacement);
    }

    /**
     * `onDrawablePropertyChanged`
     *
     *   Updates the drawable and refreshes the canvas if the event source is
     *   a drawable element; otherwise, updates the scale or origin of the
     *   drawable graph.
     */
    private onDrawablePropertyChanged
    = (evt: PropertyChangedEvent<any>) => {
        const drawable = evt.detail.source;
        if (drawable instanceof DrawableEdge) {
            this.drawables.get(drawable)!.update(this.g);
            this.draw();
        }
        else if (drawable instanceof DrawableNode) {
            if ((evt.detail.key === "shape" && evt.detail.curr === "image") ||
                (evt.detail.key === "image" && evt.detail.curr !== "" &&
                    drawable.shape === "image"))
                this.loadImage(drawable);
            else {
                this.drawables.get(drawable)!.update(this.g);
                this.draw();
            }
        }
    }

    /**
     * `onGraphSelectionChanged`
     *
     *   Updates the lists of selected and unselected elements.
     */
    private onGraphSelectionChanged
    = (evt: SelectionChangedEvent) => {
        const graph = evt.detail.source as DrawableGraph;
        for (const s of graph.selectedItems) {
            const e = this.drawables.get(s)!;
            this.selected.add(e);
            this.unselected.delete(e);
        }
        for (const u of graph.unselectedItems) {
            const e = this.drawables.get(u)!;
            this.selected.delete(e);
            this.unselected.add(e);
        }
        this.draw();
    }

}
