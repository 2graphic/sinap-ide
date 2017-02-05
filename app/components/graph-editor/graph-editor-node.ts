// File: graph-editor-node.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import {
    GRID_SPACING,
    FONT_SIZE,
    NODE_THRESHOLD_IN,
    NODE_THRESHOLD_OUT,
    NODE_DRAG_SHADOW_COLOR,
    SELECTION_COLOR
} from "./defaults";

import { GraphEditorElement } from "./graph-editor-element";
import { DrawableNode, HiddenNode } from "./drawable-interfaces";
import { GraphEditorEdge } from "./graph-editor-edge";
import { makeRect, point, rect, size, GraphEditorCanvas } from "./canvas";
import * as MathEx from "./math";


export class GraphEditorNode extends GraphEditorElement<DrawableNode> {

    private size: size;

    private innerBound: size;

    private outerBound: size;

    private incomingSet: Set<GraphEditorEdge>;

    private outgoingSet: Set<GraphEditorEdge>;

    private apt: point;

    get isHidden() {
        return this.d instanceof HiddenNode;
    }

    get incomingEdges() {
        return this.incomingSet;
    }

    get outgoingEdges() {
        return this.outgoingSet;
    }

    get edges() {
        return new Set<GraphEditorEdge>([...this.incomingSet, ...this.outgoingSet]);
    }

    set anchorPoint(value: point) {
        if (this.apt !== value) {
            this.apt = value;
            this.updateDraw();
        }
    }

    get anchorPoint() {
        return this.apt;
    }

    get isAnchorVisible() {
        return this.apt !== this.d.position;
    }

    constructor(d: DrawableNode, g: GraphEditorCanvas) {
        super(d, g);
        this.size = { h: 0, w: 0 };
        this.innerBound = { h: 0, w: 0 };
        this.outerBound = { h: 0, w: 0 };
        this.incomingSet = new Set<GraphEditorEdge>();
        this.outgoingSet = new Set<GraphEditorEdge>();
        this.apt = this.d.position;
        this.update();
    }

    clearAnchor() {
        this.anchorPoint = this.d.position;
    }

    removeEdge(e: GraphEditorEdge) {
        if (this.incomingSet.delete(e))
            e.update();
        if (this.outgoingSet.delete(e))
            e.update();
    }

    protected updateGeometry() {
        let s = (GRID_SPACING > this.textBox.h + 1.5 * FONT_SIZE ?
            GRID_SPACING : this.textBox.h + 1.5 * FONT_SIZE);
        s = (s < this.textBox.w + FONT_SIZE ? this.textBox.w + FONT_SIZE : s);
        this.size.h = s;
        this.size.w = s;
        this.innerBound.h = s - 2 * NODE_THRESHOLD_IN;
        this.innerBound.w = this.innerBound.h;
        this.outerBound.h = s + 2 * NODE_THRESHOLD_OUT;
        this.outerBound.w = this.outerBound.h;
        this.updateDraw();
    }

    protected updateDraw() {
        let d = this.d;
        let pt = d.position;
        let sz = this.size;
        let bc = d.borderColor;
        let bs = d.borderStyle;
        let bw = d.borderWidth;
        let cl = d.color;
        let sc = (this.isDragging ? NODE_DRAG_SHADOW_COLOR : (this.isHovered ? SELECTION_COLOR : undefined));
        /////////////////////////
        // Set selected shadow //
        /////////////////////////
        if (this.isSelected) {
            let shadow = sc;
            this.drawSelectionShadow = () => {
                switch (d.shape) {
                    case "circle":
                        this.g.drawCircle(pt, (sz.w + bw) / 2 + 2, "solid", bw, SELECTION_COLOR, SELECTION_COLOR, shadow);
                        break;
                    case "square":
                        this.g.drawSquare(pt, sz.w + bw + 4, "solid", bw, SELECTION_COLOR, SELECTION_COLOR, shadow);
                        break;
                }
            };
            sc = undefined;
        }
        else {
            this.drawSelectionShadow = () => { };
        }
        //////////////
        // Set node //
        //////////////
        let shapeThunk = () => {
            switch (d.shape) {
                case "circle":
                    this.g.drawCircle(pt, sz.w / 2, bs, bw, bc, cl, sc);
                    break;
                case "square":
                    this.g.drawSquare(pt, sz.w, bs, bw, bc, cl, sc);
                    break;
            }
        }
        if (this.textLines.length > 0) {
            ///////////////////////////
            // Labelled, With Anchor //
            ///////////////////////////
            if (this.isAnchorVisible) {
                this.draw = () => {
                    shapeThunk();
                    this.g.drawText(pt, this.textBox.h, this.textLines, "#fff", 2, "#000");
                    this.g.drawCircle(this.apt, 5, "solid", 1, "#000", "#fff");
                };
            }
            /////////////////////////////
            // Labeled, Without Anchor //
            /////////////////////////////
            else {
                this.draw = () => {
                    shapeThunk();
                    this.g.drawText(pt, this.textBox.h, this.textLines, "#fff", 2, "#000");
                };
            }
        }
        else {
            /////////////////////////////
            // Unlabelled, With Anchor //
            /////////////////////////////
            if (this.isAnchorVisible) {
                this.draw = () => {
                    shapeThunk();
                    this.g.drawCircle(this.apt, 5, "solid", 1, "#000", "#fff");
                };
            }
            ////////////////////////////////
            // Unlabelled, Without Anchor //
            ////////////////////////////////
            else {
                this.draw = shapeThunk;
            }
        }
    }

