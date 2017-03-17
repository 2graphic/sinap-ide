/**
 * @file `editor-edge.ts`
 *   Created on March 11, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


import {
    FONT_SIZE,
    GRID_SPACING,
    SELECTION_COLOR,
    EDGE_HIT_MARGIN
} from "./defaults";
import { PropertyChangedEvent } from "./events";
import { EditorElement, DrawableStates } from "./editor-element";
import { EditorNode } from "./editor-node";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";
import { EditorCanvas, point, rect } from "./editor-canvas";
import * as MathEx from "./math";


/**
 * `fnGetPoints`
 *
 *   Type definition for functions that return a list of edge points.
 */
type fnGetPoints = (
    src: EditorNode,
    dst: EditorNode,
    bspt: point | null,
    bdpt: point | null
) => point[];


/**
 * `EditorEdge`
 *
 *   Provides draw, hit, and update logic for drawable edges.
 *
 * @extends EditorElement
 */
export class EditorEdge extends EditorElement<DrawableEdge> {
    constructor(
        drawable: DrawableEdge,
        public readonly source: EditorNode,
        public readonly destination: EditorNode
    ) {
        super(drawable);
        source.outgoingEdges.add(this);
        destination.incomingEdges.add(this);
        if (source.drawable.anchorPoints.length > 0)
            this.bindSourceAnchor(drawable.sourcePoint);
        if (destination.drawable.anchorPoints.length > 0)
            this.bindDestinationAnchor(drawable.destinationPoint);
        this.updateDrawSetup();
    }


    // Private fields //////////////////////////////////////////////////////////


    /**
     * `_pts`
     *
     *   Keeps track of points-of-interest related to the edge.
     *
     *   The first two points represent the boundary points along the source and
     *   destination nodes respectively; the third point is the midpoint along
     *   the edge geometry; for cubic bezier curves, the fifth and sixth points
     *   are the t/3 and 2t/3 points of the line; all other points are control
     *   points for bezier curves.
     */
    private _pts: point[]
    = [];

    /**
     * `_spt`
     *
     *   The bound source anchor point.
     */
    private _spt: point | null
    = null;

    /**
     * `_dpt`
     *
     *   The bound destination anchor point.
     */
    private _dpt: point | null
    = null;

    /**
     * `trace`
     *
     *   Traces the edge.
     */
    private trace: (g: EditorCanvas) => void
    = (g: EditorCanvas) => { };

    /**
     * `drawLabelRect`
     *
     *   Draws the label rectangle.
     */
    private drawLabelRect: (g: EditorCanvas) => void
    = (g: EditorCanvas) => { };

    /**
     * `drawSetup`
     *
     *   Sets up the canvas for drawing the edge.
     */
    private drawSetup: (g: EditorCanvas) => void
    = (g: EditorCanvas) => { };

    /**
     * `points`
     *
     *   Sets the points-of-interest related to the edge.
     */
    private set points(value: point[]) {
        if (this._pts.length === value.length) {
            for (let i = 0; i < value.length; i++) {
                this._pts[i].x = value[i].x;
                this._pts[i].y = value[i].y;
            }
        }
        else {
            this._pts = value;
            this.updateTrace();
        }
        this.drawable.sourcePoint = value[0];
        this.drawable.destinationPoint = value[1];
    }


    // Public fields ///////////////////////////////////////////////////////////


    set isDragging(value: boolean) {
        super.isDragging = value;
        this.updateDrawSetup();
    }

    set isHovered(value: boolean) {
        super.isHovered = value;
        this.updateDrawSetup();
    }


    // Public Methods //////////////////////////////////////////////////////////


    drawHighlight(g: EditorCanvas) {
        this.trace(g);
        g.lineStyle = "solid";
        g.lineWidth = this.drawable.lineWidth + 6;
        g.strokeColor = SELECTION_COLOR;
        g.stroke();
        this.drawLabelRect(g);
    }

