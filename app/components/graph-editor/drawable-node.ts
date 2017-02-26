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
    IMAGES,
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
    constructor(graph: DrawableGraph, like?: DrawableNode) {
        super(graph);
        Object.defineProperties(this, {
            _pt: {
                enumerable: false,
                writable: true,
                value: {
                    x: (like ? like._pt.x + GRID_SPACING : NODE_PROPERTIES.position.x),
                    y: (like ? like._pt.y + GRID_SPACING : NODE_PROPERTIES.position.y),
                }
            },
            _shape: {
                enumerable: false,
                writable: true,
                value: (like ? like._shape : NODE_PROPERTIES.shape as Shapes)
            },
            _img: {
                enumerable: false,
                writable: true,
                value: (like ? like._img : NODE_PROPERTIES.image)
            },
            _apts: {
                enumerable: false,
                writable: true,
                value: (like ? like._apts : NODE_PROPERTIES.anchorPoints)
            },
            _borderColor: {
                enumerable: false,
                writable: true,
                value: (like ? like._borderColor : NODE_PROPERTIES.borderColor)
            },
            _borderStyle: {
                enumerable: false,
                writable: true,
                value: (like ? like._borderStyle : NODE_PROPERTIES.borderStyle as LineStyles)
            },
            _borderWidth: {
                enumerable: false,
                writable: true,
                value: (like ? like._borderWidth : NODE_PROPERTIES.borderWidth)
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
                value: this._pt
            },
            position: {
                enumerable: true,
                get: () => this._pt,
                set: (value: point) => {
                    const old = this.position;
                    if (this._pt.x !== value.x || this._pt.y !== value.y) {
                        this._pt.x = value.x;
                        this._pt.y = value.y;
                        this.onPropertyChanged("position", old);
                    }
                }
            },
            shape: {
                enumerable: true,
                get: () => this._shape,
                set: (value: Shapes) => {
                    const old = this._shape;
                    if (this._shape !== value) {
                        this._shape = value;
                        this.onPropertyChanged("shape", old);
                    }
                }
            },
            image: {
                enumerable: true,
                get: () => this._img,
                set: (value: string) => {
                    const old = this._img;
                    if (this._img !== value) {
                        this._img = value;
                        this.onPropertyChanged("image", old);
                    }
                }
            },
            anchorPoints: {
                enumerable: true,
                get: () => [...this._apts],
                set: (value: point[]) => {
                    this._apts = [];
                    value.forEach(v => {
                        const pt = {
                            x: v.x - this._size.w / 2,
                            y: v.y - this._size.h / 2
                        };
                        if (this._apts.filter(a => a.x === pt.x && a.y === pt.y).length == 0)
                            this._apts.push(pt);
                    });
                }
            },
            borderColor: {
                enumerable: true,
                get: () => this._borderColor,
                set: (value: string) => {
                    const old = this._borderColor;
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
                    const old = this._borderStyle;
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
                    const old = this._borderWidth;
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
                get: () => this._apt !== this._pt
            }
        });
        Object.seal(this);
        this.color = (like ? like._color : NODE_PROPERTIES.color);
        this.label = (like ? like.label : NODE_PROPERTIES.label);
        this.clearAnchor();
    }

    // Private fields //////////////////////////////////////////////////////////

    /**
     * _pt
     *   The coordinates of the center of the node.
     */
    private _pt: point;

    /**
     * _shape  
     *   The shape of the node.
     */
    private _shape: Shapes;

    /**
     * _img  
     *   Path to the custom image.
     */
    private _img: string;

    /**
     * _apts
     * 
     *   The collection of anchor points.
     */
    private _apts: point[];

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

    // Public fields ///////////////////////////////////////////////////////////

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
     * image  
     *   Gets or sets the path to a custom SVG image.
     */
    image: string;

    /**
     * anchorPoints  
     *   Gets or sets the anchor points.
     * 
     * <p>
     *   The location of each anchor point is in relation to the (0, 0)
     *   coordinate of the image file, or the top left corner of the bounding
     *   rectangle of the selected shape.
     * </p>
     */
    anchorPoints: point[];

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
        this.anchorPoint = this._pt;
    }

    /**
     * addEdge
     * 
     *   Adds an edge to this node.
     */
    addEdge(e: DrawableEdge) {
        const old = this.edges;
        if (e.source === this)
            this._outgoingSet.add(e);
        else if (e.destination === this)
            this._incomingSet.add(e);
        this.onPropertyChanged("edges", old);
    }

    /**
     * removeEdge  
     *   Removes an edge from this node.
     */
    removeEdge(e: DrawableEdge) {
        const old = this.edges;
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
        if (this._shape === "image") {
            const img = IMAGES.get(this._img);
            this._size.h = img!.height;
            this._size.w = img!.width;
        }
        else {
            let s = (GRID_SPACING > this._textSize.h + 1.5 * FONT_SIZE ?
                GRID_SPACING : this._textSize.h + 1.5 * FONT_SIZE);
            s = (s < this._textSize.w + FONT_SIZE ?
                this._textSize.w + FONT_SIZE : s);
            this._size.h = s;
            this._size.w = s;
        }
        this._innerBound.h = this._size.h - 2 * NODE_THRESHOLD_IN;
        this._innerBound.w = this._size.w - 2 * NODE_THRESHOLD_IN;
        this._outerBound.h = this._size.h + 2 * NODE_THRESHOLD_OUT;
        this._outerBound.w = this._size.w + 2 * NODE_THRESHOLD_OUT;
        this.updateDraw(g);
        for (const e of this.edges)
            e.update(g);
    }

    /**
     * updateDraw  
     *   Updates the draw logic of the node.
     */
    updateDraw(g: GraphEditorCanvas) {
        const pt = this._pt;
        const sz = this._size;
        const bc = this._borderColor;
        const bs = this._borderStyle;
        const bw = this._borderWidth;
        const cl = this._color;
        let sc = (this.isDragging ? NODE_DRAG_SHADOW_COLOR : (this.isHovered ? SELECTION_COLOR : undefined));
        /////////////////////////
        // Set selected shadow //
        /////////////////////////
        if (this.isSelected) {
            const shadow = sc;
            const offsets = [-2, -2, 0, -2, 2, -2, -2, 0, 2, 0, -2, 2, 0, 2, 2, 2];
            this._drawSelectionShadow = () => {
                switch (this._shape) {
                    case "circle":
                        g.drawCircle(pt, (sz.w + bw) / 2 + 2, "solid", bw, SELECTION_COLOR, SELECTION_COLOR, shadow);
                        break;
                    case "square":
                        g.drawSquare(pt, sz.w + bw + 4, "solid", bw, SELECTION_COLOR, SELECTION_COLOR, shadow);
                        break;
                    case "image":
                        for (let i = 0; i < offsets.length; i += 2) {
                            const opt = { x: pt.x + offsets[i], y: pt.y + offsets[i + 1] };
                            g.drawImage(opt, IMAGES.get(this._img) !);
                        }
                        break;
                }
            };
            if (this._shape !== "image")
                sc = undefined;
        }
        else {
            this._drawSelectionShadow = () => { };
        }
        //////////////
        // Set node //
        //////////////
        const shapeThunk = () => {
            switch (this._shape) {
                case "circle":
                    g.drawCircle(pt, sz.w / 2, bs, bw, bc, cl, sc);
                    break;
                case "square":
                    g.drawSquare(pt, sz.w, bs, bw, bc, cl, sc);
                    break;
                case "image":
                    g.drawImage(pt, IMAGES.get(this._img) !, sc);
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
        const posn = { x: this._pt.x, y: this._pt.y };
        const size = this._size;
        const v = { x: pt.x - posn.x, y: pt.y - posn.y };
        const ib = this._innerBound;
        const ob = this._outerBound;
        const apts = this._apts;
        if (apts.length > 0) {
            const d = NODE_THRESHOLD_OUT - NODE_THRESHOLD_IN;
            const apt = this.getNearestAnchor(pt);
            const u = { x: v.x - apt.x, y: v.y - apt.y };
            if (MathEx.dot(u, u) <= d * d) {
                return { x: apt.x + this._pt.x, y: apt.y + this._pt.y };
            }
        }
        switch (this._shape) {
            case "circle": {
                const dot = MathEx.dot(v, v);
                if (dot < ib.w * ib.w / 4)
                    return this._pt;
                if (apts.length == 0 && dot <= ob.w * ob.w / 4) {
                    const d = Math.sqrt(dot);
                    return this.getBoundaryPt({ x: v.x / d, y: v.y / d });
                }
            } break;

            case "image":
            case "square": {
                const ax = Math.abs(v.x);
                const ay = Math.abs(v.y);
                if (ax < ib.w / 2 && ay < ib.h / 2)
                    return this._pt;
                if (apts.length == 0 && ax <= ob.w / 2 && ay <= ob.h / 2) {
                    const d = MathEx.mag(v);
                    return this.getBoundaryPt({ x: v.x / d, y: v.y / d });
                }
            } break;
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
        const posn = this._pt;
        const D = this._size.w / 2;
        return (posn.x >= L - D && posn.x <= R + D &&
            posn.y >= T - D && posn.y <= B + D);
    }

    /**
     * getNearestAnchor  
     * 
     *   Gets the nearest anchor point or the origin of the node if there are no
     *   predefined anchor points.
     */
    getNearestAnchor(pt: point) {
        const p = { x: pt.x - this._pt.x, y: pt.y - this._pt.y };
        let apt = this._pt;
        let min = Infinity;
        this._apts.forEach(a => {
            let v = {
                x: p.x - a.x,
                y: p.y - a.y
            }
            let dot = MathEx.dot(v, v);
            if (dot <= min) {
                min = dot;
                apt = a;
            }
        });
        return apt;
    }

    /**
     * getBoundaryPt  
     *   Gets the vector in the direction of `u` that is on the boundary of a
     *   node based on its geometry.
     */
    getBoundaryPt(u: point) {
        const v: point = { x: 0, y: 0 };
        const sz = this._size;
        const border = this._borderWidth / 2;

        switch (this._shape) {
            // The boundary of a circle is just its radius plus half its border
            // width.
            case "circle": {
                const r = sz.h / 2 + border;
                v.x = u.x * r;
                v.y = u.y * r;
            } break;

            // The boundary of a rectangle depends on the direction of u.
            case "image":
            case "square": {
                const up = {
                    x: (u.x < 0 ? -u.x : u.x),
                    y: (u.y < 0 ? -u.y : u.y)
                };
                const h = sz.h / 2 + border;
                const w = sz.w / 2 + border;
                v.x = (h * up.x + up.x * up.y) / up.y;
                if (v.x > w) {
                    v.x = w;
                    v.y = (w * up.y + up.y * up.x) / up.x;
                }
                else
                    v.y = h;
                const d = MathEx.mag(v);
                v.x = u.x * d;
                v.y = u.y * d;
            } break;
        }
        v.x += this._pt.x;
        v.y += this._pt.y;
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

    getBoundaryPt(u: point) {
        return this.position;
    }
}