    hitPoint(pt: point): point | null {
        let posn = this.d.position;
        switch (this.d.shape) {
            case "circle":
                let r = this.outerBound.w / 2;
                let v = { x: pt.x - posn.x, y: pt.y - posn.y };
                let d = MathEx.mag(v);
                if (d <= r) {
                    r = this.innerBound.w / 2;
                    let anchor: point = posn;
                    if (d >= r) {
                        let shift = this.getBoundaryPt({ x: v.x / d, y: v.y / d });
                        anchor = { x: posn.x + shift.x, y: posn.y + shift.y };
                    }
                    return anchor;
                }

            case "square":
                let hs = this.outerBound.w / 2;
                let rect = makeRect(
                    { x: posn.x - hs, y: posn.y - hs },
                    { x: posn.x + hs, y: posn.y + hs }
                );
                if ((pt.x >= rect.x && pt.x <= rect.x + rect.w) &&
                    (pt.y >= rect.y && pt.y <= rect.y + rect.w)) {
                    let v = { x: pt.x - posn.x, y: pt.y - posn.y };
                    let d = MathEx.mag(v);
                    hs = this.innerBound.w / 2;
                    rect = makeRect(
                        { x: posn.x - hs, y: posn.y - hs },
                        { x: posn.x + hs, y: posn.y + hs }
                    );
                    let anchor: point = posn;
                    if ((pt.x <= rect.x || pt.x >= rect.x + rect.w) ||
                        (pt.y <= rect.y || pt.y >= rect.y + rect.w)) {
                        let shift = this.getBoundaryPt({ x: v.x / d, y: v.y / d });
                        anchor = { x: posn.x + shift.x, y: posn.y + shift.y };
                    }
                    return anchor;
                }
        }
        return null;
    }

    hitRect(r: rect): boolean {
        const L = r.x;
        const R = r.x + r.w;
        const T = r.y;
        const B = r.y + r.h;
        let posn = this.d.position;
        let D = this.size.w / 2;
        return (posn.x >= L - D && posn.x <= R + D &&
            posn.y >= T - D && posn.y <= B + D);
    }

    /**
     * Gets the vector in the direction of `u` that is on the boundary of a
     * node based on its geometry.
     */
    getBoundaryPt(u: point) {
        let v: point = { x: 0, y: 0 };
        let border = this.d.borderWidth / 2;

        switch (this.d.shape) {
            // The boundary of a circle is just its radius plus half its border width.
            case "circle":
                let r = this.size.h / 2;
                v.x = u.x * r + border;
                v.y = u.y * r + border;
                break;

            // The boundary of a square depends on the direction of u.
            case "square":
                let up = {
                    x: (u.x < 0 ? -u.x : u.x),
                    y: (u.y < 0 ? -u.y : u.y)
                };
                let s = this.size.h / 2;
                if (up.x < up.y) {
                    let ratio = up.x / up.y;
                    let b = s / up.y;
                    let a = ratio * up.x;
                    s = MathEx.mag({ x: a, y: b });
                }
                else {
                    let ratio = up.y / up.x;
                    let a = s / up.x;
                    let b = ratio * up.y;
                    s = MathEx.mag({ x: a, y: b });
                }
                v.x = u.x * s + border;
                v.y = u.y * s + border;
                break;
        }
        return v;
    }

}