    /**
     * `drawText`
     *
     *   Draws the label on a given canvas.
     */
    drawText(g: EditorCanvas) {
        const x = this.textRect.x;
        let y = this.textRect.y - (this.textRect.height - 1.5 * FONT_SIZE) / 2;
        g.fillColor = "#000";
        this.lines.forEach(l => {
            g.fillText(l, x, y);
            y += 1.5 * FONT_SIZE;
        });
    }

    draw(g: EditorCanvas) {
        this.trace(g);
        this.drawSetup(g);
        g.stroke();
        this.drawLabelRect(g);
        this.drawText(g);
        g.shadowBlur = 0;
        g.globalAlpha = 1;
    }

    update(g: EditorCanvas) {
        this.updateTextSize(g);
        this.updateDrawLabelRect();
        const drawable = this.drawable;
        const adjacent = this.getAdjacent();
        const opposing = this.getOpposing();
        if (this.source === this.destination)
            this.updatePoints(g, makeLoopPoints, adjacent);
        else if (!this.source.isHidden && !this.destination.isHidden) {
            if (opposing.length > 0)
                this.updatePoints(g, makeQuadraticPoints, adjacent);
            else
                this.updatePoints(g, makeStraightPoints, adjacent);
            if (adjacent.length > 0)
                this.updatePoints(g, makeQuadraticPoints, opposing);
            else
                this.updatePoints(g, makeStraightPoints, opposing);
        }
        else
            this.updatePoints(g, makeStraightPoints, adjacent);
    }

    /**
     * `hitPoint`
     *
     *   Tests whether a given coordinate is within the element region.
     *
     * @returns
     *   An anchor vector if the given coordinate is within the threshold of the
     *   edge; otherwise, null.
     */
    hitPoint(pt: point): point | null {
        const pts = this._pts;
        const src = this.source;
        const dst = this.destination;
        const textRect = this.textRect;
        if (!(src.isHidden || dst.isHidden)) {
            const spt = MathEx.sum(src.position, pts[0]);
            const dpt = MathEx.sum(dst.position, pts[1]);
            if (textRect.height > 0 && inside(
                pt,
                textRect.x - textRect.width / 2 - 3,
                textRect.y - textRect.height / 2,
                textRect.x + textRect.width / 2 + 3,
                textRect.y + textRect.height / 2
            ))
                return ((pt.x - textRect.x) > 0 ? pts[1] : pts[0]);
            const mpt = MathEx.sum(spt, this._pts[2]);
            const margin = this.drawable.lineWidth * this.drawable.lineWidth
                + EDGE_HIT_MARGIN * EDGE_HIT_MARGIN;
            const topleft = {
                x: Math.min(spt.x, dpt.x, mpt.x) - margin,
                y: Math.min(spt.y, dpt.y, mpt.y) - margin
            };
            const bottomright = {
                x: Math.max(spt.x, dpt.x, mpt.x) + margin,
                y: Math.max(spt.y, dpt.y, mpt.y) + margin
            };
            if (pt.x >= topleft.x && pt.y >= topleft.y &&
                pt.x <= bottomright.x && pt.y <= bottomright.y) {
                switch (this._pts.length) {
                    // Cubic Bezier.
                    case 7: {
                        const pt1 = MathEx.sum(spt, this._pts[3]);
                        const pt2 = MathEx.sum(spt, this._pts[4]);
                        let hitPt1 = hitPtTestLine(spt, pt1, pt, margin);
                        const hitPt2 = hitPtTestLine(pt1, pt2, pt, margin);
                        let hitPt3 = hitPtTestLine(pt2, dpt, pt, margin);
                        if (hitPt2 === pt1 || hitPt1 === pt1)
                            hitPt1 = spt;
                        else if (hitPt2 === pt2 || hitPt3 === pt2)
                            hitPt3 = dpt;
                        if (hitPt1 && hitPt3) {
                            let v = MathEx.diff(pt, spt);
                            const d1 = MathEx.dot(v, v);
                            v = MathEx.diff(pt, dpt);
                            const d2 = MathEx.dot(v, v);
                            return (d2 < d1 ? pts[1] : pts[0]);
                        }
                        else if (hitPt1)
                            return pts[0];
                        else if (hitPt3)
                            return pts[1];

                    } break;

                    // Quadratic Bezier.
                    case 4: {
                        let hitPt = hitPtTestLine(spt, mpt, pt, margin);
                        if (hitPt)
                            return pts[0];
                        hitPt = hitPtTestLine(mpt, dpt, pt, margin);
                        if (hitPt)
                            return pts[1];
                    } break;

                    // Straight Line.
                    default: {
                        const hitPt = hitPtTestLine(spt, dpt, pt, margin);
                        if (hitPt)
                            return (hitPt === spt ? pts[0] : pts[1]);
                    } break;
                }
            }
        }
        return null;
    }

