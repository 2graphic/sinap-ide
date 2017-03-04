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
import { DrawableNode as DNode } from "./drawable-node";
import {
    GraphEditorCanvas as Canvas,
    LineStyles,
    makeRect,
    point,
    rect,
    size
} from "./graph-editor-canvas";
import * as MathEx from "./math";


type fnGetPoints = (src: DNode, dst: DNode, bspt: point | null, bdpt: point | null) => point[];


/**
 * DrawableEdge
 *   Represents an edge that is drawn on the graph editor canvas.
 */
export class DrawableEdge extends DrawableElement {
    constructor(
        graph: DrawableGraph,
        private readonly src: DNode,
        private readonly dst: DNode,
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
            _spt: {
                enumerable: false,
                writable: true,
                value: (like && like.src === src ? like._spt : null)
            },
            _dpt: {
                enumerable: false,
                writable: true,
                value: (like && like.dst === dst ? like._dpt : null)
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
                    const old = this._srcArrow;
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
                    const old = this._dstArrow;
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
                    const old = this._lineStyle;
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
                    const old = this._lineWidth;
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


    // Private fields //////////////////////////////////////////////////////////


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
     *
     *   Keeps track of points-of-interest related to the edge.
     *
     * <p>
     *   The first two points represent the boundary points along the source and
     *   destination nodes respectively; the third point is the center point of
     *   the label; the fourth point is the midpoint along the edge geometry;
     *   for cubic bezier curves, the fifth and sixth points are the t/3 and
     *   2t/3 points of the line; all other points are control points for
     *   bezier curves.
     * </p>
     */
    private _pts: point[];

    /**
     * _spt
     *   The bound anchor point of the source node.
     */
    private _spt: point | null;

    /**
     * _dpt
     *   The bound anchor point of the destination node.
     */
    private _dpt: point | null;

    /**
     * source
     *   Gets the reference to the drawable source node of the edge.
     */
    readonly source: DNode;

    /**
     * destination
     *   Gets the reference to the drawable destination node of the edge.
     */
    readonly destination: DNode;

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
        if (this._pts.length === value.length) {
            for (let i = 0; i < value.length; i++)
                this._pts[i] = value[i];
        }
        else
            this._pts = value;
    }


    ////////////////////////////////////////////////////////////////////////////

    /**
     * update
     *   Updates the geometry and draw logic of the edge.
     */
    update(g: Canvas): void {
        console.assert(
            !this.src.isHidden || !this.dst.isHidden,
            "error GraphEditorEdge.updatePoints: drawable edge must " +
            "have either a source or a destination"
        );
        this.updateTextSize(g);
        const adjacent = this.getAdjacent();
        const opposing = this.getOpposing();
        // TODO:
        // Fix overlapped edges.
        if (this.src === this.dst)
            this.updateOverlappedPoints(g, getLoopPoints, adjacent);
        else if (!this.src.isHidden && !this.dst.isHidden) {
            if (opposing.length > 0)
                this.updateOverlappedPoints(g, getQuadraticPoints, adjacent);
            else
                this.updateOverlappedPoints(g, getStraightPoints, adjacent);
            if (adjacent.length > 0)
                this.updateOverlappedPoints(g, getQuadraticPoints, opposing);
            else
                this.updateOverlappedPoints(g, getStraightPoints, opposing);
        }
        else
            this.updateOverlappedPoints(g, getStraightPoints, adjacent);
    }

    /**
     * updateDraw
     *   Updates the draw logic of the edge.
     */
    updateDraw(g: Canvas) {
        let hovered = this.isHovered;
        /////////////////////////
        // Set selected shadow //
        /////////////////////////
        if (this.isSelected) {
            const preDrawThunk = this.makePreDrawEdge(
                g,
                SELECTION_COLOR,
                this._lineWidth + 4,
                "solid",
                false,
                this.isHovered
            );
            const traceThunk = this.makeTraceEdge(g);
            let drawLabelThunk = MathEx.NOOP;
            if (this._lines.length > 0) {
                const size = {
                    h: this._textSize.h + 4,
                    w: this._textSize.w + 4
                };
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
            };
            hovered = false;
        }
        else {
            this._drawSelectionShadow = MathEx.NOOP;
        }
        //////////////
        // Set edge //
        //////////////
        const preDrawThunk = this.makePreDrawEdge(
            g,
            this._color,
            this._lineWidth,
            this._lineStyle,
            this.isDragging,
            hovered
        );
        const traceThunk = this.makeTraceEdge(g);
        let drawLabelThunk = MathEx.NOOP;
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
            const spt = this._pts[0];
            const dpt = this._pts[1];
            if (this._textSize.h > 0 && inside(
                pt,
                this._pts[2].x - this._textSize.w / 2 - 6, this._pts[2].y - this._textSize.h / 2,
                this._pts[2].x + this._textSize.w / 2 + 6, this._pts[2].y + this._textSize.h / 2))
                return ((pt.x - this._pts[2].x) > 0 ? dpt : spt);
            const mpt = this._pts[3];
            const margin = this._lineWidth * this._lineWidth + EDGE_HIT_MARGIN * EDGE_HIT_MARGIN;

            const tl = {
                x: Math.min(spt.x, dpt.x, mpt.x) - margin,
                y: Math.min(spt.y, dpt.y, mpt.y) - margin
            };
            const br = {
                x: Math.max(spt.x, dpt.x, mpt.x) + margin,
                y: Math.max(spt.y, dpt.y, mpt.y) + margin
            };
            if (pt.x >= tl.x && pt.y >= tl.y && pt.x <= br.x && pt.y <= br.y) {
                switch (this._pts.length) {
                    // Cubic Bezier.
                    case 8: {
                        const pt1 = this._pts[4];
                        const pt2 = this._pts[5];
                        let hitPt1 = hitPtTestLine(spt, pt1, pt, margin);
                        const hitPt2 = hitPtTestLine(pt1, pt2, pt, margin);
                        let hitPt3 = hitPtTestLine(pt2, dpt, pt, margin);
                        if (hitPt2 === pt1 || hitPt1 === pt1)
                            hitPt1 = spt;
                        else if (hitPt2 === pt2 || hitPt3 === pt2)
                            hitPt3 = dpt;
                        if (hitPt1 && hitPt3) {
                            const v = MathEx.subtract(pt, spt);
                            const d1 = MathEx.dot(v, v);
                            v.x = pt.x - dpt.x;
                            v.y = pt.y - dpt.y;
                            const d2 = MathEx.dot(v, v);
                            return (d2 < d1 ? dpt : spt);
                        }
                        else if (hitPt1)
                            return spt;
                        else if (hitPt3)
                            return dpt;

                    } break;

                    // Quadratic Bezier.
                    case 5: {
                        let hitPt = hitPtTestLine(spt, mpt, pt, margin);
                        if (hitPt)
                            return spt;
                        hitPt = hitPtTestLine(mpt, dpt, pt, margin);
                        if (hitPt)
                            return dpt;
                    } break;

                    // Straight Line.
                    default: {
                        const hitPt = hitPtTestLine(spt, dpt, pt, margin);
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
        const ps = this._pts;
        const p0 = ps[0];
        const p1 = ps[1];
        const p2 = ps[2];
        const p3 = ps[3];
        if (inside(p0, L, T, R, B) || inside(p1, L, T, R, B) || inside(p2, L, T, R, B) || inside(p3, L, T, R, B))
            return true;

        switch (ps.length) {
            // Cubic.
            case 8: {
                return inside(ps[4], L, T, R, B) || inside(ps[5], L, T, R, B) ||
                    MathEx.cubBezIntersect(p0, ps[6], ps[7], p1, { x: L, y: T }, { x: L, y: B }) ||
                    MathEx.cubBezIntersect(p0, ps[6], ps[7], p1, { x: R, y: T }, { x: R, y: B }) ||
                    MathEx.cubBezIntersect(p0, ps[6], ps[7], p1, { x: L, y: T }, { x: R, y: T }) ||
                    MathEx.cubBezIntersect(p0, ps[6], ps[7], p1, { x: L, y: B }, { x: R, y: B });
            }

            // Quadratic.
            case 5:
                return MathEx.quadBezIntersect(p0, ps[4], p1, { x: L, y: T }, { x: L, y: B }) ||
                    MathEx.quadBezIntersect(p0, ps[4], p1, { x: R, y: T }, { x: R, y: B }) ||
                    MathEx.quadBezIntersect(p0, ps[4], p1, { x: L, y: T }, { x: R, y: T }) ||
                    MathEx.quadBezIntersect(p0, ps[4], p1, { x: L, y: B }, { x: R, y: B });

            // Straight.
            default:
                return hitRectTestStraighEdge(T, L, B, R, p0, p1);
        }
    }

    /**
     * bindAnchor
     *   Binds an end point of the edge to a node anchor.
     */
    bindAnchor(n: DNode, apt: point) {
        if (n === this.src)
            this._spt = apt;
        else if (n === this.dst)
            this._dpt = apt;
    }

    /**
     * unbindAnchor
     *   Unbinds an end point of the edge from a node anchor.
     */
    unbindAnchor(n: DNode) {
        if (n === this.src)
            this._spt = null;
        else if (n === this.dst)
            this._dpt = null;
    }

    private updateOverlappedPoints(g: Canvas, getPts: fnGetPoints, edges: DrawableEdge[]) {
        const first = edges.pop();
        if (first) {
            first.points = getPts(first.src, first.dst, first._spt, first._dpt);
            const norm = MathEx.normal(MathEx.subtract(first._pts[0], first._pts[1]));
            const dir = MathEx.sgn(norm.y);
            norm.x *= (first.src === first.dst ? 0 : GRID_SPACING / 2);
            norm.y *= GRID_SPACING / 2;
            first._pts[2].x -= norm.x;
            first._pts[2].y += norm.y;
            let yOffset = dir * first._textSize.h;
            for (const edge of edges) {
                edge.points = getPts(edge.src, edge.dst, edge._spt, edge._dpt);
                edge._pts[2].x -= norm.x;
                edge._pts[2].y += norm.y + yOffset;
                yOffset += dir * edge._textSize.h;
                edge.updateDraw(g);
                // TODO:
                // How do we want to deal with adjacent edges of different types?
                // edge._draw = MathEx.NOOP;
            }
            first.updateDraw(g);
            edges.push(first);
        }
    }

    private getAdjacent() {
        return this.filterEdges(
            this.dst.incomingEdges,
            this.src.outgoingEdges,
            this._spt,
            this._dpt
        );
    }

    private getOpposing() {
        return this.filterEdges(
            this.src.incomingEdges,
            this.dst.outgoingEdges,
            this._dpt,
            this._spt
        );
    }

    private filterEdges(
        incoming: Set<DrawableEdge>,
        outgoing: Set<DrawableEdge>,
        spt: point | null,
        dpt: point | null) {
        const edges = [...outgoing].filter(v =>
            incoming.has(v) && (spt === v._spt && dpt === v._dpt)
        );
        edges.sort((a, b) => {
            if (a.label < b.label)
                return -1;
            else if (a.label > b.label)
                return 1;
            return 0;
        });
        edges.reverse();
        return edges;
    }

    /**
     * makePreDrawEdge
     *   Makes a function that sets up the canvas for drawing an edge.
     */
    private makePreDrawEdge(
        g: Canvas,
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
        };
    }

    /**
     * makeTraceEdge
     *   Makes a function that traces the geometry of an edge.
     */
    private makeTraceEdge(g: Canvas): () => void {
        const pts = this._pts;
        const showSrc = this._srcArrow;
        const showDst = this._dstArrow;
        const spt = pts[0];
        const dpt = pts[1];
        switch (pts.length) {
            // Cubic
            case 8: {
                const cpt1 = pts[6];
                const cpt2 = pts[7];
                if (showSrc && showDst)
                    return () => {
                        g.traceCubic(spt, dpt, cpt1, cpt2);
                        g.traceArrow(cpt1, spt);
                        g.traceArrow(cpt2, dpt);
                    };
                else if (showSrc && !showDst)
                    return () => {
                        g.traceCubic(spt, dpt, cpt1, cpt2);
                        g.traceArrow(cpt1, spt);
                    };
                else if (!showSrc && showDst)
                    return () => {
                        g.traceCubic(spt, dpt, cpt1, cpt2);
                        g.traceArrow(cpt2, dpt);
                    };
                else
                    return () => {
                        g.traceCubic(spt, dpt, cpt1, cpt2);
                    };
            }

            // Quadratic
            case 5: {
                const cpt = pts[4];
                if (showSrc && showDst)
                    return () => {
                        g.traceQuadratic(spt, dpt, cpt);
                        g.traceArrow(cpt, spt);
                        g.traceArrow(cpt, dpt);
                    };
                else if (showSrc && !showDst)
                    return () => {
                        g.traceQuadratic(spt, dpt, cpt);
                        g.traceArrow(cpt, spt);
                    };
                else if (!showSrc && showDst)
                    return () => {
                        g.traceQuadratic(spt, dpt, cpt);
                        g.traceArrow(cpt, dpt);
                    };
                else
                    return () => {
                        g.traceQuadratic(spt, dpt, cpt);
                    };
            }

            // Linear
            default: {
                if (showSrc && showDst)
                    return () => {
                        g.tracePath(spt, dpt);
                        g.traceArrow(dpt, spt);
                        g.traceArrow(spt, dpt);
                    };
                else if (showSrc && !showDst)
                    return () => {
                        g.tracePath(spt, dpt);
                        g.traceArrow(dpt, spt);
                    };
                else if (!showSrc && showDst)
                    return () => {
                        g.tracePath(spt, dpt);
                        g.traceArrow(spt, dpt);
                    };
            }
        }
        return () => {
            g.tracePath(spt, dpt);
        };
    }

    /**
     * drawLabelRect
     *   Draws the background rectangle for the edge label.
     */
    private drawLabelRect(g: Canvas, sz: size) {
        const pt = this._pts[2];
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
    private drawLabel(g: Canvas): void {
        g.fillStyle = "#fff";
        this.drawLabelRect(g, this._textSize);
        g.drawText(this._pts[2], this._textSize.h, this._lines, "#000");
    }

}


// Static functions ////////////////////////////////////////////////////////////


const getStraightPoints = (src: DNode, dst: DNode, bspt: point | null, bdpt: point | null) => {
    const pts: point[] = [];
    pts.push({ x: src.position.x, y: src.position.y });
    pts.push({ x: dst.position.x, y: dst.position.y });
    if (bspt && bdpt) {
        pts[0].x += bspt.x;
        pts[0].y += bspt.y;
        pts[1].x += bdpt.x;
        pts[1].y += bdpt.y;
    }
    else if (bspt && !bdpt) {
        pts[0].x += bspt.x;
        pts[0].y += bspt.y;
        const v = MathEx.subtract(pts[0], pts[1]);
        const d = MathEx.mag(v);
        const u = { x: v.x / d, y: v.y / d };
        pts[1] = dst.getBoundaryPt(u);
    }
    else if (!bspt && bdpt) {
        pts[1].x += bdpt.x;
        pts[1].y += bdpt.y;
        const v = MathEx.subtract(pts[1], pts[0]);
        const d = MathEx.mag(v);
        const u = { x: v.x / d, y: v.y / d };
        pts[0] = src.getBoundaryPt(u);
    }
    else {
        const v = MathEx.subtract(pts[1], pts[0]);
        const d = MathEx.mag(v);
        const u = { x: v.x / d, y: v.y / d };
        pts[0] = src.getBoundaryPt(u);
        u.x *= -1;
        u.y *= -1;
        pts[1] = dst.getBoundaryPt(u);
    }
    pts.push({
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
    });
    pts.push({ x: pts[2].x, y: pts[2].y });
    return pts;
};

const getQuadraticPoints = (src: DNode, dst: DNode, bspt: point | null, bdpt: point | null) => {
    const pts: point[] = [];
    let spt = {
        x: src.position.x + (bspt ? bspt.x : 0),
        y: src.position.y + (bspt ? bspt.y : 0)
    };
    let dpt = {
        x: dst.position.x + (bdpt ? bdpt.x : 0),
        y: dst.position.y + (bdpt ? bdpt.y : 0)
    };

    // Get a vector from the source node to the destination node.
    const v = MathEx.subtract(dpt, spt);
    // Get the magitude of the vector.
    let d = MathEx.mag(v);

    if (!bspt)
        spt = src.getBoundaryPt({ x: v.x / d, y: v.y / d });
    if (!bdpt)
        dpt = dst.getBoundaryPt({ x: -v.x / d, y: -v.y / d });
    v.x = dpt.x - spt.x;
    v.y = dpt.y - spt.y;
    d = MathEx.mag(v);

    // Set the control point to the midpoint of the vector plus the scaled
    // normal.
    const pt1: point = {
        x: spt.x + v.x / 2 + v.y / d * GRID_SPACING,
        y: spt.y + v.y / 2 - v.x / d * GRID_SPACING
    };

    if (!bspt) {
        v.x = pt1.x - src.position.x;
        v.y = pt1.y - src.position.y;
        d = MathEx.mag(v);
        pts.push(src.getBoundaryPt({ x: v.x / d, y: v.y / d }));
    }
    else
        pts.push(spt);

    if (!bdpt) {
        // Get the destination endpoint.
        v.x = pt1.x - dst.position.x;
        v.y = pt1.y - dst.position.y;
        d = MathEx.mag(v);
        pts.push(dst.getBoundaryPt({ x: v.x / d, y: v.y / d }));
    }
    else
        pts.push(dpt);

    // Midpoint and label point.
    pts.push({
        x: (pts[0].x + 2 * pt1.x + pts[1].x) / 4,
        y: (pts[0].y + 2 * pt1.y + pts[1].y) / 4
    });
    pts.push({ x: pts[2].x, y: pts[2].y });
    pts.push(pt1);
    return pts;
};

const getLoopPoints = (src: DNode, dst: DNode, bspt: point | null, bdpt: point | null) => {
    // TODO:
    // Make sure the edge goes from left to right if the source and destination
    // points of the edge are not bound to any anchor points.
    // Otherwise, make sure that the control points go in the appropriate
    // direction relative to the positions of the end points.
    const pts: point[] = [];
    let spt = {
        x: src.position.x + (bspt ? bspt.x : 0),
        y: src.position.y + (bspt ? bspt.y : 0)
    };
    let dpt = {
        x: dst.position.x + (bdpt ? bdpt.x : 0),
        y: dst.position.y + (bdpt ? bdpt.y : 0)
    };

    const u: point = { x: -MathEx.SIN_22_5, y: -MathEx.COS_22_5 };
    const v: point = { x: MathEx.SIN_22_5, y: -MathEx.COS_22_5 };

    if (!bspt)
        pts.push(src.getBoundaryPt(u));
    else
        pts.push(spt);

    if (!bdpt)
        pts.push(dst.getBoundaryPt(v));
    else
        pts.push(dpt);

    const pt1: point = {
        x: pts[0].x + 2 * GRID_SPACING * u.x,
        y: pts[0].y + 2 * GRID_SPACING * u.y
    };
    const pt2: point = {
        x: pts[1].x + 2 * GRID_SPACING * v.x,
        y: pts[1].y + 2 * GRID_SPACING * v.y
    };

    // label
    pts.push({
        x: (pts[0].x + 3 * (pt1.x + pt2.x) + pts[1].x) / 8,
        y: (pts[0].y + 3 * (pt1.y + pt2.y) + pts[1].y) / 8
    });
    // mid
    pts.push({ x: pts[2].x, y: pts[2].y });
    // 1/3
    pts.push({
        x: (8 * pts[0].x + 12 * pt1.x + 6 * pt2.x + pts[1].x) / 27,
        y: (8 * pts[0].y + 12 * pt1.y + 6 * pt2.y + pts[1].y) / 27
    });
    // 2/3
    pts.push({
        x: (pts[0].x + 6 * pt1.x + 12 * pt2.x + 8 * pts[1].x) / 27,
        y: (pts[0].y + 6 * pt1.y + 12 * pt2.y + 8 * pts[1].y) / 27
    });
    pts.push(pt1);
    pts.push(pt2);
    return pts;
};

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
    const ve = MathEx.subtract(dst, src);
    // Cursor vector e.src -> cursor
    const vm = MathEx.subtract(pt, src);
    const dotee = MathEx.dot(ve, ve); // edge dot edge
    const dotem = MathEx.dot(ve, vm); // edge dot cursor
    // Projection vector cursor -> edge
    const p = {
        x: ve.x * dotem / dotee,
        y: ve.y * dotem / dotee
    };
    // Rejection vector cursor -^ edge
    const r = MathEx.subtract(vm, p);

    const dotpp = MathEx.dot(p, p); // proj dot proj
    const dotrr = MathEx.dot(r, r); // rej dot rej

    const dep = MathEx.subtract(ve, p);
    const dotdep = MathEx.dot(dep, dep);

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
    const intersect = (
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
    const Dx = p1.x - p0.x;
    const Dy = p1.y - p0.y;
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

const inside = (p: point, left: number, top: number, right: number, bottom: number) => {
    return (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom);
};
