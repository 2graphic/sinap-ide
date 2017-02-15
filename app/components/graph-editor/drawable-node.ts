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


/**
 * DrawableNode  
 *   Represents a node that is drawn on a graph editor canvas.
 */
export class DrawableNode extends DrawableElement {

    /**
     * _position  
     *   The coordinates of the center of the node.
     */
    private _position: point;

    /**
     * _shape  
     *   The shape of the node.
     */
    private _shape: Shapes;

    /**
     * _borderColor  
     *   The border color of the node.  Can be any valid `CSS` color string.
     */
    private _borderColor: string;

    /**
     * _borderStyle  
     *   The line style of the border. Can be `solid`, `dotted`, or `dashed`.
     */
    private _borderStyle: LineStyles;

    /**
     * _borderWidth  
     *   The line width of the border. Set to 0 to draw no border; value must be
     *   non-negative.
     */
    private _borderWidth: number;

    /**
     * _size  
     *   The dimensions of the node.
     */
    private _size: size;

    /**
     * _innerBound  
     *   The inner dimensions of the node for hit detecting the edge creation
     *   region.
     */
    private _innerBound: size;

    /**
     * _outerBound  
     *   The outer dimensions of the noed for hit detecting the edge creation
     *   region.
     */
    private _outerBound: size;

    /**
     * _incomingSet  
     *   The set of incoming edges.
     */
    private _incomingSet: Set<DrawableEdge>;

    /**
     * _outgoingSet  
     *   The set of outgoing edges.
     */
    private _outgoingSet: Set<DrawableEdge>;

    /**
     * _apt  
     *   The anchor point.
     */
    private _apt: point;