    hitRect(r: rect): boolean {
        const L = r.x;
        const R = r.x + r.width;
        const T = r.y;
        const B = r.y + r.height;
        const pts = this._pts;
        const spt = MathEx.sum(this.source.position, pts[0]);
        const dpt = MathEx.sum(this.destination.position, pts[1]);
        const mpt = MathEx.sum(this.source.position, pts[2]);
        const lpt = this.textRect;
        if (inside(spt, L, T, R, B) || inside(dpt, L, T, R, B) ||
            inside(mpt, L, T, R, B) || inside(lpt, L, T, R, B))
            return true;

        switch (pts.length) {
            // Cubic.
            case 7: {
                const cp1 = MathEx.sum(spt, pts[5]);
                const cp2 = MathEx.sum(dpt, pts[6]);
                return inside(pts[4], L, T, R, B) ||
                    inside(pts[5], L, T, R, B) ||
                    MathEx.cubBezIntersect(spt, cp1, cp2, dpt,
                        { x: L, y: T }, { x: L, y: B }) ||
                    MathEx.cubBezIntersect(spt, cp1, cp2, dpt,
                        { x: R, y: T }, { x: R, y: B }) ||
                    MathEx.cubBezIntersect(spt, cp1, cp2, dpt,
                        { x: L, y: T }, { x: R, y: T }) ||
                    MathEx.cubBezIntersect(spt, cp1, cp2, dpt,
                        { x: L, y: B }, { x: R, y: B });
            }

            // Quadratic.
            case 4: {
                const cpt = MathEx.sum(spt, pts[3]);
                return MathEx.quadBezIntersect(spt, cpt, dpt,
                    { x: L, y: T }, { x: L, y: B }) ||
                    MathEx.quadBezIntersect(spt, cpt, dpt,
                        { x: R, y: T }, { x: R, y: B }) ||
                    MathEx.quadBezIntersect(spt, cpt, dpt,
                        { x: L, y: T }, { x: R, y: T }) ||
                    MathEx.quadBezIntersect(spt, cpt, dpt,
                        { x: L, y: B }, { x: R, y: B });
            }

            // Straight.
            default:
                return hitRectTestStraighEdge(T, L, B, R, spt, dpt);
        }
    }

    /**
     * `bindSourceAnchor`
     *
     *   Binds the source vector of the edge to the nearest anchor vector of its
     *   source node from the given vector relative to the node position.
     */
    bindSourceAnchor(pt: point) {
        this._spt = this.source.getNearestAnchor(pt);
    }

    /**
     * `bindDestinationAnchor`
     *
     *   Binds the destination vector of the edge to the nearest anchor vector
     *   of its destination node from the given vector relative to the node
     *   position.
     */
    bindDestinationAnchor(pt: point) {
        this._dpt = this.destination.getNearestAnchor(pt);
    }

    /**
     * `unbindAnchor`
     *
     *   Unbinds an anchor vector from the given anchor vector.
     */
    unbindAnchor(pt: point) {
        if (pt === this._spt)
            this._spt = null;
        if (pt === this._dpt)
            this._dpt = null;
    }


    // Private methods /////////////////////////////////////////////////////////


    /**
     * `getAdjacent`
     *
     *   Gets the list of adjacent edges.
     */
    private getAdjacent() {
        return this.filterEdges(
            this.destination.incomingEdges,
            this.source.outgoingEdges,
            this._spt,
            this._dpt
        );
    }

