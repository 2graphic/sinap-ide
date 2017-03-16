// File: graph-editor-node.ts
// Created by: CJ Dimaano
// Date created: March 11, 2017


import {
    FONT_SIZE,
    NODE_THRESHOLD_IN,
    NODE_THRESHOLD_OUT,
    GRID_SPACING,
    SELECTION_COLOR,
    NODE_DRAG_SHADOW_COLOR
} from "./defaults";
import { PropertyChangedEvent } from "./events";
import { IMAGES, GraphEditorCanvas, point, size, rect } from "./graph-editor-canvas";
import { GraphEditorElement, DrawableStates } from "./graph-editor-element";
import { GraphEditorEdge } from "./graph-editor-edge";
import { DrawableGraph } from "./drawable-graph";
import { DrawableNode } from "./drawable-node";
import { DrawableEdge } from "./drawable-edge";
import * as MathEx from "./math";


export class GraphEditorNode extends GraphEditorElement<DrawableNode> {
    constructor(drawable: DrawableNode) {
        super(drawable);
        this.clearAnchor();
        this.innerBound = {
            height: drawable.size.height - NODE_THRESHOLD_IN,
            width: drawable.size.width - NODE_THRESHOLD_IN
        };
        this.outerBound = {
            height: drawable.size.height + NODE_THRESHOLD_OUT,
            width: drawable.size.width + NODE_THRESHOLD_OUT
        };
        this.position = {
            x: drawable.position.x,
            y: drawable.position.y
        };
        drawable.addEventListener("change", this.onDrawableChange);
        this.updateTrace();
        this.updateStroke();
        this.updateFill();
        this.updateShadow();
    }

    private readonly _position: point
    = { x: 0, y: 0 };

    private _anchor: point;

    private innerBound: size;

    private outerBound: size;

    private trace = (g: GraphEditorCanvas) => { };

    private stroke = (g: GraphEditorCanvas, extraLineWidth: number = 0) => { };

    private fill = (g: GraphEditorCanvas) => { };

    private shadow = (g: GraphEditorCanvas) => { };

    private drawAnchor = (g: GraphEditorCanvas) => { };

    /**
     * incomingEdges
     *
     *   Gets the set of edges whose destination node is this node.
     */
    readonly incomingEdges: Set<GraphEditorEdge>
    = new Set<GraphEditorEdge>();

    /**
     * outgoingEdges
     *
     *   Gets the set of edges whose source node is this node.
     */
    readonly outgoingEdges: Set<GraphEditorEdge>
    = new Set<GraphEditorEdge>();

    /**
     * edges
     *
     *   Gets the set of edges connected to this node.
     */
    get edges() {
        return new Set<GraphEditorEdge>([...this.incomingEdges, ...this.outgoingEdges]);
    }

    /**
     * anchor
     *
     *   Gets or sets the visible anchor point.
     */
    get anchor() {
        return this._anchor;
    }

    set anchor(value: point) {
        this._anchor = value;
        this.updateAnchor();
    }

    get position() {
        return this._position;
    }

    set position(value: point) {
        this._position.x = value.x;
        this._position.y = value.y;
        this.textRect.x = value.x;
        this.textRect.y = value.y;
    }

    set isDragging(value: boolean) {
        super.isDragging = value;
        if (!value)
            this.drawable.position = this.position;
        this.updateShadow();
    }

    set isHovered(value: boolean) {
        super.isHovered = value;
        this.updateShadow();
    }

    /**
     * isHidden
     *   Gets whether or not this node is hidden.
     */
    get isHidden() {
        return this instanceof HiddenNode;
    }

    /**
     * isAnchorVisible
     *   Gets whether or not the anchor point should be visible.
     */
    get isAnchorVisible() {
        return this._anchor !== this.drawable.origin;
    }

    /**
     * drawShadow
     *
     *   Draws the selection shadow on a given canvas.
     */
    drawHighlight(g: GraphEditorCanvas) {
        this.trace(g);
        this.stroke(g, 6);
    }

