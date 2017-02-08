// File: graph-editor.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


// Imports /////////////////////////////////////////////////////////////////////


import {
    AfterViewInit,
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild
} from "@angular/core";

import {
    GraphEditorCanvas,
    makeRect,
    point,
    rect
} from "./graph-editor-canvas";
import { DrawableGraph, EdgeValidator } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";
import * as DEFAULT from "./defaults";
import * as MathEx from "./math";


// Re-exports //////////////////////////////////////////////////////////////////


export { DrawableGraph, EdgeValidator, DrawableEdgeEventArgs, DrawableNodeEventArgs } from "./drawable-graph";
export { DrawableEdge } from "./drawable-edge";
export { DrawableNode } from "./drawable-node";
export { DrawableElement } from "./drawable-element";


// Type aliases ////////////////////////////////////////////////////////////////


type num = number;
type pt = point;
type callback = () => void;


// Graph Editor Angular Component //////////////////////////////////////////////


@Component({
    selector: "sinap-graph-editor",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
    private panPt: pt | null
    = null;

    /**
     * downEvt  
     *   The previous down event payload.
     */
    private downEvt: MouseEvent | null
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
    private hoverObject: DrawableEdge | DrawableNode | null
    = null;

    /**
     * moveEdge  
     *   The edge to be replaced once the new edge has been created.
     */
    private moveEdge: DrawableEdge | null
    = null;

    /**
     * unselectedItems  
     *   The set of unselected graph components.
     */
    private unselectedItems: Set<DrawableEdge | DrawableNode>
    = new Set<DrawableEdge | DrawableNode>();

    /**
     * senectedItems  
     *   The set of selected graph components.
     */
    private selectedItems: Set<DrawableEdge | DrawableNode>
    = new Set<DrawableEdge | DrawableNode>();

    /**
     * drawList  
     *   Maintains the draw order of drawable elements.
     */
    private drawList: Array<DrawableEdge | DrawableNode>
    = [];


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
            this.scale = value.scale;
            this.origin = value.origin;
            this.initDrawables();
            this.addEventListeners(this.el.nativeElement);
            this.addPublicMethods();
        }
        else {
            this.removeEventListeners(this.el.nativeElement);
            this.removePublicMethods();
            this.panPt = null;
            this.downEvt = null;
            this.stickyTimeout = null;
            this.dragObject = null;
            this.hoverObject = null;
            this.moveEdge = null;
            this.unselectedItems.clear();
            this.selectedItems.clear();
            this.drawList = [];
        }
        this.redraw();
    }

    /**
     * dragNode  
     *   Sets the node being dragged by the cursor.
     */
    // @Input()
    // dragNode(value: DrawableNode) {
    //     let n = new DrawableNode(value, this.canvas);
    //     this.drawList.push(n);
    //     this.hoverObject = n;
    //     this.updateDragObject();
    // }

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
    update(d: DrawableElement | DrawableGraph, key: string) {
        setTimeout(() => {
            // TODO:
            // Fix this.
            // for (let d of this.drawList)
            //     d.update();
            // if (isDrawableNode(d)) {
            //     this.updateNodeDimensions(d);
            //     for (const e of (this.nodeEdges.get(d) as EdgeSet)) {
            //         this.updateEdgePoints(e);
            //         this.updateDrawable(e);
            //     }
            // }
            // else if (isDrawableEdge(d))
            //     this.updateDrawable(d);
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
                if (item instanceof DrawableEdge)
                    this.removeEdge(this.graph, item);
            }
            // Note:
            // It is necessary to keep the loops separate and remove edges
            // before nodes to avoid null reference exceptions.
            for (const item of remove) {
                if (item instanceof DrawableNode)
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
                    this.stickyTimeout = (this.stickyTimeout ?
                        this.stickyTimeout :
                        setTimeout(this.onStickey, DEFAULT.STICKY_DELAY));
                }

                else
                    this.updateDragObject();

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

                // Update node position.
                else {
                    if (this.dragObject.isHidden &&
                        this.checkValidEdgeDrop(
                            this.dragObject.edges.values().next().value,
                            ePt
                        )) {
                        ePt = (this.hoverObject as DrawableNode).anchorPoint;
                    }
                    this.updateDragNodes(
                        this.dragObject,
                        {
                            x: ePt.x - this.dragObject.position.x,
                            y: ePt.y - this.dragObject.position.y
                        }
                    );
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

            // Drop the edge if one is being dragged.
            else if (this.dragObject && this.dragObject.isHidden) {
                this.dropEdge(this.graph, ePt);
            }

            // Drop the node if one is being dragged.
            else if (this.dragObject) {
                this.dropNodes(this.dragObject, ePt);
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
                moveItem(this.selectedItems, this.unselectedItems, d);
                d.isSelected = false;
            }
            this.graph.selectedItems.clear();
            this.selectionChanged.emit(new Set<DrawableElement>(this.graph.selectedItems));
        };
        this.redrawDelegate = () => {
            this.canvas.clear("#fff");
            this.canvas.drawGrid();
            for (let d of this.drawList)
                d.update();
            for (const d of this.selectedItems)
                d.drawSelectionShadow();
            for (const d of this.drawList)
                d.draw();
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
     * addNode  
     *   Adds a node to the graph editor.
     */
    private addNode(graph: DrawableGraph, pt: pt): DrawableNode {
        let d = graph.createNode();
        d.position = pt;
        let n = new DrawableNode(d, this.canvas);
        this.drawList.push(n);
        return n;
    }

    /**
     * removeNode  
     *   Removes a node from the graph editor.
     */
    private removeNode(graph: DrawableGraph, n: DrawableNode): void {
        let edges = n.edges;
        for (const e of edges)
            this.removeEdge(graph, e);
        if (n === this.hoverObject)
            this.hoverObject = null;
        this.unselectedItems.delete(n);
        this.selectedItems.delete(n);
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
        // Note:
        // This is safe because adding edges can only be done by dropping an
        // edge, and `canCreateEdge` is called before the drop happens.
        let d = graph.createEdge(src, dst, like);
        let e = new DrawableEdge(src, dst, d, this.canvas);
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
        this.drawList = this.drawList.filter(v => v !== e);
        graph.removeEdge(e);
        if (e === this.hoverObject) {
            this.hoverObject = null;
            e.sourceNode.clearAnchor();
            e.destinationNode.clearAnchor();
        }
        e.sourceNode.removeEdge(e);
        e.destinationNode.removeEdge(e);
    }

    /**
     * addSelectedItem  
     *   Adds an item to the selected items set.
     */
    private addSelectedItem(item: DrawableEdge | DrawableNode) {
        moveItem(this.unselectedItems, this.selectedItems, item);
        item.isSelected = true;
        this.graph.selectedItems.add(item);
        this.selectionChanged.emit(new Set<Drawable>(this.graph.selectedItems));
    }

    /**
     * removeSelectedItem  
     *   Removes an item from the selected items set.
     */
    private removeSelectedItem(item: DrawableEdge | DrawableNode) {
        moveItem(this.selectedItems, this.unselectedItems, item);
        item.isSelected = false;
        this.graph.selectedItems.delete(item);
        this.selectionChanged.emit(new Set<Drawable>(this.graph.selectedItems));
    }


    // Update Methods //////////////////////////////////////////////////////////


    /**
     * updateSelectionBox  
     *   Updates the selection box.
     */
    private updateSelectionBox(downPt: pt, ePt: pt): void {
        let rect = makeRect(downPt, ePt);

        // Update the selected components.
        for (let i of this.selectedItems) {
            if (!i.hitRect(rect)) {
                moveItem(this.selectedItems, this.unselectedItems, i);
                this.graph.selectedItems.delete(i);
                i.isSelected = false;
            }
        }
        for (let i of this.unselectedItems) {
            if (i.hitRect(rect)) {
                moveItem(this.unselectedItems, this.selectedItems, i);
                this.graph.selectedItems.add(i);
                i.isSelected = true;
            }
        }
        this.selectionChanged.emit(new Set<Drawable>(this.graph.selectedItems));

        // Update the canvas.
        this.redraw();
        this.canvas.drawSelectionBox(rect);
    }

    /**
     * updateSelected  
     *   Updates the selected graph element.
     */
    private updateSelected(dragObject: DrawableEdge | DrawableNode) {
        // Reset the selected item.
        if (this.selectedItems.size < 2) {
            this.clearSelected();
            this.addSelectedItem(dragObject);
        }
    }

    private updateDragObject() {
        let prev = this.dragObject;
        if (this.hoverObject instanceof DrawableNode) {
            // Create a new edge if an anchor pt is being displayed on the node.
            if (this.hoverObject.isAnchorVisible) {
                this.createDragEdge(new DefaultEdge(), this.hoverObject, true);
            }

            // Set the drag object to the node if no anchor pt is being displayed.
            else {
                this.dragObject = this.hoverObject;
                this.dragObject.isDragging = true;
                this.updateHoverObject(null);
            }
            this.redraw();
        }
        else if (this.hoverObject instanceof DrawableEdge) {
            let isSrc = this.hoverObject.sourceNode.anchorPoint !== this.hoverObject.sourcePoint;
            this.createDragEdge(
                cloneEdge(this.hoverObject),
                (isSrc ? this.hoverObject.sourceNode : this.hoverObject.destinationNode),
                isSrc
            );
            this.hoverObject.isDragging = true;
            this.moveEdge = this.hoverObject;
            this.updateHoverObject(null);
            // this.moveEdge.sourceNode.clearAnchor();
            // this.moveEdge.destinationNode.clearAnchor();
            this.redraw();
        }
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
    private updateHoverObject(value: { d: DrawableEdge | DrawableNode, pt: point } | null): void {

        let redraw = false;
        let prev = this.hoverObject;
        if (prev) {
            redraw = true;
            prev.isHovered = false;
            if (prev instanceof DrawableNode)
                prev.clearAnchor();
            else {
                prev.sourceNode.clearAnchor();
                prev.destinationNode.clearAnchor();
            }
        }

        if (value) {
            redraw = true;
            this.hoverObject = value.d;
            value.d.isHovered = true;
            if (value.d instanceof DrawableEdge) {
                if (value.d.sourcePoint === value.pt) {
                    value.d.destinationNode.clearAnchor();
                    value.d.sourceNode.anchorPoint = value.pt;
                }
                else {
                    value.d.sourceNode.clearAnchor();
                    value.d.destinationNode.anchorPoint = value.pt;
                }
            }
            else
                value.d.anchorPoint = value.pt;
        }
        else
            this.hoverObject = null;

        if (redraw)
            this.redraw();

    }

    /**
     * updateDragNodes  
     *   Updates the collection of nodes being dragged.
     */
    private updateDragNodes(dragNode: DrawableNode, dPt: pt) {
        if (dragNode.isSelected && this.selectedItems.size > 0) {
            for (let d of this.selectedItems)
                if (d instanceof DrawableNode)
                    this.updateDragNode(d, dPt);
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
        for (let e of n.edges)
            e.update();
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

    private createDragEdge(
        d: DrawableEdge,
        n: DrawableNode,
        isSrc: boolean
    ) {
        let h = new DrawableNode(
            new HiddenNode(this.canvas.getPt(this.downEvt as point)),
            this.canvas
        );
        let src = (isSrc ? n : h);
        let dst = (isSrc ? h : n);
        d.source = src;
        d.destination = dst;
        let e = new DrawableEdge(src, dst, d, this.canvas);
        e.isDragging = true;
        this.dragObject = h;
        this.drawList.push(e);
    }

    /**
     * hitPtTest  
     *   Gets the first graph component that is hit by a pt.
     */
    private hitPtTest(pt: pt): { d: DrawableEdge | DrawableNode, pt: pt } | null {
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
        this.downEvt = null;
        this.moveEdge = null;
        this.updateHoverObject(null);
        this.updateDragObject();
    }

    private checkValidEdgeDrop(e: DrawableEdge, pt: point): boolean {
        let hit: { d: DrawableNode, pt: point } | null = null;
        let src = e.sourceNode;
        let dst = e.destinationNode;
        let like = (this.moveEdge ?
            this.moveEdge :
            undefined);
        for (let n of this.drawList.filter(v => v instanceof DrawableNode) as DrawableNode[]) {
            let d = n;
            if (n.hitPoint(pt) && this.graph.canCreateEdge(
                (src === this.dragObject ? d : src),
                (dst === this.dragObject ? d : dst),
                like
            )) {
                let posn = d.position;
                src = (src.isHidden ? n : src);
                dst = (dst.isHidden ? n : dst);
                let spt = (src === dst ?
                    { x: src.position.x, y: src.position.y - 1 } :
                    src.position);
                src.position;
                let dpt = dst.position;
                let u = { x: 0, y: 0 };
                if (dst === n)
                    u = { x: spt.x - dpt.x, y: spt.y - dpt.y };
                else
                    u = { x: dpt.x - spt.x, y: dpt.y - spt.y };
                let m = MathEx.mag(u);
                u.x /= m;
                u.y /= m;
                let shift = n.getBoundaryPt(u);
                shift.x += posn.x;
                shift.y += posn.y;
                hit = { d: n, pt: shift };
                break;
            }
        }
        this.updateHoverObject(hit);
        return hit !== null;
    }

    /**
     * dropEdge  
     *   Drops the dragged edge when the mouse is released.
     */
    private dropEdge(
        graph: DrawableGraph,
        pt: pt
    ): void {
        let e = this.drawList.pop() as DrawableEdge;
        // Move or create the edge if it was dropped on a node.
        let like = (this.moveEdge ? this.moveEdge : undefined);
        this.moveEdge = null;
        if (this.hoverObject instanceof DrawableNode) {
            let srcNode = (e.sourceNode.isHidden ? this.hoverObject : e.sourceNode);
            let dstNode = (e.destinationNode.isHidden ? this.hoverObject : e.destinationNode);
            let edge = this.addEdge(graph, srcNode, dstNode, (like ? like : undefined));
            if (like)
                this.removeEdge(graph, like);
            this.updateSelected(edge);
        }
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
        let posn = dragNode.position;
        this.updateDragNodes(
            dragNode,
            { x: pt.x - posn.x, y: pt.y - posn.y }
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
        this.selectedItems.clear();
        this.unselectedItems.clear();
        this.drawList = [];
        let g = this.graph;
        let sel = this.selectedItems;
        let unsel = this.unselectedItems;
        let dlist = this.drawList;
        let nodes = new Map<DrawableNode, DrawableNode>();
        for (const d of g.nodes) {
            let n = new DrawableNode(d, this.canvas);
            if (g.selectedItems.has(d)) {
                sel.add(n);
                n.isSelected = true;
            }
            else
                unsel.add(n);
            dlist.push(n);
            nodes.set(d, n);
        }
        for (const d of g.edges) {
            let src = nodes.get(d.source) as DrawableNode;
            let dst = nodes.get(d.destination) as DrawableNode;
            let e = new DrawableEdge(src, dst, d, this.canvas);

            if (g.selectedItems.has(d)) {
                sel.add(e);
                e.isSelected = true;
            }
            else
                unsel.add(e);
            dlist.push(e);
        }
        this.drawList = this.drawList.reverse();
        // TODO:
        // Should this event be emitted here?
        // This event occurs after the selected tab has been changed.
        // this.selectionChanged.emit(new Set<Drawable>(g.selectedItems));
    }

}


// Static functions ////////////////////////////////////////////////////////////

