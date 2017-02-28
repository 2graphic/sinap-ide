// File: graph-editor-canvas.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016


import * as DEFAULT from "./defaults";
import * as MathEx from "./math";


/**
 * AA_SCALE
 *   Anti-aliasing scale.
 */
const AA_SCALE: number = 2;


// Type Aliases ////////////////////////////////////////////////////////////////


/**
 * CompositeOperations
 *   @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
 */
export type CompositeOperations =
    "source-over" |
    "source-in" |
    "source-out" |
    "source-atop" |
    "destination-over" |
    "destination-in" |
    "destination-out" |
    "destination-atop" |
    "lighter" |
    "copy" |
    "xor" |
    "multiply" |
    "screen" |
    "overlay" |
    "darken" |
    "lighten" |
    "color-dodge" |
    "color-burn" |
    "hard-light" |
    "soft-light" |
    "difference" |
    "exclusion" |
    "hue" |
    "saturation" |
    "color" |
    "luminosity";

/**
 * LineStyles
 */
export type LineStyles = "solid" | "dotted" | "dashed" | "double";

/**
 * Shapes
 */
export type Shapes = "circle" | "square" | "image";

/**
 * point
 *   Represents a coordinate.
 */
export type point = { x: number, y: number };

/**
 * size
 *   Represents rectangle dimensions.
 */
export type size = { h: number, w: number };

/**
 * rect
 *   Represents a rectangle with the top-left coordinate and height and width.
 */
export type rect = point & size;


// Cached images ///////////////////////////////////////////////////////////////


/**
 * IMAGES
 *   Contains a map of cached images.
 */
export const IMAGES = new Map<string, HTMLImageElement>();


// GraphEditorCanvas ///////////////////////////////////////////////////////////


/**
 * GraphEditorCanvas
 *   Object that handles all of the drawing logic of the graph editor.
 */
export class GraphEditorCanvas {
    constructor(private g: CanvasRenderingContext2D) {
        // These probably do nothing.
        this.g.mozImageSmoothingEnabled = true;
        this.g.msImageSmoothingEnabled = true;
        this.g.oImageSmoothingEnabled = true;
    }


    // Fields //////////////////////////////////////////////////////////////////


    /**
     * _scale
     *   Scaling factor of the canvas.
     */
    private _scale: number = AA_SCALE;

    /**
     * _origin
     *   The coordinates of the canvas origin.
     */
    private _origin: point = { x: 0, y: 0 };


    // Trace methods ///////////////////////////////////////////////////////////


    /**
     * tracePath
     *   Traces line segments from point to point of the given points.
     */
    tracePath(...pts: point[]) {
        this.g.moveTo(pts[0].x + this.origin.x, pts[0].y + this.origin.y);
        for (let i = 1; i < pts.length; i++)
            this.g.lineTo(pts[i].x + this.origin.x, pts[i].y + this.origin.y);
    }

    /**
     * traceQuadratic
     *   Traces a quadratic Bezier curve.
     */
    traceQuadratic(start: point, end: point, control: point) {
        this.g.moveTo(start.x + this.origin.x, start.y + this.origin.y);
        this.g.quadraticCurveTo(
            control.x + this.origin.x, control.y + this.origin.y,
            end.x + this.origin.x, end.y + this.origin.y
        );
    }

    /**
     * traceCubic
     *   Traces a cubic Bezier curve.
     */
    traceCubic(start: point, end: point, control1: point, control2: point) {
        this.g.moveTo(start.x + this.origin.x, start.y + this.origin.y);
        this.g.bezierCurveTo(
            control1.x + this.origin.x, control1.y + this.origin.y,
            control2.x + this.origin.x, control2.y + this.origin.y,
            end.x + this.origin.x, end.y + this.origin.y
        );
    }

    /**
     * traceRect
     *   Traces a rectangle.
     */
    traceRect(rect: rect) {
        this.g.beginPath();
        this.tracePath(
            { x: rect.x, y: rect.y },
            { x: rect.x + rect.w, y: rect.y },
            { x: rect.x + rect.w, y: rect.y + rect.h },
            { x: rect.x, y: rect.y + rect.h }
        );
        this.g.closePath();
    }

