// File: drawable-edge.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import {
    EDGE_PROPERTIES,
    EDGE_HIT_MARGIN,
    GRID_SPACING,
    SELECTION_COLOR
} from "./defaults";

import { DrawableGraph } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableNode } from "./drawable-node";
import {
    GraphEditorCanvas,
    LineStyles,
    makeRect,
    point,
    rect,
    size
} from "./graph-editor-canvas";
import * as MathEx from "./math";


/**
 * DrawableEdge  
 *   Represents an edge that is drawn on the graph editor canvas.
 */
export class DrawableEdge extends DrawableElement {

    /**
     * _srcArrow  
     *   Keeps track of whether or not the source arrow is displayed.
     */
    private _srcArrow: boolean;

    /**
     * _dstArrow  
     *   Keeps track of whether or not the destination arrow is displayed.
     */
    private _dstArrow: boolean;

    /**
     * _lineStyle  
     *   Keeps track of the line style of the edge.
     */
    private _lineStyle: LineStyles;

    /**
     * _lineWidth  
     *   Keeps track of the line width of the edge.
     */
    private _lineWidth: number;

    /**
     * _pts  
     *   Keeps track of points-of-interest related to the edge.
     * 
     * <p>
     *   The first two points represent the boundary points along the source and
     *   destination nodes respectively. The third point is the midpoint along
     *   the edge line. For cubic lines, the fourth and fifth points are more
     *   points along the line. The remaining points are control points for
     *   either quadratic or cubic Bezier curves.
     * </p>
     */
    private _pts: point[];

    /**
     * constructor  
     */
    constructor(
        graph: DrawableGraph,
        private readonly src: DrawableNode,
        private readonly dst: DrawableNode,
        like?: DrawableEdge
    ) {
        super(graph);
        Object.defineProperties(this, {
            src: {
                enumerable: false,
                writable: false
            },
            dst: {
                enumerable: false,
                writable: false
            },
            _srcArrow: {
                enumerable: false,
                writable: true,
                value: (like ? like._srcArrow : EDGE_PROPERTIES.showSourceArrow)
            },
            _dstArrow: {
                enumerable: false,
                writable: true,
                value: (like ? like._dstArrow : EDGE_PROPERTIES.showDestinationArrow)
            },
            _lineStyle: {
                enumerable: false,
                writable: true,
                value: (like ? like._lineStyle : EDGE_PROPERTIES.lineStyle)
            },
            _lineWidth: {
                enumerable: false,
                writable: true,
                value: (like ? like._lineWidth : EDGE_PROPERTIES.lineWidth)
            },
            _pts: {
                enumerable: false,
                writable: true,
                value: [] as point[]
            },
            source: {
                enumerable: true,
                get: () => this.src
            },
            destination: {
                enumerable: true,
                get: () => this.dst
            },
            sourcePoint: {
                enumerable: false,
                get: () => this._pts[0]
            },
            destinationPoint: {
                enumerable: false,
                get: () => this._pts[1]
            },
            showSourceArrow: {
                enumerable: true,
                get: () => this._srcArrow,
                set: (value: boolean) => {
                    let old = this._srcArrow;
                    if (this._srcArrow !== value) {
                        this._srcArrow = value;
                        this.onPropertyChanged("showSourceArrow", old);
                    }
                }
            },
            showDestinationArrow: {
                enumerable: true,
                get: () => this._dstArrow,
                set: (value: boolean) => {
                    let old = this._dstArrow;
                    if (this._dstArrow !== value) {
                        this._dstArrow = value;
                        this.onPropertyChanged("showDestinationArrow", old);
                    }
                }
            },
            lineStyle: {
                enumerable: true,
                get: () => this._lineStyle,
                set: (value: LineStyles) => {
                    let old = this._lineStyle;
                    if (this._lineStyle !== value) {
                        this._lineStyle = value;
                        this.onPropertyChanged("lineStyle", old);
                    }
                }
            },
            lineWidth: {
                enumerable: true,
                get: () => this._lineWidth,
                set: (value: number) => {
                    let old = this._lineWidth;
                    if (this._lineWidth !== value) {
                        this._lineWidth = value;
                        this.onPropertyChanged("lineWidth", old);
                    }
                }
            }
        });
        Object.seal(this);
        this.color = (like ? like._color : EDGE_PROPERTIES.color);
        this.label = (like ? like.label : EDGE_PROPERTIES.label);
        this.src.addEdge(this);
        this.dst.addEdge(this);
    }

