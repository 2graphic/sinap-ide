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
    GraphEditorCanvas,
    makeRect,
    point
} from "./graph-editor-canvas";
import { DrawableEventArgs, DrawableGraph, EdgeValidator } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode, HiddenNode } from "./drawable-node";
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


    constructor(private el: ElementRef) { }


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

    private redrawDelegate: () => void
    = () => { };


    // Public Fields ///////////////////////////////////////////////////////////


    /**
     * setGraph  
     *   Input property for the graph context.
     */
    @Input("graph")
    set setGraph(value: DrawableGraph | null) {
        if (this.oldGraph)
            this.unregisterGraph(this.oldGraph);

        if (value) {
            this.oldGraph = this.graph;
            this.suspendRedraw();
            this.registerGraph(value);
            this.addEventListeners(this.el.nativeElement);
            this.resumeRedraw();
        }
        else {
            this.oldGraph = null;
            this.removeEventListeners(this.el.nativeElement);
            this.suspendRedraw();
            this.panPt = null;
            this.downEvt = null;
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

    suspendRedraw() {
        this.redrawDelegate = () => { };
    }

    resumeRedraw() {
        if (this.canvas) {
            this.redrawDelegate = () => {
                this.canvas.clear("#fff");
                this.canvas.drawGrid();
                for (const d of this.graph.selectedItems)
                    d.drawSelectionShadow();
                for (const d of this.drawList)
                    d.draw();
            };
            this.redrawDelegate();
        }
    }

    private registerGraph(g: DrawableGraph) {
        this.graph = g;
        this.scale = g.scale;
        this.origin = g.origin;
        g.addCreatedEdgeListener(this.onCreatedEdge);
        g.addCreatedNodeListener(this.onCreatedNode);
        g.addDeletedEdgeListener(this.onDeletedEdge);
        g.addDeletedNodeListener(this.onDeletedNode);
        g.addPropertyChangedListener(this.onDrawablePropertyChanged);
        this.drawList = [];
        for (const d of [...g.edges, ...g.nodes])
            this.registerDrawable(d);
    }

    private unregisterGraph(g: DrawableGraph) {
        g.removeCreatedEdgeListener(this.onCreatedEdge);
        g.removeCreatedNodeListener(this.onCreatedNode);
        g.removeDeletedEdgeListener(this.onDeletedEdge);
        g.removeDeletedNodeListener(this.onDeletedNode);
        g.removePropertyChangedListener(this.onDrawablePropertyChanged);
        for (const d of [...g.edges, ...g.nodes])
            this.unregisterDrawable(d);
    }

    private registerDrawable(d: DrawableElement) {
        this.drawList.push(d);
        d.update(this.canvas);
        d.addPropertyChangedEventListener(this.onDrawablePropertyChanged);
        this.redraw();
    }

    private unregisterDrawable(d: DrawableElement) {
        this.drawList = this.drawList.filter(v => v !== d);
        d.removePropertyChangedEventListener(this.onDrawablePropertyChanged);
        this.redraw();
    }

    private onCreatedEdge(evt: DrawableEventArgs<DrawableEdge>) {
        this.registerDrawable(evt.drawable);
    }

    private onCreatedNode(evt: DrawableEventArgs<DrawableNode>) {
        this.registerDrawable(evt.drawable);
    }

    private onDeletedEdge(evt: DrawableEventArgs<DrawableEdge>) {
        this.unregisterDrawable(evt.drawable);
    }

    private onDeletedNode(evt: DrawableEventArgs<DrawableNode>) {
        this.unregisterDrawable(evt.drawable);
    }

    private onDrawablePropertyChanged(evt: PropertyChangedEventArgs<any>) {
        if (evt.source instanceof DrawableElement) {
            evt.source.update(this.canvas);
            this.redraw();
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

    /**
     * dragNode  
     *   Sets the node being dragged by the cursor.
     * 
     * Note:
     * The intent of this function is to be able to set the drag node from the
     * components panel.
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
    get redraw() {
        return this.redrawDelegate;
    }


    // Delegates ///////////////////////////////////////////////////////////////


    /**
     * onKeyDown  
     *   Handles the delete key.
     * 
     * TODO:
     * - Remove this from the editor.
     */
    private onKeyDown = (e: KeyboardEvent): void => {
        // Delete keyCode is 46; backspace is 8.
        if (e.keyCode == 46 || e.keyCode == 8) {
            this.graph.deleteSelected();
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
                this.graph.clearSelection();
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
                this.graph.clearSelection();
                let hit = this.hitPtTest(ePt);
                if (hit)
                    this.graph.selectItems(hit.d);
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
            this.suspendRedraw();
            let downPt = this.canvas.getPt(this.downEvt);
            clearTimeout(this.stickyTimeout as NodeJS.Timer);
            this.stickyTimeout = null;

            // Create a new node and set it as the drag object.
            this.dragObject = this.graph.createNode();
            if (this.dragObject) {
                this.graph.clearSelection();
                this.dragObject.position = downPt;
            }
            this.resumeRedraw();
        }
    }


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


    // Update Methods //////////////////////////////////////////////////////////


    /**
     * updateSelectionBox  
     *   Updates the selection box.
     */
    private updateSelectionBox(downPt: pt, ePt: pt): void {
        let rect = makeRect(downPt, ePt);

        // Update the selected components.
        let deselect = [];
        let select = []
        for (const i of [...this.graph.edges, ...this.graph.nodes]) {
            if (i.hitRect(rect))
                select.push(i);
            else
                deselect.push(i);
        }
        this.graph.selectItems(...select);
        this.graph.deselectItems(...deselect);

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
        if (this.graph.selectedItemCount < 2) {
            this.graph.clearSelection();
            this.graph.selectItems(dragObject);
        }
    }

    private updateDragObject() {
        let prev = this.dragObject;
        if (this.hoverObject instanceof DrawableNode) {
            // Create a new edge if an anchor pt is being displayed on the node.
            if (this.hoverObject.isAnchorVisible) {
                this.createDragEdge(this.hoverObject, true);
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
                (isSrc ? this.hoverObject.sourceNode : this.hoverObject.destinationNode),
                isSrc,
                this.hoverObject
            );
            this.hoverObject.isDragging = true;
            this.moveEdge = this.hoverObject;
            this.updateHoverObject(null);
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
    private updateHoverObject(value: { d: DrawableElement, pt: point } | null): void {

        let redraw = false;
        let prev = this.hoverObject;
        if (prev) {
            redraw = true;
            prev.isHovered = false;
            if (prev instanceof DrawableNode)
                prev.clearAnchor();
            else if (prev instanceof DrawableEdge) {
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
            else if (value.d instanceof DrawableNode) {
                if (this.graph.isValidEdge(value.d))
                    value.d.anchorPoint = value.pt;
                else
                    value.d.clearAnchor();
            }
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
        if (dragNode.isSelected && this.graph.selectedItemCount > 0) {
            for (let d of this.graph.selectedItems)
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
        n.position = { x: n.position.x + dPt.x, y: n.position.y + dPt.y };
        for (let e of n.edges)
            e.update(this.canvas);
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
        n: DrawableNode,
        isSrc: boolean,
        like?: DrawableEdge
    ) {
        let h = new HiddenNode(this.graph);
        h.position = this.canvas.getPt(this.downEvt as point);
        let src = (isSrc ? n : h);
        let dst = (isSrc ? h : n);
        let d = new DrawableEdge(this.graph, src, dst, like);
        d.isDragging = true;
        this.dragObject = h;
        this.drawList.push(d);
    }

    /**
     * hitPtTest  
     *   Gets the first graph component that is hit by a pt.
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
            if (n.hitPoint(pt) && this.graph.isValidEdge(
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
            this.suspendRedraw();
            let srcNode = (e.sourceNode.isHidden ? this.hoverObject : e.sourceNode);
            let dstNode = (e.destinationNode.isHidden ? this.hoverObject : e.destinationNode);
            let edge = this.graph.createEdge(srcNode, dstNode, like);
            if (edge)
                this.updateSelected(edge);
            this.resumeRedraw();
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

}