    /**
     * drawText
     *
     *   Draws the label on a given canvas.
     */
    drawText(g: GraphEditorCanvas) {
        const x = this.textRect.x;
        let y = this.textRect.y - (this.textRect.height - 1.5 * FONT_SIZE) / 2;
        g.fillColor = "#fff";
        g.strokeColor = "#000";
        g.lineWidth = 2;
        this.lines.forEach(l => {
            g.strokeText(l, x, y);
            g.fillText(l, x, y);
            y += 1.5 * FONT_SIZE;
        });
    }

    /**
     * draw
     *
     *   Draws the element on a given canvas.
     */
    draw(g: GraphEditorCanvas) {
        this.trace(g);
        this.shadow(g);
        this.fill(g);
        this.stroke(g);
        this.drawText(g);
        this.drawAnchor(g);
    }

    /**
     * update
     *
     *   Updates the element for a given canvas.
     */
    update(g: GraphEditorCanvas) {
        // Update the node dimensions.
        this.updateTextSize(g);
        const drawable = this.drawable;
        const textRect = this.textRect;
        if (drawable.shape === "image") {
            const img = IMAGES.get(drawable.image) !;
            drawable.size = {
                height: img.height,
                width: img.width
            };
        }
        else {
            // TODO:
            // Do we want dynamically sized nodes?
            drawable.size = {
                height: Math.max(GRID_SPACING, textRect.height + 1.5 * FONT_SIZE),
                width: Math.max(GRID_SPACING, textRect.width + FONT_SIZE)
            };
        }
        this.innerBound.height = drawable.size.height - 2 * NODE_THRESHOLD_IN;
        this.innerBound.width = drawable.size.width - 2 * NODE_THRESHOLD_IN;
        this.outerBound.height = drawable.size.height + 2 * NODE_THRESHOLD_OUT;
        this.outerBound.width = drawable.size.width + 2 * NODE_THRESHOLD_OUT;
        for (const e of this.edges)
            e.update(g);
    }

    private updateTrace() {
        const drawable = this.drawable;
        switch (this.drawable.shape) {
            case "circle":
                drawable.size.height = Math.max(drawable.size.height, drawable.size.width);
                drawable.size.width = Math.max(drawable.size.height, drawable.size.width);
            case "ellipse": {
                this.trace = (g: GraphEditorCanvas) => {
                    const r = { x: drawable.size.width / 2, y: drawable.size.height / 2 };
                    g.traceEllipse(MathEx.diff(this._position, this.drawable.origin), r.x, r.y);
                };
            } break;

            case "square":
                drawable.size.height = Math.max(drawable.size.height, drawable.size.width);
                drawable.size.width = Math.max(drawable.size.height, drawable.size.width);
            case "rectangle": {
                this.trace = (g: GraphEditorCanvas) => {
                    const pt = MathEx.diff(this._position, this.drawable.origin);
                    g.traceRectangle({
                        x: pt.x - drawable.size.width / 2, y: pt.y - drawable.size.height / 2,
                        height: drawable.size.height, width: drawable.size.width
                    });
                };
            } break;

            case "image": {
                switch (this.state) {
                    case DrawableStates.Dragging: {
                        this.trace = (g: GraphEditorCanvas) => {
                            const pt = MathEx.diff(this._position, drawable.origin);
                            g.shadowBlur = GRID_SPACING;
                            g.shadowColor = NODE_DRAG_SHADOW_COLOR;
                            g.drawImage(pt, drawable.image);
                            g.shadowBlur = 0;
                        };
                    } break;

                    case DrawableStates.Hovered: {
                        this.trace = (g: GraphEditorCanvas) => {
                            const pt = MathEx.diff(this._position, drawable.origin);
                            g.shadowBlur = GRID_SPACING;
                            g.shadowColor = SELECTION_COLOR;
                            g.drawImage(pt, drawable.image);
                            g.shadowBlur = 0;
                        };
                    } break;

                    default:
                        this.trace = (g: GraphEditorCanvas) => {
                            const pt = MathEx.diff(this._position, drawable.origin);
                            g.drawImage(pt, drawable.image);
                        };
                }
            } break;
        }
    }