    /**
     * source  
     *   Gets the reference to the drawable source node of the edge.
     */
    readonly source: DrawableNode;

    /**
     * destination  
     *   Gets the reference to the drawable destination node of the edge.
     */
    readonly destination: DrawableNode;

    /**
     * sourcePoint  
     *   Gets the point of the edge along the boundary of its source node.
     */
    readonly sourcePoint: point;

    /**
     * destinationPoint  
     *   Gets the point of the edge along the boundary of its destination node.
     */
    readonly destinationPoint: point;

    /**
     * showSourceArrow  
     *   Gets or sets whether or not an arrow should be displayed towards the
     *   source node.
     */
    showSourceArrow: boolean;

    /**
     * showDestinationArrow  
     *   Gets or sets whether or not an arrow should be displayed towards the
     *   destination node.
     */
    showDestinationArrow: boolean;

    /**
     * lineStyle  
     *   Gets or sets the line style of the edge.
     */
    lineStyle: LineStyles;

    /**
     * lineWidth  
     *   Gets or sets the width of the line of the edge.
     */
    lineWidth: number;

    /**
     * points  
     *   Updates the points-of-interest related to the edge.
     */
    private set points(value: point[]) {
        if (this._pts.length == value.length) {
            for (let i = 0; i < value.length; i++)
                this._pts[i] = value[i];
        }
        else
            this._pts = value;
    }

    /**
     * update  
     *   Updates the geometry and draw logic of the edge.
     */
    update(g: GraphEditorCanvas): void {
        console.assert(
            !this.src.isHidden || !this.dst.isHidden,
            "error GraphEditorEdge.updatePoints: drawable edge must " +
            "have either a source or a destination"
        );
        this.updateTextSize(g);
        // TODO:
        // Something about anchor pts for custom node images.
        if (this.src === this.dst) {
            this.setLoopPoints();
        }
        else
            this.updateOverlappedEdges(g);
        this.updateDraw(g);
    }

    /**
     * updateDraw  
     *   Updates the draw logic of the edge.
     */
    updateDraw(g: GraphEditorCanvas) {
        let hovered = this.isHovered;
        /////////////////////////
        // Set selected shadow //
        /////////////////////////
        if (this.isSelected) {
            let preDrawThunk = this.makePreDrawEdge(
                g,
                SELECTION_COLOR,
                this._lineWidth + 4,
                "solid",
                false,
                this.isHovered
            );
            let traceThunk = this.makeTraceEdge(g);
            let drawLabelThunk = () => { };
            if (this._lines.length > 0) {
                let size = {
                    h: this._textSize.h + 4,
                    w: this._textSize.w + 4
                }
                drawLabelThunk = () => {
                    g.lineWidth = this._lineWidth;
                    g.fillStyle = SELECTION_COLOR;
                    this.drawLabelRect(g, size);
                };
            }
            this._drawSelectionShadow = () => {
                preDrawThunk();
                g.beginPath();
                traceThunk();
                g.stroke();
                drawLabelThunk();
                g.shadowBlur = 0;
                g.globalAlpha = 1;
            }
            hovered = false;
        }
        else {
            this._drawSelectionShadow = () => { };
        }
        //////////////
        // Set edge //
        //////////////
        let preDrawThunk = this.makePreDrawEdge(
            g,
            this._color,
            this._lineWidth,
            this._lineStyle,
            this.isDragging,
            hovered
        );
        let traceThunk = this.makeTraceEdge(g);
        let drawLabelThunk = () => { };
        if (this._lines.length > 0) {
            drawLabelThunk = () => {
                this.drawLabel(g);
            };
        }
        this._draw = () => {
            preDrawThunk();
            g.beginPath();
            traceThunk();
            g.stroke();
            drawLabelThunk();
            g.shadowBlur = 0;
            g.globalAlpha = 1;
        };
    }