    /**
     * `getOpposing`
     *
     *   Gets the list of opposing edges.
     */
    private getOpposing() {
        return this.filterEdges(
            this.source.incomingEdges,
            this.destination.outgoingEdges,
            this._dpt,
            this._spt
        );
    }

    /**
     * `filterEdges`
     *
     *   Returns a list of filtered edges.
     */
    private filterEdges(
        incoming: Set<EditorEdge>,
        outgoing: Set<EditorEdge>,
        spt: point | null,
        dpt: point | null) {
        const edges = [...outgoing].filter(v =>
            incoming.has(v) && (spt === v._spt && dpt === v._dpt)
        );
        edges.sort((a, b) => {
            if (a.drawable.label > b.drawable.label)
                return -1;
            else if (a.drawable.label < b.drawable.label)
                return 1;
            return 0;
        });
        return edges;
    }

    /**
     * `updatePoints`
     *
     *   Updates the points of the edge and any other edges parallel to this
     *   one.
     *
     * @param g
     *   The canvas with which to update the points.
     *
     * @param makePoints
     *   The function to generate the points.
     *
     * @param edges
     *   The list of parallel edges.
     */
    private updatePoints(
        g: EditorCanvas,
        makePoints: fnGetPoints,
        edges: EditorEdge[]
    ) {
        const first = edges.pop();
        if (first) {
            first.points = makePoints(
                first.source, first.destination,
                first._spt, first._dpt
            );
            const norm = MathEx.normal(
                MathEx.diff(
                    MathEx.sum(first.source.position, first._pts[0]),
                    MathEx.sum(first.destination.position, first._pts[1])
                )
            );
            const dir = first.source === first.destination ?
                -1 :
                MathEx.sgn(norm.y);
            norm.x *= first.source === first.destination ?
                0 :
                GRID_SPACING / 2;
            norm.y *= GRID_SPACING / 2;
            first.textRect.x = first.source.position.x + first._pts[0].x
                + first._pts[2].x - norm.x;
            first.textRect.y = first.source.position.y + first._pts[0].y
                + first._pts[2].y + norm.y;
            let yOffset = first.textRect.height > 0 ?
                dir * (first.textRect.height + first.drawable.lineWidth) :
                0;
            for (const edge of edges) {
                edge.points = first._pts;
                edge.textRect.x = edge.source.position.x + edge._pts[0].x
                    + edge._pts[2].x - norm.x;
                edge.textRect.y = edge.source.position.y + edge._pts[0].y
                    + edge._pts[2].y + norm.y + yOffset;
                yOffset += edge.textRect.height > 0 ?
                    dir * (edge.textRect.height + edge.drawable.lineWidth) :
                    0;
                // TODO:
                // How do we want to deal with adjacent edges of different
                // types?
                // edge._draw = MathEx.NOOP;
            }
            edges.push(first);
        }
    }