    /**
     * traceCircle
     *   Traces a circle.
     */
    traceCircle(origin: point, radius: number) {
        this.g.beginPath();
        this.g.arc(
            origin.x + this.origin.x, origin.y + this.origin.y,
            radius,
            0, 2 * Math.PI
        );
    }

    /**
     * traceArrow
     *   Traces an arrow towards the destination point.
     *
     *   The arrow is traced by computing the unit vector from the given source
     *   and destination points and rotating, scaling, and translating the unit
     *   vector before tracing the left and right sides of the arrow.
     */
    traceArrow(
        src: point,
        dst: point
    ): void {
        // Get the unit vector from the source point to the destination point.
        const v: point = {
            x: dst.x - src.x,
            y: dst.y - src.y
        };
        const d = MathEx.mag(v);
        const u = { x: v.x / d, y: v.y / d };

        // Trace arrow.
        this.tracePath(
            {
                x: dst.x + DEFAULT.GRID_SPACING * (u.x * MathEx.COS_150 - u.y * MathEx.SIN_150) / 2,
                y: dst.y + DEFAULT.GRID_SPACING * (u.x * MathEx.SIN_150 + u.y * MathEx.COS_150) / 2
            },
            dst,
            {
                x: dst.x + DEFAULT.GRID_SPACING * (u.x * MathEx.COS_150 + u.y * MathEx.SIN_150) / 2,
                y: dst.y + DEFAULT.GRID_SPACING * (-u.x * MathEx.SIN_150 + u.y * MathEx.COS_150) / 2
            }
        );

    }


    // Draw methods ////////////////////////////////////////////////////////////


    /**
     * clear
     *   Clears the canvas.
     */
    clear(bgColor?: string): void {
        const canvas = this.g.canvas;
        if (bgColor) {
            this.g.fillStyle = bgColor;
            this.g.fillRect(0, 0, canvas.width / this._scale, canvas.height / this._scale);
        }
        else {
            this.g.clearRect(0, 0, canvas.width / this._scale, canvas.height / this._scale);
        }
    }

    /**
     * drawSelectionBox
     *   Draws the selection box.
     */
    drawSelectionBox(rect: rect): void {
        this.traceRect(rect);
        this.g.strokeStyle = DEFAULT.SELECTION_COLOR;
        this.g.fillStyle = DEFAULT.SELECTION_COLOR;
        this.g.globalAlpha = 0.1;
        this.g.fill();
        this.g.globalAlpha = 1.0;
        this.g.lineWidth = 1;
        this.lineStyle = { style: "solid" };
        this.g.stroke();
    }

    /**
     * drawCircle
     *   Draws a circle.
     */
    drawCircle(
        o: point,
        r: number,
        borderStyle: string,
        borderWidth: number,
        borderColor: string,
        fillColor: string,
        shadowColor?: string
    ) {
        this.traceCircle(o, r);
        this.g.fillStyle = fillColor;
        if (shadowColor) {
            this.shadowBlur = 20;
            this.g.shadowColor = shadowColor;
        }
        this.g.fill();
        this.shadowBlur = 0;
        if (borderWidth > 0) {
            this.lineStyle = { style: borderStyle, dotSize: borderWidth };
            this.g.lineWidth = borderWidth;
            this.g.strokeStyle = borderColor;
            this.g.stroke();
        }
    }

    /**
     * drawSquare
     *   Draws a square.
     */
    drawSquare(
        p: point,
        s: number,
        borderStyle: string,
        borderWidth: number,
        borderColor: string,
        fillColor: string,
        shadowColor?: string
    ) {
        this.traceRect({ x: p.x - s / 2, y: p.y - s / 2, h: s, w: s });
        this.g.fillStyle = fillColor;
        if (shadowColor) {
            this.shadowBlur = 20;
            this.g.shadowColor = shadowColor;
        }
        this.g.fill();
        this.shadowBlur = 0;
        if (borderWidth > 0) {
            this.lineStyle = { style: borderStyle, dotSize: borderWidth };
            this.g.lineWidth = borderWidth;
            this.g.strokeStyle = borderColor;
            this.g.stroke();
        }
    }