    /**
     * hitPoint  
     *   Tests whether or not a point is within the hit threshold of the edge.
     * 
     * @returns
     *   An anchor point if the given point is within the threshold of the edge;
     *   otherwise, null.
     */
    hitPoint(pt: point): point | null {
        if (!(this.src.isHidden || this.dst.isHidden)) {
            let src = this._pts[0];
            let dst = this._pts[1];
            let mid = this._pts[2];
            let margin = this._lineWidth * this._lineWidth + EDGE_HIT_MARGIN * EDGE_HIT_MARGIN;

            let tl = {
                x: Math.min(src.x, dst.x, mid.x) - margin,
                y: Math.min(src.y, dst.y, mid.y) - margin
            };
            let br = {
                x: Math.max(src.x, dst.x, mid.x) + margin,
                y: Math.max(src.y, dst.y, mid.y) + margin
            };
            if (pt.x >= tl.x && pt.y >= tl.y && pt.x <= br.x && pt.y <= br.y) {
                switch (this._pts.length) {
                    // Cubic Bezier.
                    case 7: {
                        let pt1 = this._pts[3];
                        let pt2 = this._pts[4];
                        let hitPt1 = hitPtTestLine(src, pt1, pt, margin);
                        let hitPt2 = hitPtTestLine(pt1, pt2, pt, margin);
                        let hitPt3 = hitPtTestLine(pt2, dst, pt, margin);
                        if (hitPt2 === pt1 || hitPt1 === pt1)
                            hitPt1 = src;
                        else if (hitPt2 === pt2 || hitPt3 === pt2)
                            hitPt3 = dst;
                        if (hitPt1 && hitPt3) {
                            let v = { x: pt.x - src.x, y: pt.y - src.y };
                            let d1 = MathEx.dot(v, v);
                            v.x = pt.x - dst.x;
                            v.y = pt.y - dst.y;
                            let d2 = MathEx.dot(v, v);
                            return (d2 < d1 ? dst : src);
                        }
                        else if (hitPt1)
                            return src;
                        else if (hitPt3)
                            return dst;

                    } break;

                    // Quadratic Bezier.
                    case 4: {
                        let hitPt = hitPtTestLine(src, mid, pt, margin);
                        if (hitPt)
                            return src;
                        hitPt = hitPtTestLine(mid, dst, pt, margin);
                        if (hitPt)
                            return dst;
                    } break;

                    // Straight Line.
                    default: {
                        let hitPt = hitPtTestLine(src, dst, pt, margin);
                        if (hitPt)
                            return hitPt;
                    } break;
                }
            }
        }
        return null;
    }

    /**
     * hitRect  
     *   Tests if any part of the edge is captured by a rectangle.
     */
    hitRect(r: rect): boolean {
        const L = r.x;
        const R = r.x + r.w;
        const T = r.y;
        const B = r.y + r.h;
        let ps = this._pts;
        let p0 = ps[0];
        let p1 = ps[1];
        let p2 = ps[2];
        const inside = (p: point) => {
            return (p.x <= R && p.x >= L && p.y <= B && p.y >= T);
        };
        if (inside(p0) || inside(p1) || inside(p2))
            return true;

        switch (ps.length) {
            // Cubic.
            case 7: {
                return inside(ps[3]) || inside(ps[4]) ||
                    MathEx.cubBezIntersect(p0, ps[5], ps[6], p1, { x: L, y: T }, { x: L, y: B }) ||
                    MathEx.cubBezIntersect(p0, ps[5], ps[6], p1, { x: R, y: T }, { x: R, y: B }) ||
                    MathEx.cubBezIntersect(p0, ps[5], ps[6], p1, { x: L, y: T }, { x: R, y: T }) ||
                    MathEx.cubBezIntersect(p0, ps[5], ps[6], p1, { x: L, y: B }, { x: R, y: B });
            }

            // Quadratic.
            case 4:
                return MathEx.quadBezIntersect(p0, ps[3], p1, { x: L, y: T }, { x: L, y: B }) ||
                    MathEx.quadBezIntersect(p0, ps[3], p1, { x: R, y: T }, { x: R, y: B }) ||
                    MathEx.quadBezIntersect(p0, ps[3], p1, { x: L, y: T }, { x: R, y: T }) ||
                    MathEx.quadBezIntersect(p0, ps[3], p1, { x: L, y: B }, { x: R, y: B });

            // Straight.
            default:
                return hitRectTestStraighEdge(T, L, B, R, p0, p1);
        }
    }