    /**
     * `updateTrace`
     *
     *   Updates the `trace` function.
     */
    private updateTrace() {
        const showSrc = this.drawable.showSourceArrow;
        const showDst = this.drawable.showDestinationArrow;
        const pts = this._pts;
        const src = this.source;
        const dst = this.destination;
        switch (pts.length) {
            // Cubic
            case 7: {
                if (showSrc && showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cp1 = MathEx.sum(spt, pts[5]);
                        const cp2 = MathEx.sum(dpt, pts[6]);
                        g.beginPath();
                        g.traceCubic(spt, dpt, cp1, cp2);
                        g.traceArrow(cp2, dpt);
                        g.traceArrow(cp1, spt);
                    };
                else if (showSrc && !showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cp1 = MathEx.sum(spt, pts[5]);
                        const cp2 = MathEx.sum(dpt, pts[6]);
                        g.beginPath();
                        g.traceCubic(spt, dpt, cp1, cp2);
                        g.traceArrow(cp1, spt);
                    };
                else if (!showSrc && showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cp1 = MathEx.sum(spt, pts[5]);
                        const cp2 = MathEx.sum(dpt, pts[6]);
                        g.beginPath();
                        g.traceCubic(spt, dpt, cp1, cp2);
                        g.traceArrow(cp2, dpt);
                    };
                else
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cp1 = MathEx.sum(spt, pts[5]);
                        const cp2 = MathEx.sum(dpt, pts[6]);
                        g.beginPath();
                        g.traceCubic(spt, dpt, cp1, cp2);
                    };
            } break;

            // Quadratic
            case 4: {
                if (showSrc && showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cpt = MathEx.sum(spt, pts[3]);
                        g.beginPath();
                        g.traceQuadratic(spt, dpt, cpt);
                        g.traceArrow(cpt, dpt);
                        g.traceArrow(cpt, spt);
                    };
                else if (showSrc && !showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cpt = MathEx.sum(spt, pts[3]);
                        g.beginPath();
                        g.traceQuadratic(spt, dpt, cpt);
                        g.traceArrow(cpt, spt);
                    };
                else if (!showSrc && showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cpt = MathEx.sum(spt, pts[3]);
                        g.beginPath();
                        g.traceQuadratic(spt, dpt, cpt);
                        g.traceArrow(cpt, dpt);
                    };
                else
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        const cpt = MathEx.sum(spt, pts[3]);
                        g.beginPath();
                        g.traceQuadratic(spt, dpt, cpt);
                    };
            } break;

            // Linear
            default: {
                if (showSrc && showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        g.beginPath();
                        g.tracePath(spt, dpt);
                        g.traceArrow(spt, dpt);
                        g.traceArrow(dpt, spt);
                    };
                else if (showSrc && !showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        g.beginPath();
                        g.tracePath(spt, dpt);
                        g.traceArrow(dpt, spt);
                    };
                else if (!showSrc && showDst)
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        g.beginPath();
                        g.tracePath(spt, dpt);
                        g.traceArrow(spt, dpt);
                    };
                else
                    this.trace = (g: EditorCanvas) => {
                        const spt = MathEx.sum(src.position, pts[0]);
                        const dpt = MathEx.sum(dst.position, pts[1]);
                        g.beginPath();
                        g.tracePath(spt, dpt);
                    };
            }
        }
    }

    /**
     * `updateDrawSetup`
     *
     *   Updates the `drawSetup` function.
     */
    private updateDrawSetup() {
        switch (this.state) {
            case DrawableStates.Dragging: {
                this.drawSetup = (g: EditorCanvas) => {
                    g.globalAlpha = 0.35;
                    g.strokeColor = this.drawable.color;
                    g.lineWidth = this.drawable.lineWidth;
                    g.lineStyle = this.drawable.lineStyle;
                };
            } break;

            case DrawableStates.Hovered: {
                this.drawSetup = (g: EditorCanvas) => {
                    g.shadowBlur = GRID_SPACING;
                    g.shadowColor = SELECTION_COLOR;
                    g.strokeColor = SELECTION_COLOR;
                    g.lineWidth = this.drawable.lineWidth;
                    g.lineStyle = this.drawable.lineStyle;
                    g.stroke();
                    g.strokeColor = this.drawable.color;
                };
            } break;

            default:
                this.drawSetup = (g: EditorCanvas) => {
                    g.strokeColor = this.drawable.color;
                    g.lineWidth = this.drawable.lineWidth;
                    g.lineStyle = this.drawable.lineStyle;
                };
        }
    }

    /**
     * `updateDrawLabelRect`
     *
     *   Updates the `drawLabelRect` function.
     */
    private updateDrawLabelRect() {
        if (this.textRect.height > 0 && this.textRect.width > 0) {
            const shiftX = this.textRect.width / 2;
            const shiftY = this.textRect.height / 2;
            this.drawLabelRect = (g: EditorCanvas) => {
                const pt = MathEx.sum(this.source.position, this.textRect);
                g.traceRectangle({
                    x: this.textRect.x - shiftX - 3,
                    y: this.textRect.y - shiftY,
                    height: this.textRect.height,
                    width: this.textRect.width + 6
                });
                g.fillColor = "#fff";
                g.fill();
                g.shadowBlur = 0;
                g.stroke();
            };
        }
        else
            this.drawLabelRect = (g: EditorCanvas) => { };
    }

}


