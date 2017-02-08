// File: drawable-node.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import {
    GRID_SPACING,
    FONT_SIZE,
    NODE_PROPERTIES,
    NODE_THRESHOLD_IN,
    NODE_THRESHOLD_OUT,
    NODE_DRAG_SHADOW_COLOR,
    SELECTION_COLOR
} from "./defaults";

import { DrawableGraph } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import {
    GraphEditorCanvas,
    LineStyles,
    makeRect,
    point,
    rect,
    size,
    Shapes
} from "./graph-editor-canvas";
import * as MathEx from "./math";


export class DrawableNode extends DrawableElement {

    // TODO:
    // Each time a property is updated, mark this as dirty to signal a redraw.

    /**
     * position  
     *   The coordinates of the center of the node.
     */
    private _position: point;

    /**
     * shape  
     *   The shape of the node.
     */
    private _shape: Shapes;

    /**
     * borderColor  
     *   The border color of the node.  Can be any valid `CSS` color string.
     */
    private _borderColor: string;

    /**
     * borderStyle  
     *   The line style of the border. Can be `solid`, `dotted`, or `dashed`.
     */
    private _borderStyle: LineStyles;

    /**
     * borderWidth  
     *   The line width of the border. Set to 0 to draw no border; value must be
     *   non-negative.
     */
    private _borderWidth: number;

    private _size: size;

    private _innerBound: size;

    private _outerBound: size;

    private _incomingSet: Set<DrawableEdge>;

    private _outgoingSet: Set<DrawableEdge>;

    private _apt: point;

    get position() {
        let pt = this._position;
        return { get x() { return pt.x; }, get y() { return pt.y; } };
    }

    set position(value: point) {
        if (this._position.x !== value.x || this._position.y !== value.y) {
            // TODO:
            // Make sure this doesn't break the draw call.
            this._position = value;
            for (let e of this._incomingSet)
                e.update();
            for (let e of this._outgoingSet)
                e.update();
        }
    }

    get shape() {
        return this._shape;
    }

    set shape(value: Shapes) {
        if (this._shape !== value) {
            this._shape = value;
        }
    }

    get borderColor() {
        return this._borderColor;
    }

    set borderColor(value: string) {
        if (this._borderColor !== value) {
            this._borderColor = value;
        }
    }

    get borderStyle() {
        return this._borderStyle;
    }

    set borderStyle(value: LineStyles) {
        if (this._borderStyle !== value) {
            this._borderStyle = value;
        }
    }

    get borderWidth() {
        return this._borderWidth;
    }

    set borderWidth(value: number) {
        if (this._borderWidth !== value) {
            this._borderWidth = value;
        }
    }

    get isHidden() {
        return this instanceof HiddenNode;
    }

    get incomingEdges() {
        return new Set<DrawableEdge>([...this._incomingSet]);
    }

    get outgoingEdges() {
        return new Set<DrawableEdge>([...this._outgoingSet]);
    }

    get edges() {
        return new Set<DrawableEdge>([
            ...this._incomingSet,
            ...this._outgoingSet
        ]);
    }

    set anchorPoint(value: point) {
        if (this._apt !== value) {
            this._apt = value;
        }
    }

    get anchorPoint() {
        let pt = this._apt;
        return { get x() { return pt.x; }, get y() { return pt.y; } };
    }

    get isAnchorVisible() {
        return this._apt !== this._position;
    }

    constructor(graph: DrawableGraph) {
        super(graph);
    }

    clearAnchor() {
        this.anchorPoint = this._position;
    }

    addEdge(e: DrawableEdge) {
        this._incomingSet.add(e);
        this._outgoingSet.add(e);
        e.update();
    }

    removeEdge(e: DrawableEdge) {
        if (this._incomingSet.delete(e))
            e.update();
        if (this._outgoingSet.delete(e))
            e.update();
    }

    update(g: GraphEditorCanvas) {
        let size = { h: this._lines.length * 1.5 * FONT_SIZE, w: 0 };
        this._lines.forEach(v => size.w = Math.max(g.getTextWidth(v), size.w));
        let s = (GRID_SPACING > size.h + 1.5 * FONT_SIZE ?
            GRID_SPACING : size.h + 1.5 * FONT_SIZE);
        s = (s < size.w + FONT_SIZE ? size.w + FONT_SIZE : s);
        this._size.h = s;
        this._size.w = s;
        this._innerBound.h = s - 2 * NODE_THRESHOLD_IN;
        this._innerBound.w = this._innerBound.h;
        this._outerBound.h = s + 2 * NODE_THRESHOLD_OUT;
        this._outerBound.w = this._outerBound.h;
        this.updateDraw(g);
    }