    /**
     * updateOverlappedEdges  
     */
    private updateOverlappedEdges(g: GraphEditorCanvas) {
        if (!this.src.isHidden && !this.dst.isHidden) {
            let srcIn = this.source.incomingEdges;
            let srcOut = this.source.outgoingEdges;
            let dstIn = this.destination.incomingEdges;
            let dstOut = this.destination.outgoingEdges;
            let opposing = new Set<DrawableEdge>(
                [...dstOut].filter(v => srcIn.has(v))
            );
            let adjacent = new Set<DrawableEdge>(
                [...srcOut].filter(v => dstIn.has(v))
            );
            if (opposing.size > 0) {
                for (const edge of adjacent) {
                    edge.setQuadraticPoints();
                    edge.updateDraw(g);
                }
            }
            else {
                for (const edge of adjacent) {
                    edge.setStraightPoints();
                    edge.updateDraw(g);
                }
            }
            if (adjacent.size > 0) {
                for (const edge of opposing) {
                    edge.setQuadraticPoints();
                    edge.updateDraw(g);
                }
            }
            else {
                for (const edge of opposing) {
                    edge.setStraightPoints();
                    edge.updateDraw(g);
                }
            }
        }
        else
            this.setStraightPoints();
    }

    /**
     * setStraightPoints  
     *   Sets the end points and midpoint of a straight line.
     */
    private setStraightPoints(): void {
        let pts: point[] = [];
        let spt = this.src.position;
        let dpt = this.dst.position;
        let v = { x: dpt.x - spt.x, y: dpt.y - spt.y };
        let d = MathEx.mag(v);
        let u = { x: v.x / d, y: v.y / d };
        if (!this.src.isHidden)
            pts.push(this.src.getBoundaryPt(u));
        else
            pts.push(spt);
        if (!this.dst.isHidden) {
            u.x *= -1;
            u.y *= -1;
            pts.push(this.dst.getBoundaryPt(u));
        }
        else
            pts.push(dpt);
        pts.push({
            x: (pts[0].x + pts[1].x) / 2,
            y: (pts[0].y + pts[1].y) / 2
        });
        this.points = pts;
    }

    /**
     * setQuadraticPoints  
     *   Sets the edge points and midpoint of an overlapping edge.
     */
    private setQuadraticPoints(): void {
        let spt = this.src.position;
        let dpt = this.dst.position;
        // Get a vector from the source node to the destination node.
        let v: point = { x: dpt.x - spt.x, y: dpt.y - spt.y, };
        // Get the magitude of the vector.
        let d = MathEx.mag(v);

        spt = this.src.getBoundaryPt({ x: v.x / d, y: v.y / d });
        dpt = this.dst.getBoundaryPt({ x: -v.x / d, y: -v.y / d });
        v.x = dpt.x - spt.x;
        v.y = dpt.y - spt.y;
        d = MathEx.mag(v);

        // Set the control point to the midpoint of the vector plus the scaled
        // normal.
        let pt1: point = {
            x: spt.x + v.x / 2 + v.y / d * GRID_SPACING,
            y: spt.y + v.y / 2 - v.x / d * GRID_SPACING
        };
        // Get the source endpoint.
        v.x = pt1.x - this.src.position.x;
        v.y = pt1.y - this.src.position.y;
        d = MathEx.mag(v);
        let pt0 = this.src.getBoundaryPt({ x: v.x / d, y: v.y / d });
        // Get the destination endpoint.
        v.x = pt1.x - this.dst.position.x;
        v.y = pt1.y - this.dst.position.y;
        d = MathEx.mag(v);
        let pt2 = this.dst.getBoundaryPt({ x: v.x / d, y: v.y / d });
        // Translate the controlpoint by the position of the source node.
        let pts: point[] = [];
        pts.push(pt0);
        pts.push(pt2);
        // Midpoint.
        pts.push({
            x: (pt0.x + 2 * pt1.x + pt2.x) / 4,
            y: (pt0.y + 2 * pt1.y + pt2.y) / 4
        });
        pts.push(pt1);
        this.points = pts;
    }