// Static functions ////////////////////////////////////////////////////////////


/**
 * `makeStraightPoints`
 *
 *   Generates points for a linear edge.
 */
const makeStraightPoints = (
    src: EditorNode,
    dst: EditorNode,
    bspt: point | null,
    bdpt: point | null
) => {
    const pts: point[] = [];
    if (bspt && bdpt) {
        pts.push(bspt);
        pts.push(bdpt);
    }
    else if (bspt && !bdpt) {
        const v = MathEx.diff(
            MathEx.sum(src.position, bspt),
            dst.position
        );
        pts.push(bspt);
        pts.push(dst.getBoundaryPoint(MathEx.unit(v)));
    }
    else if (!bspt && bdpt) {
        const v = MathEx.diff(
            MathEx.sum(dst.position, bdpt),
            src.position
        );
        pts.push(src.getBoundaryPoint(MathEx.unit(v)));
        pts.push(bdpt);
    }
    else {
        const v = MathEx.diff(dst.position, src.position);
        const u = MathEx.unit(v);
        pts.push(src.getBoundaryPoint(u));
        u.x *= -1;
        u.y *= -1;
        pts.push(dst.getBoundaryPoint(u));
    }
    pts.push(MathEx.diff(
        MathEx.sum(dst.position, pts[1]),
        MathEx.sum(src.position, pts[0])
    ));
    pts[2].x /= 2;
    pts[2].y /= 2;
    return pts;
};

/**
 * `makeQuadraticPoints`
 *
 *   Generates points for a quadratic edge.
 */
const makeQuadraticPoints = (
    src: EditorNode,
    dst: EditorNode,
    bspt: point | null,
    bdpt: point | null
) => {
    // Get the canvas source and destination coordinates.
    let spt = bspt ? MathEx.sum(src.position, bspt) : src.position;
    let dpt = bdpt ? MathEx.sum(dst.position, bdpt) : dst.position;

    // Get the vector and magnitude between the source and destination
    // coordinates.
    let v = MathEx.diff(dpt, spt);
    let d = MathEx.mag(v);

    // Shift the source and destination coordinates.
    spt = bspt ?
        spt :
        MathEx.sum(
            src.position,
            src.getBoundaryPoint({ x: v.x / d, y: v.y / d })
        );
    dpt = bdpt ?
        dpt :
        MathEx.sum(
            dst.position,
            dst.getBoundaryPoint({ x: -v.x / d, y: -v.y / d })
        );

    // Update the vector and magnitude between the source and destination
    // coordinates.
    v = MathEx.diff(dpt, spt);
    d = MathEx.mag(v);

    // Get the control vector and magnitude between the source and destination
    // coordinates.
    let cpt = {
        x: v.x / 2 + v.y / d * GRID_SPACING,
        y: v.y / 2 - v.x / d * GRID_SPACING
    };
    d = MathEx.mag(cpt);

    // Get the control vector in canvas coordinates.
    cpt = MathEx.sum(spt, cpt);

    // Set the source and destination vectors.
    const p0 = bspt ?
        bspt :
        src.getBoundaryPoint(MathEx.unit(MathEx.diff(cpt, src.position)));
    const p2 = bdpt ?
        bdpt :
        dst.getBoundaryPoint(MathEx.unit(MathEx.diff(cpt, dst.position)));

    // Update the source and destination coordinates.
    spt = MathEx.sum(src.position, p0);
    dpt = MathEx.sum(dst.position, p2);

    // Get the midpoint coordinates.
    let mpt = {
        x: (spt.x + 2 * cpt.x + dpt.x) / 4,
        y: (spt.y + 2 * cpt.y + dpt.y) / 4
    };

    // Set the control vector.
    const p1 = MathEx.diff(cpt, spt);

    // Set the midpoint vector.
    const mp = MathEx.diff(mpt, spt);

    return [p0, p2, mp, p1];
};