    /**
     * drawImage
     *   Draws an image.
     */
    drawImage(p: point, img: HTMLImageElement, shadowColor?: string) {
        if (shadowColor) {
            this.shadowBlur = 20;
            this.g.shadowColor = shadowColor;
        }
        this.g.drawImage(
            img,
            this._origin.x + p.x - img.width / 2,
            this._origin.y + p.y - img.height / 2
        );
        this.shadowBlur = 0;
    }

    /**
     * drawGrid
     *   Draws the editor grid.
     */
    drawGrid() {

        const w = this.g.canvas.width / this._scale;
        const h = this.g.canvas.height / this._scale;

        const o = {
            x: this.origin.x % DEFAULT.GRID_SPACING - DEFAULT.GRID_SPACING,
            y: this.origin.y % DEFAULT.GRID_SPACING - DEFAULT.GRID_SPACING
        };

        // Major grid.
        this.g.strokeStyle = DEFAULT.GRID_MAJOR_COLOR;
        this.g.lineWidth = DEFAULT.GRID_MAJOR_WIDTH;
        this.lineStyle = { style: DEFAULT.GRID_MAJOR_STYLE };
        this.drawGridLines(o, h, w);

        // Minor grid.
        this.g.strokeStyle = DEFAULT.GRID_MINOR_COLOR;
        this.g.lineWidth = DEFAULT.GRID_MINOR_WIDTH;
        this.lineStyle = { style: DEFAULT.GRID_MINOR_STYLE };
        o.x += DEFAULT.GRID_MINOR_OFFSET;
        o.y += DEFAULT.GRID_MINOR_OFFSET;
        this.drawGridLines(o, h, w);

    }

    /**
     * drawGridLines
     *   Draws a bunch of evenly-spaced grid lines.
     */
    private drawGridLines(o: point, h: number, w: number) {
        for (let x = o.x; x < w + DEFAULT.GRID_SPACING; x += DEFAULT.GRID_SPACING) {
            this.g.beginPath();
            this.g.moveTo(x, 0);
            this.g.lineTo(x, h);
            this.g.stroke();
        }
        for (let y = o.y; y < h + DEFAULT.GRID_SPACING; y += DEFAULT.GRID_SPACING) {
            this.g.beginPath();
            this.g.moveTo(0, y);
            this.g.lineTo(w, y);
            this.g.stroke();
        }
    }

    /**
     * drawText
     *   Draws text.
     */
    drawText(
        p: point,
        height: number,
        lines: Array<string>,
        color: string,
        borderWidth?: number,
        borderColor?: string
    ) {
        const x = p.x + this.origin.x;
        let y = p.y + this.origin.y - (height - 1.5 * DEFAULT.FONT_SIZE) / 2;
        this.g.font = DEFAULT.FONT_SIZE + "pt " + DEFAULT.FONT_FAMILY;
        this.g.textAlign = "center";
        this.g.textBaseline = "middle";
        this.g.fillStyle = color;
        if (borderWidth && borderColor) {
            this.g.lineWidth = 2;
            this.g.strokeStyle = "#000";
            this.lineStyle = { style: "solid" };
            for (let l = 0; l < lines.length; l++) {
                this.g.strokeText(lines[l], x, y);
                this.g.fillText(lines[l], x, y);
                y += 1.5 * DEFAULT.FONT_SIZE;
            }
        }
        else {
            for (let l = 0; l < lines.length; l++) {
                this.g.fillText(lines[l], x, y);
                y += 1.5 * DEFAULT.FONT_SIZE;
            }
        }
    }


    // Get and Set methods /////////////////////////////////////////////////////


    /**
     * size
     *   Gets or sets the size dimensions of the canvas.
     */
    get size() {
        const el = this.g.canvas;
        return {
            h: el.height / AA_SCALE,
            w: el.width / AA_SCALE
        };
    }