    /**
     * setLoopPoints  
     *   Sets the edge points and midpoint of a self-referencing node.
     */
    private setLoopPoints(): void {
        let spt = this.src.position;
        let u: point = { x: MathEx.SIN_22_5, y: -MathEx.COS_22_5 };
        let v: point = { x: -MathEx.SIN_22_5, y: -MathEx.COS_22_5 };
        let pt0: point = this.src.getBoundaryPt(u);
        let pt1: point = this.src.getBoundaryPt(v);
        let pt2: point = {
            x: pt0.x + 2 * GRID_SPACING * u.x,
            y: pt0.y + 2 * GRID_SPACING * u.y
        };
        let pt3: point = {
            x: pt1.x + 2 * GRID_SPACING * v.x,
            y: pt1.y + 2 * GRID_SPACING * v.y
        };
        let pts: point[] = [];
        // src
        pts.push(pt0);
        // dst
        pts.push(pt1);
        // mid
        pts.push({
            x: (pts[0].x + 3 * (pt2.x + pt3.x) + pts[1].x) / 8,
            y: (pts[0].y + 3 * (pt2.y + pt3.y) + pts[1].y) / 8
        });
        // 1/3
        pts.push({
            x: (8 * pts[0].x + 12 * pt2.x + 6 * pt3.x + pts[1].x) / 27,
            y: (8 * pts[0].y + 12 * pt2.y + 6 * pt3.y + pts[1].y) / 27
        });
        // 2/3
        pts.push({
            x: (pts[0].x + 6 * pt2.x + 12 * pt3.x + 8 * pts[1].x) / 27,
            y: (pts[0].y + 6 * pt2.y + 12 * pt3.y + 8 * pts[1].y) / 27
        });
        pts.push(pt2);
        pts.push(pt3);
        this.points = pts;
    }

    /**
     * makePreDrawEdge  
     *   Makes a function that sets up the canvas for drawing an edge.
     */
    private makePreDrawEdge(
        g: GraphEditorCanvas,
        color: string,
        lineWidth: number,
        lineStyle: string,
        isDragging: boolean,
        isHovered: boolean
    ): () => void {
        if (isDragging)
            return () => {
                g.globalAlpha = 0.5;
                g.strokeStyle = color;
                g.lineWidth = lineWidth;
                g.lineStyle = { style: lineStyle };
            };
        else if (isHovered)
            return () => {
                g.shadowBlur = 20;
                g.shadowColor = SELECTION_COLOR;
                g.strokeStyle = color;
                g.lineWidth = lineWidth;
                g.lineStyle = { style: lineStyle };
            };
        return () => {
            g.strokeStyle = color;
            g.lineWidth = lineWidth;
            g.lineStyle = { style: lineStyle };
        }
    }

    /**
     * makeTraceEdge  
     *   Makes a function that traces the geometry of an edge.
     */
    private makeTraceEdge(g: GraphEditorCanvas): () => void {
        let pts = this._pts;
        let showSrc = this._srcArrow;
        let showDst = this._dstArrow;
        switch (pts.length) {
            // Cubic
            case 7:
                if (showSrc && showDst)
                    return () => {
                        g.traceCubic(pts[0], pts[1], pts[5], pts[6]);
                        g.traceArrow(pts[5], pts[0]);
                        g.traceArrow(pts[6], pts[1]);
                    };
                else if (showSrc && !showDst)
                    return () => {
                        g.traceCubic(pts[0], pts[1], pts[5], pts[6]);
                        g.traceArrow(pts[5], pts[0]);
                    };
                else if (!showSrc && showDst)
                    return () => {
                        g.traceCubic(pts[0], pts[1], pts[5], pts[6]);
                        g.traceArrow(pts[6], pts[1]);
                    };
                else
                    return () => {
                        g.traceCubic(pts[0], pts[1], pts[5], pts[6]);
                    };

            // Quadratic
            case 4:
                if (showSrc && showDst)
                    return () => {
                        g.traceQuadratic(pts[0], pts[1], pts[3]);
                        g.traceArrow(pts[3], pts[0]);
                        g.traceArrow(pts[3], pts[1]);
                    };
                else if (showSrc && !showDst)
                    return () => {
                        g.traceQuadratic(pts[0], pts[1], pts[3]);
                        g.traceArrow(pts[3], pts[0]);
                    };
                else if (!showSrc && showDst)
                    return () => {
                        g.traceQuadratic(pts[0], pts[1], pts[3]);
                        g.traceArrow(pts[3], pts[1]);
                    };
                else
                    return () => {
                        g.traceQuadratic(pts[0], pts[1], pts[3]);
                    }

            // Linear
            default:
                if (showSrc && showDst)
                    return () => {
                        g.tracePath(pts[0], pts[1]);
                        g.traceArrow(pts[1], pts[0]);
                        g.traceArrow(pts[0], pts[1]);
                    };
                else if (showSrc && !showDst)
                    return () => {
                        g.tracePath(pts[0], pts[1]);
                        g.traceArrow(pts[1], pts[0]);
                    };
                else if (!showSrc && showDst)
                    return () => {
                        g.tracePath(pts[0], pts[1]);
                        g.traceArrow(pts[0], pts[1]);
                    };
        }
        return () => {
            g.tracePath(pts[0], pts[1]);
        };
    }