    updateDraw(g: GraphEditorCanvas) {
        let pt = this._position;
        let sz = this._size;
        let bc = this._borderColor;
        let bs = this._borderStyle;
        let bw = this._borderWidth;
        let cl = this._color;
        let sc = (this.isDragging ? NODE_DRAG_SHADOW_COLOR : (this.isHovered ? SELECTION_COLOR : undefined));
        /////////////////////////
        // Set selected shadow //
        /////////////////////////
        if (this.isSelected) {
            let shadow = sc;
            this._drawSelectionShadow = () => {
                switch (this._shape) {
                    case "circle":
                        g.drawCircle(pt, (sz.w + bw) / 2 + 2, "solid", bw, SELECTION_COLOR, SELECTION_COLOR, shadow);
                        break;
                    case "square":
                        g.drawSquare(pt, sz.w + bw + 4, "solid", bw, SELECTION_COLOR, SELECTION_COLOR, shadow);
                        break;
                }
            };
            sc = undefined;
        }
        else {
            this._drawSelectionShadow = () => { };
        }
        //////////////
        // Set node //
        //////////////
        let shapeThunk = () => {
            switch (this._shape) {
                case "circle":
                    g.drawCircle(pt, sz.w / 2, bs, bw, bc, cl, sc);
                    break;
                case "square":
                    g.drawSquare(pt, sz.w, bs, bw, bc, cl, sc);
                    break;
            }
        }
        if (this._lines.length > 0) {
            ///////////////////////////
            // Labelled, With Anchor //
            ///////////////////////////
            if (this.isAnchorVisible) {
                this._draw = () => {
                    shapeThunk();
                    g.drawText(pt, size.h, this.textLines, "#fff", 2, "#000");
                    g.drawCircle(this._apt, 5, "solid", 1, "#000", "#fff");
                };
            }
            /////////////////////////////
            // Labeled, Without Anchor //
            /////////////////////////////
            else {
                this._draw = () => {
                    shapeThunk();
                    g.drawText(pt, this.textBox.h, this.textLines, "#fff", 2, "#000");
                };
            }
        }
        else {
            /////////////////////////////
            // Unlabelled, With Anchor //
            /////////////////////////////
            if (this.isAnchorVisible) {
                this._draw = () => {
                    shapeThunk();
                    g.drawCircle(this._apt, 5, "solid", 1, "#000", "#fff");
                };
            }
            ////////////////////////////////
            // Unlabelled, Without Anchor //
            ////////////////////////////////
            else {
                this._draw = shapeThunk;
            }
        }
    }

    hitPoint(pt: point): point | null {
        let posn = this._position;
        switch (this._shape) {
            case "circle":
                let r = this._outerBound.w / 2;
                let v = { x: pt.x - posn.x, y: pt.y - posn.y };
                let d = MathEx.mag(v);
                if (d <= r) {
                    r = this._innerBound.w / 2;
                    let anchor: point = posn;
                    if (d >= r) {
                        let shift = this.getBoundaryPt({ x: v.x / d, y: v.y / d });
                        anchor = { x: posn.x + shift.x, y: posn.y + shift.y };
                    }
                    return anchor;
                }

            case "square":
                let hs = this._outerBound.w / 2;
                let rect = makeRect(
                    { x: posn.x - hs, y: posn.y - hs },
                    { x: posn.x + hs, y: posn.y + hs }
                );
                if ((pt.x >= rect.x && pt.x <= rect.x + rect.w) &&
                    (pt.y >= rect.y && pt.y <= rect.y + rect.w)) {
                    let v = { x: pt.x - posn.x, y: pt.y - posn.y };
                    let d = MathEx.mag(v);
                    hs = this._innerBound.w / 2;
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
        let posn = this._position;
        let D = this._size.w / 2;
        return (posn.x >= L - D && posn.x <= R + D &&
            posn.y >= T - D && posn.y <= B + D);
    }

    /**
     * Gets the vector in the direction of `u` that is on the boundary of a
     * node based on its geometry.
     */
    getBoundaryPt(u: point) {
        let v: point = { x: 0, y: 0 };
        let border = this._borderWidth / 2;

        switch (this._shape) {
            // The boundary of a circle is just its radius plus half its border width.
            case "circle":
                let r = this._size.h / 2;
                v.x = u.x * r + border;
                v.y = u.y * r + border;
                break;

            // The boundary of a square depends on the direction of u.
            case "square":
                let up = {
                    x: (u.x < 0 ? -u.x : u.x),
                    y: (u.y < 0 ? -u.y : u.y)
                };
                let s = this._size.h / 2;
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

    protected init() {
        this._position = {
            x: NODE_PROPERTIES.position.x,
            y: NODE_PROPERTIES.position.y
        };
        this._shape = NODE_PROPERTIES.shape as Shapes;
        this._color = NODE_PROPERTIES.color;
        this.label = NODE_PROPERTIES.label;
        this._borderColor = NODE_PROPERTIES.borderColor;
        this._borderStyle = NODE_PROPERTIES.borderStyle as LineStyles;
        this._borderWidth = NODE_PROPERTIES.borderWidth;
        this._size = { h: 0, w: 0 };
        this._innerBound = { h: 0, w: 0 };
        this._outerBound = { h: 0, w: 0 };
        this._incomingSet = new Set<DrawableEdge>();
        this._outgoingSet = new Set<DrawableEdge>();
        this._apt = this._position;
    }

}


/**
 * HiddenNode  
 *   Creates an invisible drawable node.
 */
export class HiddenNode extends DrawableNode {
    constructor(g: GraphEditorCanvas, graph: DrawableGraph) {
        super(g, graph);
    }

    update() { }

    updateDraw() {
        this.draw = () => { };
    }
}