    private updateStroke() {
        const drawable = this.drawable;
        if (drawable.shape === "image" || drawable.borderWidth === 0)
            this.stroke = (g: GraphEditorCanvas, extraLineWidth: number = 0) => { };
        else
            this.stroke = (g: GraphEditorCanvas, extraLineWidth: number = 0) => {
                g.lineWidth = this.drawable.borderWidth + extraLineWidth;
                g.lineStyle = this.drawable.borderStyle;
                g.strokeColor = this.drawable.borderColor;
                g.stroke();
            };
    }

    private updateFill() {
        const drawable = this.drawable;
        if (drawable.shape === "image")
            this.fill = (g: GraphEditorCanvas) => { };
        else {
            this.fill = (g: GraphEditorCanvas) => {
                g.fillColor = this.drawable.color;
                g.fill();
            };
        }
    }

    private updateShadow() {
        if (this.drawable.shape === "image") {
            this.shadow = (g: GraphEditorCanvas) => { };
            this.updateTrace();
        }
        else {
            switch (this.state) {
                case DrawableStates.Dragging: {
                    this.shadow = (g: GraphEditorCanvas) => {
                        g.shadowBlur = GRID_SPACING;
                        g.shadowColor = NODE_DRAG_SHADOW_COLOR;
                        g.strokeColor = NODE_DRAG_SHADOW_COLOR;
                        g.lineWidth = this.drawable.borderWidth;
                        g.stroke();
                        g.stroke();
                        g.shadowBlur = 0;
                    };
                } break;

                case DrawableStates.Hovered: {
                    this.shadow = (g: GraphEditorCanvas) => {
                        g.shadowBlur = GRID_SPACING;
                        g.shadowColor = SELECTION_COLOR;
                        g.strokeColor = SELECTION_COLOR;
                        g.lineWidth = this.drawable.borderWidth;
                        g.stroke();
                        g.stroke();
                        g.shadowBlur = 0;
                    };
                } break;

                default:
                    this.shadow = (g: GraphEditorCanvas) => { };
            }
        }
    }

    private updateAnchor() {
        if (this.isAnchorVisible)
            this.drawAnchor = (g: GraphEditorCanvas) => {
                // const position = MathEx.sum(this._position, this.drawable.origin);
                g.traceEllipse(MathEx.sum(this._position, this._anchor), 5, 5);
                g.fillColor = "#fff";
                g.strokeColor = "#000";
                g.lineWidth = 1;
                g.fill();
                g.stroke();
            };
        else
            this.drawAnchor = (g: GraphEditorCanvas) => { };
    }

