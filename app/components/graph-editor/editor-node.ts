/**
 * @file `editor-node.ts`
 *   Created on March 11, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


import {
    FONT_SIZE,
    NODE_THRESHOLD_IN,
    NODE_THRESHOLD_OUT,
    GRID_SPACING,
    SELECTION_COLOR,
    NODE_DRAG_SHADOW_COLOR
} from "./defaults";
import { PropertyChangedEvent } from "./events";
import { IMAGES, EditorCanvas, point, size, rect } from "./editor-canvas";
import { EditorElement, DrawableStates } from "./editor-element";
import { EditorEdge } from "./editor-edge";
import { DrawableGraph } from "./drawable-graph";
import { DrawableNode } from "./drawable-node";
import { DrawableEdge } from "./drawable-edge";
import * as MathEx from "./math";


/**
 * `EditorNode`
 *
 *   Provides draw, hit, and update logic for drawable nodes.
 *
 * @extends EditorElement
 */
export class EditorNode extends EditorElement<DrawableNode> {
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
        this.updateHighlight();
    }


    // Private fields //////////////////////////////////////////////////////////


    private readonly _position: point
    = { x: 0, y: 0 };

    private _anchor: point;

    private innerBound: size;

    private outerBound: size;

    private trace = (g: EditorCanvas) => { };

    private stroke = (g: EditorCanvas, extraLineWidth: number = 0) => { };

    private fill = (g: EditorCanvas) => { };

    private shadow = (g: EditorCanvas) => { };

    private drawAnchor = (g: EditorCanvas) => { };

    private _drawHighlight = (g: EditorCanvas) => { };


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * `incomingEdges`
     *
     *   Gets the set of edges whose destination node is this node.
     */
    readonly incomingEdges: Set<EditorEdge>
    = new Set<EditorEdge>();

    /**
     * `outgoingEdges`
     *
     *   Gets the set of edges whose source node is this node.
     */
    readonly outgoingEdges: Set<EditorEdge>
    = new Set<EditorEdge>();

    /**
     * `edges`
     *
     *   Gets the set of edges connected to this node.
     */
    get edges() {
        return new Set<EditorEdge>(
            [...this.incomingEdges, ...this.outgoingEdges]
        );
    }

    /**
     * `anchor`
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

    /**
     * `position`
     *
     *   Gets or sets the node position.
     *
     *   The backing drawable node is not actually updated by setting this
     *   property. It is updated when `isDragging` is set to false.
     */
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
     * `isHidden`
     *
     *   Gets whether or not this node is hidden.
     */
    get isHidden() {
        return this instanceof HiddenNode;
    }

    /**
     * `isAnchorVisible`
     *
     *   Gets whether or not the anchor point should be visible.
     */
    get isAnchorVisible() {
        return this._anchor !== this.drawable.origin;
    }

    drawHighlight(g: EditorCanvas) {
        this._drawHighlight(g);
    }

    /**
     * `drawText`
     *
     *   Draws the label on a given canvas.
     */
    drawText(g: EditorCanvas) {
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

    draw(g: EditorCanvas) {
        this.trace(g);
        this.shadow(g);
        this.fill(g);
        this.stroke(g);
        this.drawText(g);
        this.drawAnchor(g);
    }

    update(g: EditorCanvas) {
        // Update the node dimensions.
        this.updateTextSize(g);
        const drawable = this.drawable;
        const textRect = this.textRect;
        if (drawable.shape === "image") {
            const img = IMAGES.get(drawable.image)!;
            drawable.size = {
                height: img.height,
                width: img.width
            };
        }
        else {
            // TODO:
            // Do we want dynamically sized nodes?
            drawable.size = {
                height: Math
                    .max(GRID_SPACING, textRect.height + 1.5 * FONT_SIZE),
                width: Math
                    .max(GRID_SPACING, textRect.width + FONT_SIZE)
            };
        }
        this.innerBound.height = drawable.size.height - 2 * NODE_THRESHOLD_IN;
        this.innerBound.width = drawable.size.width - 2 * NODE_THRESHOLD_IN;
        this.outerBound.height = drawable.size.height + 2 * NODE_THRESHOLD_OUT;
        this.outerBound.width = drawable.size.width + 2 * NODE_THRESHOLD_OUT;
        for (const e of this.edges)
            e.update(g);
    }

    /**
     * `updateTrace`
     *
     *   Updates the trace function.
     */
    private updateTrace() {
        const drawable = this.drawable;
        switch (this.drawable.shape) {
            case "circle":
                drawable.size.height = Math
                    .max(drawable.size.height, drawable.size.width);
                drawable.size.width = Math
                    .max(drawable.size.height, drawable.size.width);
            case "ellipse": {
                this.trace = (g: EditorCanvas) => {
                    const r = {
                        x: drawable.size.width / 2,
                        y: drawable.size.height / 2
                    };
                    g.traceEllipse(
                        MathEx.diff(this._position, this.drawable.origin),
                        r.x,
                        r.y
                    );
                };
            } break;

            case "square":
                drawable.size.height = Math
                    .max(drawable.size.height, drawable.size.width);
                drawable.size.width = Math
                    .max(drawable.size.height, drawable.size.width);
            case "rectangle": {
                this.trace = (g: EditorCanvas) => {
                    const pt = MathEx
                        .diff(this._position, this.drawable.origin);
                    g.traceRectangle({
                        x: pt.x - drawable.size.width / 2,
                        y: pt.y - drawable.size.height / 2,
                        height: drawable.size.height,
                        width: drawable.size.width
                    });
                };
            } break;

            case "image": {
                switch (this.state) {
                    case DrawableStates.Dragging: {
                        this.trace = (g: EditorCanvas) => {
                            const pt = MathEx
                                .diff(this._position, drawable.origin);
                            g.shadowBlur = GRID_SPACING;
                            g.shadowColor = NODE_DRAG_SHADOW_COLOR;
                            g.drawImage(pt, drawable.image);
                            g.shadowBlur = 0;
                        };
                    } break;

                    case DrawableStates.Hovered: {
                        this.trace = (g: EditorCanvas) => {
                            const pt = MathEx
                                .diff(this._position, drawable.origin);
                            g.shadowBlur = GRID_SPACING;
                            g.shadowColor = SELECTION_COLOR;
                            g.drawImage(pt, drawable.image);
                            g.shadowBlur = 0;
                        };
                    } break;

                    default:
                        this.trace = (g: EditorCanvas) => {
                            const pt = MathEx
                                .diff(this._position, drawable.origin);
                            g.drawImage(pt, drawable.image);
                        };
                }
            } break;
        }
    }

    /**
     * `updateStroke`
     *
     *   Updates the stroke function.
     */
    private updateStroke() {
        const drawable = this.drawable;
        if (drawable.shape === "image" || drawable.borderWidth === 0)
            this.stroke = (g: EditorCanvas, extraLineWidth: number = 0) => { };
        else
            this.stroke = (g: EditorCanvas, extraLineWidth: number = 0) => {
                g.lineWidth = this.drawable.borderWidth + extraLineWidth;
                g.lineStyle = this.drawable.borderStyle;
                g.strokeColor = this.drawable.borderColor;
                g.stroke();
            };
    }

    /**
     * `updateFill`
     *
     *   Updates the fill function.
     */
    private updateFill() {
        const drawable = this.drawable;
        if (drawable.shape === "image")
            this.fill = (g: EditorCanvas) => { };
        else {
            this.fill = (g: EditorCanvas) => {
                g.fillColor = this.drawable.color;
                g.fill();
            };
        }
    }

    /**
     * `updateShadow`
     *
     *   Updates the shadow function.
     */
    private updateShadow() {
        if (this.drawable.shape === "image") {
            this.shadow = (g: EditorCanvas) => { };
            this.updateTrace();
        }
        else {
            switch (this.state) {
                case DrawableStates.Dragging: {
                    this.shadow = (g: EditorCanvas) => {
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
                    this.shadow = (g: EditorCanvas) => {
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
                    this.shadow = (g: EditorCanvas) => { };
            }
        }
    }

    /**
     * `updateHighlight`
     *
     *   Updates the draw highlight function.
     *
     * @private
     *
     * @memberOf EditorNode
     */
    private updateHighlight() {
        if (this.drawable.shape === "image") {
            const posn = this.drawable.position;
            const offsets = [
                -2, -2,
                0, -2,
                2, -2,
                -2, 0,
                2, 0,
                -2, 2,
                0, 2,
                2, 2
            ];
            this._drawHighlight = (g: EditorCanvas) => {
                for (let i = 0; i < offsets.length; i += 2) {
                    const opt = {
                        x: posn.x + offsets[i],
                        y: posn.y + offsets[i + 1]
                    };
                    g.drawImage(opt, this.drawable.image);
                }
            };
        }
        else {
            this._drawHighlight = (g: EditorCanvas) => {
                this.trace(g);
                this.stroke(g, 6);
            };
        }
    }

    /**
     * `updateAnchor`
     *
     *   Updates the drawAnchor function.
     */
    private updateAnchor() {
        if (this.isAnchorVisible)
            this.drawAnchor = (g: EditorCanvas) => {
                g.traceEllipse(MathEx.sum(this._position, this._anchor), 5, 5);
                g.fillColor = "#fff";
                g.strokeColor = "#000";
                g.lineWidth = 1;
                g.fill();
                g.stroke();
            };
        else
            this.drawAnchor = (g: EditorCanvas) => { };
    }

    /**
     * `hitPoint`
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
                if (apts.length === 0 &&
                    ax <= outer.width / 2 &&
                    ay <= outer.height / 2) {
                    const d = MathEx.mag(v);
                    return this.getBoundaryPoint({ x: v.x / d, y: v.y / d });
                }
            } break;
        }
        return null;
    }

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
     * `clearAnchor`
     *
     *   Clears the anchor visibility.
     */
    clearAnchor() {
        this.anchor = this.drawable.origin;
    }

    /**
     * `getNearestAnchor`
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
            if (dot < min) {
                min = dot;
                apt = a;
            }
        });
        return apt;
    }

    /**
     * `getBoundaryPoint`
     *
     *   Gets the vector in the direction of `u` that is on the boundary of a
     *   node based on its geometry relative to its position.
     *
     * @param u
     *   The unit vector poiting away from the node origin.
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

    /**
     * `onDrawableChange`
     *
     *   Handles change events from the drawable node.
     */
    private onDrawableChange
    = (evt: PropertyChangedEvent<any>) => {
        switch (evt.detail.key) {
            case "shape": {
                this.updateTrace();
                this.updateStroke();
                this.updateFill();
                this.updateShadow();
                this.updateHighlight();
            } break;

            case "position": {
                this.position = evt.detail.curr;
            } break;
        }
    }

}


/**
 * `HiddenNode`
 *
 *   Creates an invisible drawable node.
 */
class HiddenNode extends EditorNode {

    constructor(g: DrawableGraph) {
        super(new DrawableNode(g));
    }

    update(g: EditorCanvas) { }

    drawHighlight(g: EditorCanvas) { }
    draw(g: EditorCanvas) { }

    getBoundaryPoint(u: point) {
        return this.drawable.origin;
    }
}

/**
 * `HIDDEN_NODE`
 *
 *   The hidden drawable node. This is used primarily for dragging the endpoint
 *   of an edge.
 */
export const HIDDEN_NODE = new HiddenNode(new DrawableGraph(() => true));