/**
 * `makeLoopPoints`
 *
 *   Generates points for a cubic loopback edge.
 */
const makeLoopPoints = (
    src: EditorNode,
    dst: EditorNode,
    bspt: point | null,
    bdpt: point | null
) => {
    // Get the source and destination coordinates.
    let spt = bspt ? MathEx.sum(src.position, bspt) : src.position;
    let dpt = bdpt ? MathEx.sum(dst.position, bdpt) : dst.position;

    // Swap the source and destination coordinates if the destination is on the
    // left.
    if (dpt.x < spt.x) {
        const tmp = dpt;
        dpt = spt;
        spt = tmp;
    }

    // Get the control vectors.
    const p1 = {
        x: -2 * GRID_SPACING * MathEx.SIN_22_5,
        y: -2 * GRID_SPACING * MathEx.COS_22_5
    };
    const p2 = {
        x: 2 * GRID_SPACING * MathEx.SIN_22_5,
        y: -2 * GRID_SPACING * MathEx.COS_22_5
    };

    // Get the magnitude of the control vectors.
    let d = MathEx.mag(p1);

    // Get the source and destination vectors.
    const p0 = bspt ? bspt : src.getBoundaryPoint({ x: p1.x / d, y: p1.y / d });
    const p3 = bdpt ? bdpt : dst.getBoundaryPoint({ x: p2.x / d, y: p2.y / d });

    // Get the vector from the source vector to the destination vector.
    let v = MathEx.diff(p3, p0);

    // Get the midpoint vector.
    const mp = {
        x: (3 * (p1.x + p2.x + v.x) + v.x) / 8,
        y: (3 * (p1.y + p2.y + v.y) + v.y) / 8
    };

    // Get the t/3 and 2t/3 vectors.
    const t1 = {
        x: (12 * p1.x + 6 * (p2.x + v.x) + v.x) / 27,
        y: (12 * p1.y + 6 * (p2.y + v.y) + v.y) / 27
    };
    const t2 = {
        x: (6 * p1.x + 12 * (p2.x + v.x) + 8 * v.x) / 27,
        y: (6 * p1.y + 12 * (p2.y + v.y) + 8 * v.y) / 27
    };

    return [p0, p3, mp, t1, t2, p1, p2];
};

/**
 * `hitPtTestLine`
 *
 *   Tests if a point is within the threshold of a straight line segment.
 *
 *   The test is performed by projecting the point onto the line segment, then
 *   calculating the dot product of its rejection vector to determine if the
 *   length of the rejection vector is within the margin.
 */
function hitPtTestLine(
    src: point,
    dst: point,
    pt: point,
    margin: number
): point | null {
    // Edge vector src -> dst
    const ve = MathEx.diff(dst, src);
    // Cursor vector e.src -> cursor
    const vm = MathEx.diff(pt, src);
    const dotee = MathEx.dot(ve, ve); // edge dot edge
    const dotem = MathEx.dot(ve, vm); // edge dot cursor
    // Projection vector cursor -> edge
    const p = {
        x: ve.x * dotem / dotee,
        y: ve.y * dotem / dotee
    };
    // Rejection vector cursor -^ edge
    const r = MathEx.diff(vm, p);

    const dotpp = MathEx.dot(p, p); // proj dot proj
    const dotrr = MathEx.dot(r, r); // rej dot rej

    const dep = MathEx.diff(ve, p);
    const dotdep = MathEx.dot(dep, dep);

    if (dotpp <= dotee && dotdep <= dotee && dotrr < margin)
        return (dotpp < dotee / 4 ? src : dst);
    return null;
}

/**
 * `hitRectTestStraighEdge`
 *
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

/**
 * `inside`
 *
 *   Tests whether the given point is inside a rectangle.
 */
const inside
    = (p: point, left: number, top: number, right: number, bottom: number) => {
        return (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom);
    };