    /**
     * drawLabelRect  
     *   Draws the background rectangle for the edge label.
     */
    private drawLabelRect(g: GraphEditorCanvas, sz: size) {
        let pt = this._pts[2];
        g.traceRect(makeRect(
            { x: pt.x - sz.w / 2 - 6, y: pt.y - sz.h / 2 },
            { x: pt.x + sz.w / 2 + 6, y: pt.y + sz.h / 2 }
        ));
        g.fill();
        g.shadowBlur = 0;
        g.stroke();
    }

    /**
     * drawEdgeLabel  
     *   Draws the edge label.
     */
    private drawLabel(g: GraphEditorCanvas): void {
        g.fillStyle = "#fff";
        this.drawLabelRect(g, this._textSize);
        g.drawText(this._pts[2], this._textSize.h, this._lines, "#000");
    }

}


/**
 * hitPtTestLine  
 *   Tests if a point is within the threshold of a straight line segment.
 */
function hitPtTestLine(
    src: point,
    dst: point,
    pt: point,
    margin: number
): point | null {
    // Edge vector src -> dst
    let ve = {
        x: dst.x - src.x,
        y: dst.y - src.y,
    };
    // Cursor vector e.src -> cursor
    let vm = {
        x: pt.x - src.x,
        y: pt.y - src.y
    };
    let dotee = MathEx.dot(ve, ve); // edge dot edge
    let dotem = MathEx.dot(ve, vm); // edge dot cursor
    // Projection vector cursor -> edge
    let p = {
        x: ve.x * dotem / dotee,
        y: ve.y * dotem / dotee
    };
    // Rejection vector cursor -^ edge
    let r = { x: vm.x - p.x, y: vm.y - p.y };

    let dotpp = MathEx.dot(p, p); // proj dot proj
    let dotrr = MathEx.dot(r, r); // rej dot rej

    let dep = { x: ve.x - p.x, y: ve.y - p.y };
    let dotdep = MathEx.dot(dep, dep);

    if (dotpp <= dotee && dotdep <= dotee && dotrr < margin)
        return (dotpp < dotee / 4 ? src : dst);
    return null;
}

/**
 * hitRectTestStraighEdge  
 *   Test whether any part of a straight line has been captured by a rectangle.
 */
function hitRectTestStraighEdge(
    T: number,
    L: number,
    B: number,
    R: number,
    p0: point,
    p1: point
): boolean {
    let intersect = (
        i: number,      // Intersect line.
        px: number,     // p0 "x"-coordinate
        py: number,     // p0 "y"-coordinate
        pdx: number,    // delta "x"
        pdy: number,    // delta "y"
        bt: number,     // "top" boundary
        bb: number      // "bottom" boundary
    ) => {
        let t = 0;
        let y = 0;
        return (
            (t = (i - px) / pdx) >= 0 && t <= 1 &&
            (y = py + pdy * t) >= bt && y <= bb
        );
    };
    let Dx = p1.x - p0.x;
    let Dy = p1.y - p0.y;
    return (
        // Line intersects left boundary.
        intersect(L, p0.x, p0.y, Dx, Dy, T, B) ||
        // Line intersects right boundary.
        intersect(R, p0.x, p0.y, Dx, Dy, T, B) ||
        // Line intersects top boundary.
        intersect(T, p0.y, p0.x, Dy, Dx, L, R) ||
        // Line intersects bottom boundary.
        intersect(B, p0.y, p0.x, Dy, Dx, L, R)
    );
}