    set size(value: { h: number, w: number }) {
        const el = this.g.canvas;
        el.height = value.h * AA_SCALE;
        el.width = value.w * AA_SCALE;
        this.scale = this.scale;
    }

    get origin() {
        return this._origin;
    }

    set origin(value: point) {
        this._origin.x = value.x;
        this._origin.y = value.y;
    }

    /**
     * scale
     *   Gets or sets the canvas scaling factor.
     */
    get scale(): number {
        return this._scale / AA_SCALE;
    }

    set scale(value: number) {
        value = Math.min(DEFAULT.SCALE_MAX, value);
        value = Math.max(DEFAULT.SCALE_MIN, value);
        this._scale = AA_SCALE * value;
        this.g.setTransform(this._scale, 0, 0, this._scale, 0, 0);
    }

    /**
     * lineStyle
     *   Sets the line style of the rendering context.
     */
    set lineStyle(value: { style: string, dotSize?: number }) {
        value.dotSize = (value.dotSize ? value.dotSize : this.g.lineWidth);
        switch (value.style) {
            case "dashed":
                this.g.setLineDash([6 * value.dotSize, 3 * value.dotSize]);
                break;

            case "dotted":
                this.g.setLineDash([value.dotSize, 2 * value.dotSize]);
                break;

            default:
                this.g.setLineDash([1, 0]);
        }
    }

    /**
     * shadowBlur
     *   Sets the shadow blur range.
     */
    set shadowBlur(value: number) {
        this.g.shadowBlur = value * this._scale;
    }

    /**
     * shadowColor
     *   Sets the shadow color.
     */
    set shadowColor(value: string) {
        this.g.shadowColor = value;
    }

    /**
     * globalAlpha
     *   Sets the global alpha channel.
     */
    set globalAlpha(value: number) {
        this.g.globalAlpha = value;
    }

    set globalCompositeOperation(value: CompositeOperations) {
        this.g.globalCompositeOperation = value;
    }

    /**
     * strokeStyle
     *   Sets the stroke color.
     */
    set strokeStyle(value: string) {
        this.g.strokeStyle = value;
    }

    /**
     * fillStyle
     *   Sets the fill color.
     */
    set fillStyle(value: string) {
        this.g.fillStyle = value;
    }

    /**
     * lineWidth
     *   Sets the line width.
     */
    set lineWidth(value: number) {
        this.g.lineWidth = value;
    }

    /**
     * getTextWidth
     *   Gets the width of a string.
     */
    getTextWidth(text: string) {
        this.g.font = DEFAULT.FONT_SIZE + "pt " + DEFAULT.FONT_FAMILY;
        return this.g.measureText(text).width;
    }

    /**
     * getPt
     *   Gets the canvas coordinates from a DOM event.
     */
    getPt(pt: point): point {
        const canvas = this.g.canvas;
        const r = canvas.getBoundingClientRect();
        return {
            x: (pt.x - r.left) / (r.right - r.left) * canvas.width / this._scale - this.origin.x,
            y: (pt.y - r.top) / (r.bottom - r.top) * canvas.height / this._scale - this.origin.y
        };
    }


    // Redirects ///////////////////////////////////////////////////////////////


    /**
     * beginPath
     *   Starts tracing a path.
     */
    beginPath() {
        this.g.beginPath();
    }

    /**
     * stroke
     *   Strokes a path.
     */
    stroke() {
        this.g.stroke();
    }

    /**
     * fill
     *   Fills a path.
     */
    fill() {
        this.g.fill();
    }

}


// Static functions ////////////////////////////////////////////////////////////


/**
 * makeRect
 *   Makes a rectangle object with the bottom-left corner and height and width
 *   using the given opposing corner points.
 */
export function makeRect(pt1: point, pt2: point): rect {
    return {
        x: Math.min(pt2.x, pt1.x),
        y: Math.min(pt2.y, pt1.y),
        w: Math.abs(pt2.x - pt1.x),
        h: Math.abs(pt2.y - pt1.y)
    };
}