    /**
     * hitPoint
     *
     *   Tests whether a given point is within the element region.
     *
     * @returns
     *   An anchor point if the given point is within the threshold of the node;
     *   otherwise, null.
     */
    hitPoint(pt: point): point | null {
        const inner = this.innerBound;
        const outer = this.outerBound;
        const apts = this.drawable.anchorPoints;
        const v = MathEx.diff(pt, this._position);
        if (apts.length > 0) {
            const d = NODE_THRESHOLD_OUT - NODE_THRESHOLD_IN;
            const apt = this.getNearestAnchor(v);
            if (apt !== this.drawable.origin) {
                const u = MathEx.diff(v, apt);
                if (MathEx.dot(u, u) <= d * d)
                    return apt;
            }
        }
        switch (this.drawable.shape) {
            case "circle":
            case "ellipse": {
                const u = {
                    x: v.x / (inner.width / 2),
                    y: v.y / (inner.height / 2)
                };
                let dot = MathEx.dot(u, u);
                if (dot < 1)
                    return this.drawable.origin;
                u.x = v.x / (outer.width / 2);
                u.y = v.y / (outer.height / 2);
                dot = MathEx.dot(u, u);
                if (apts.length === 0 && dot <= 1) {
                    const d = MathEx.mag(v);
                    return this.getBoundaryPoint({ x: v.x / d, y: v.y / d });
                }
            } break;

            case "image":
            case "square":
            case "rectangle": {
                const ax = Math.abs(v.x);
                const ay = Math.abs(v.y);
                if (ax < inner.width / 2 && ay < inner.height / 2)
                    return this.drawable.origin;
                if (apts.length === 0 && ax <= outer.width / 2 && ay <= outer.height / 2) {
                    const d = MathEx.mag(v);
                    return this.getBoundaryPoint({ x: v.x / d, y: v.y / d });
                }
            } break;
        }
        return null;
    }

    /**
     * hitRect
     *
     *   Tests whether the element is hit by a rectangle.
     */
    hitRect(r: rect): boolean {
        const posn = this._position;
        const size = this.drawable.size;
        const L = r.x - size.width;
        const R = r.x + r.width + size.width;
        const T = r.y - size.height;
        const B = r.y + r.height + size.height;
        return (posn.x >= L && posn.x <= R &&
            posn.y >= T && posn.y <= B);
    }

    /**
     * clearAnchor
     *   Clears the anchor visibility.
     */
    clearAnchor() {
        this.anchor = this.drawable.origin;
    }

    /**
     * getNearestAnchor
     *
     *   Gets the nearest anchor vector or the origin vector of the node if
     *   there are no predefined anchor vectors from the vector relative to the
     *   node position.
     */
    getNearestAnchor(pt: point) {
        let apt = this.drawable.origin;
        let min = Infinity;
        this.drawable.anchorPoints.forEach(a => {
            const v = MathEx.diff(pt, a);
            let dot = MathEx.dot(v, v);
            if (dot <= min) {
                min = dot;
                apt = a;
            }
        });
        return apt;
    }

    /**
     * getBoundaryPoint
     *
     *   Gets the vector in the direction of `u` that is on the boundary of a
     *   node based on its geometry relative to its position.
     */
    getBoundaryPoint(u: point) {
        const v: point = { x: 0, y: 0 };
        const sz = this.drawable.size;
        const border = this.drawable.borderWidth / 2;

        switch (this.drawable.shape) {
            case "circle":
            case "ellipse": {
                v.x = u.x * sz.width / 2 + border;
                v.y = u.y * sz.height / 2 + border;
            } break;

            // The boundary of a rectangle depends on the direction of u.
            case "image":
            case "square":
            case "rectangle": {
                const up = {
                    x: (u.x < 0 ? -u.x : u.x),
                    y: (u.y < 0 ? -u.y : u.y)
                };
                const h = sz.height / 2 + border;
                const w = sz.width / 2 + border;
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
        return v;
    }

    private onDrawableChange
    = (evt: PropertyChangedEvent<any>) => {
        switch (evt.detail.key) {
            case "shape": {
                this.updateTrace();
                this.updateStroke();
                this.updateFill();
                this.updateShadow();
            } break;

            case "position": {
                this.position = evt.detail.curr;
            } break;
        }
    }

}


/**
 * HiddenNode
 *   Creates an invisible drawable node.
 */
class HiddenNode extends GraphEditorNode {

    constructor(g: DrawableGraph) {
        super(new DrawableNode(g));
    }

    update(g: GraphEditorCanvas) { }

    drawHighlight(g: GraphEditorCanvas) { }
    draw(g: GraphEditorCanvas) { }

    getBoundaryPoint(u: point) {
        return this.drawable.origin;
    }
}

export const HIDDEN_NODE = new HiddenNode(new DrawableGraph(() => true));