    /**
     * constructor
     */
    constructor(graph: DrawableGraph) {
        super(graph);
        Object.defineProperties(this, {
            _position: {
                enumerable: false,
                writable: true,
                value: {
                    x: NODE_PROPERTIES.position.x,
                    y: NODE_PROPERTIES.position.y
                }
            },
            _shape: {
                enumerable: false,
                writable: true,
                value: NODE_PROPERTIES.shape as Shapes
            },
            _borderColor: {
                enumerable: false,
                writable: true,
                value: NODE_PROPERTIES.borderColor
            },
            _borderStyle: {
                enumerable: false,
                writable: true,
                value: NODE_PROPERTIES.borderStyle as LineStyles
            },
            _borderWidth: {
                enumerable: false,
                writable: true,
                value: NODE_PROPERTIES.borderWidth
            },
            _size: {
                enumerable: false,
                writable: true,
                value: { h: 0, w: 0 }
            },
            _innerBound: {
                enumerable: false,
                writable: true,
                value: { h: 0, w: 0 }
            },
            _outerBound: {
                enumerable: false,
                writable: true,
                value: { h: 0, w: 0 }
            },
            _incomingSet: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableEdge>()
            },
            _outgoingSet: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableEdge>()
            },
            _apt: {
                enumerable: false,
                writable: true,
                value: this._position
            },
            position: {
                enumerable: true,
                get: () => this._position,
                set: (value: point) => {
                    let old = this.position;
                    if (this._position.x !== value.x || this._position.y !== value.y) {
                        this._position.x = value.x;
                        this._position.y = value.y;
                        this.onPropertyChanged("position", old);
                    }
                }
            },
            shape: {
                enumerable: true,
                get: () => this._shape,
                set: (value: Shapes) => {
                    let old = this._shape;
                    if (this._shape !== value) {
                        this._shape = value;
                        this.onPropertyChanged("shape", old);
                    }
                }
            },
            borderColor: {
                enumerable: true,
                get: () => this._borderColor,
                set: (value: string) => {
                    let old = this._borderColor;
                    if (this._borderColor !== value) {
                        this._borderColor = value;
                        this.onPropertyChanged("borderColor", old);
                    }
                }
            },
            borderStyle: {
                enumerable: true,
                get: () => this._borderStyle,
                set: (value: LineStyles) => {
                    let old = this._borderStyle;
                    if (this._borderStyle !== value) {
                        this._borderStyle = value;
                        this.onPropertyChanged("borderStyle", old);
                    }
                }
            },
            borderWidth: {
                enumerable: true,
                get: () => this._borderWidth,
                set: (value: number) => {
                    let old = this._borderWidth;
                    if (this._borderWidth !== value) {
                        this._borderWidth = value;
                        this.onPropertyChanged("borderWidth", old);
                    }
                }
            },
            isHidden: {
                enumerable: false,
                get: () => this instanceof HiddenNode
            },
            incomingEdges: {
                enumerable: false,
                get: () => new Set<DrawableEdge>([...this._incomingSet])
            },
            outgoingEdges: {
                enumerable: false,
                get: () => new Set<DrawableEdge>([...this._outgoingSet])
            },
            edges: {
                enumerable: false,
                get: () => new Set<DrawableEdge>([
                    ...this._incomingSet,
                    ...this._outgoingSet
                ])
            },
            anchorPoint: {
                enumerable: false,
                get: () => this._apt,
                set: (value: point) => this._apt = value
            },
            isAnchorVisible: {
                enumerable: false,
                get: () => this._apt !== this._position
            }
        });
        Object.seal(this);
        this.color = NODE_PROPERTIES.color;
        this.label = NODE_PROPERTIES.label;
        this.clearAnchor();
    }

    /**
     * position  
     *   Gets or sets the position of the node.
     */
    position: point;

    /**
     * shape  
     *   Gets or sets the shape of the node.
     */
    shape: Shapes;

    /**
     * borderColor  
     *   Gets or sets the color of the node border.
     */
    borderColor: string;

    /**
     * borderStyle  
     *   Gets or sets the line style of the border.
     */
    borderStyle: LineStyles;

    /**
     * borderWidth  
     *   Gets or sets the line width of the border.
     */
    borderWidth: number;

    /**
     * isHidden  
     *   Gets whether or not this node is hidden.
     */
    readonly isHidden: boolean;

    /**
     * incomingEdges  
     *   Gets a set of the incoming edges.
     */
    readonly incomingEdges: Set<DrawableEdge>;

    /**
     * outgoingEdges  
     *   Gets a set of the outgoing edges.
     */
    readonly outgoingEdges: Set<DrawableEdge>;

    /**
     * edges  
     *   Gets a set of the incoming and outgoing edges.
     */
    readonly edges: Set<DrawableEdge>;

    /**
     * anchorPoint  
     *   Gets or sets the visible anchor point.
     */
    anchorPoint: point;

    /**
     * isAnchorVisible  
     *   Gets whether or not the anchor point should be visible.
     */
    readonly isAnchorVisible: boolean;

    /**
     * clearAnchor  
     *   Clears the anchor visibility.
     */
    clearAnchor() {
        this.anchorPoint = this._position;
    }

    /**
     * addEdge  
     *   Adds an edge to this node.
     */
    addEdge(e: DrawableEdge) {
        let old = this.edges;
        if (e.sourceNode === this)
            this._outgoingSet.add(e);
        else if (e.destinationNode === this)
            this._incomingSet.add(e);
        this.onPropertyChanged("edges", old);
    }

    /**
     * removeEdge  
     *   Removes an edge from this node.
     */
    removeEdge(e: DrawableEdge) {
        let old = this.edges;
        this._incomingSet.delete(e);
        this._outgoingSet.delete(e);
        this.onPropertyChanged("edges", old);
    }

    /**
     * update  
     *   Updates the node geometry and draw logic.
     */
    update(g: GraphEditorCanvas) {
        this.updateTextSize(g);
        let s = (GRID_SPACING > this._textSize.h + 1.5 * FONT_SIZE ?
            GRID_SPACING : this._textSize.h + 1.5 * FONT_SIZE);
        s = (s < this._textSize.w + FONT_SIZE ?
            this._textSize.w + FONT_SIZE : s);
        this._size.h = s;
        this._size.w = s;
        this._innerBound.h = s - 2 * NODE_THRESHOLD_IN;
        this._innerBound.w = this._innerBound.h;
        this._outerBound.h = s + 2 * NODE_THRESHOLD_OUT;
        this._outerBound.w = this._outerBound.h;
        this.updateDraw(g);
    }

    /**
     * updateDraw  
     *   Updates the draw logic of the node.
     */
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
                    g.drawText(pt, this._textSize.h, this._lines, "#fff", 2, "#000");
                    g.drawCircle(this._apt, 5, "solid", 1, "#000", "#fff");
                };
            }
            /////////////////////////////
            // Labeled, Without Anchor //
            /////////////////////////////
            else {
                this._draw = () => {
                    shapeThunk();
                    g.drawText(pt, this._textSize.h, this._lines, "#fff", 2, "#000");
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

    /**
     * hitPoint  
     *   Tests whether or not a point is within the hit threshold of the node.
     * 
     * @returns
     *   An anchor point if the given point is within the threshold of the node;
     *   otherwise, null.
     */
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
                    if (d >= r)
                        anchor = this.getBoundaryPt({ x: v.x / d, y: v.y / d });
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
                        anchor = this.getBoundaryPt({ x: v.x / d, y: v.y / d });
                    }
                    return anchor;
                }
        }
        return null;
    }

    /**
     * hitRect  
     *   Tests whether or not the node is captured by a rectangle.
     */
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
     * getBoundaryPt  
     *   Gets the vector in the direction of `u` that is on the boundary of a
     *   node based on its geometry.
     */
    getBoundaryPt(u: point) {
        let v: point = { x: 0, y: 0 };
        let border = this._borderWidth / 2;

        switch (this._shape) {
            // The boundary of a circle is just its radius plus half its border
            // width.
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
        v.x += this._position.x;
        v.y += this._position.y;
        return v;
    }

}


/**
 * HiddenNode  
 *   Creates an invisible drawable node.
 */
export class HiddenNode extends DrawableNode {

    constructor(graph: DrawableGraph) {
        super(graph);
    }

    update(g: GraphEditorCanvas) { }

    updateDraw(g: GraphEditorCanvas) {
        this._draw = () => { };
    }
}
