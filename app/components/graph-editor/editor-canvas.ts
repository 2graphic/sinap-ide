/**
 * @file `editor-canvas.ts`
 *   Created on January 9, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


import {
    FONT_FAMILY,
    FONT_SIZE,
    GRID_MAJOR_COLOR,
    GRID_MAJOR_STYLE,
    GRID_MAJOR_WIDTH,
    GRID_MINOR_COLOR,
    GRID_MINOR_OFFSET,
    GRID_MINOR_STYLE,
    GRID_MINOR_WIDTH,
    GRID_SPACING,
    SELECTION_COLOR
} from "./defaults";
import {
    COS_150,
    SIN_150,
    diff,
    unit
} from "./math";


// Constants ///////////////////////////////////////////////////////////////////


/**
 * `AA_SCALE`
 *
 *   Anti-aliasing scale.
 */
const AA_SCALE: number = 2;

/**
 * `FONT`
 *
 *   The default text font.
 */
const FONT = "bold " + FONT_SIZE + "pt " + FONT_FAMILY;

/**
 * `IMAGES`
 *
 *   Contains a map of cached images.
 */
export const IMAGES = new Map<string, HTMLImageElement>();


// Type Aliases ////////////////////////////////////////////////////////////////


/**
 * `CompositeOperations`
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation}
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
 * `LineStyles`
 */
export type LineStyles = "solid" | "dotted" | "dashed" | "double";

/**
 * `Shapes`
 */
export type Shapes = "circle" | "square" | "ellipse" | "rectangle" | "image";

/**
 * `point`
 *
 *   Represents an x and y value.
 */
export type point = { x: number, y: number };

/**
 * `size`
 *
 *   Represents rectangle dimensions.
 */
export type size = { height: number, width: number };

/**
 * `rect`
 *
 *   Represents a rectangle with a `point` and `size`.
 */
export type rect = point & size;


// Classes /////////////////////////////////////////////////////////////////////


/**
 * `GraphEditorCanvas`
 *
 *   Provides an interface to the canvas rendering context of the
 *   `GraphEditorComponent`.
 */
export class EditorCanvas {
    constructor(private g: CanvasRenderingContext2D) {
        // g.imageSmoothingEnabled = true;
        g.webkitImageSmoothingEnabled = true;
    }


    // Private fields //////////////////////////////////////////////////////////


    private _scale: number = AA_SCALE;
    private _origin: point = { x: 0, y: 0 };


    // Trace methods ///////////////////////////////////////////////////////////


    /**
     * `tracePath`
     *
     *   Traces line segments from point to point of the given points.
     *
     * @param pts
     *   The list of points in the path.
     */
    tracePath(...pts: point[]) {
        this.g.moveTo(pts[0].x + this.origin.x, pts[0].y + this.origin.y);
        pts.forEach(p => this.g.lineTo(
            p.x + this.origin.x,
            p.y + this.origin.y
        ));
    }

    /**
     * `traceQuadratic`
     *
     *   Traces a quadratic Bezier curve.
     *
     * @param start
     *   The start point of the curve.
     *
     * @param end
     *   The end point of the curve.
     *
     * @param control
     *   The control point of the curve.
     */
    traceQuadratic(start: point, end: point, control: point) {
        this.g.moveTo(start.x + this.origin.x, start.y + this.origin.y);
        this.g.quadraticCurveTo(
            control.x + this.origin.x, control.y + this.origin.y,
            end.x + this.origin.x, end.y + this.origin.y
        );
    }

    /**
     * `traceCubic`
     *
     *   Traces a cubic Bezier curve.
     *
     * @param start
     *   The start point of the curve.
     *
     * @param end
     *   The end point of the curve.
     *
     * @param control1
     *   The first control point of the curve.
     *
     * @param control2
     *   The second control point of the curve.
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
     * `traceRectangle`
     *
     *   Traces a rectangle.
     *
     * @param rect
     *   The rectangle to be traced.
     */
    traceRectangle(rect: rect) {
        this.g.beginPath();
        this.g.rect(
            rect.x + this.origin.x, rect.y + this.origin.y,
            rect.width, rect.height
        );
    }

    /**
     * `traceEllipse`
     *
     *   Traces an ellipse.
     *
     * @param origin
     *   The center of the ellipse.
     *
     * @param rx
     *   The x-radius of the ellipse.
     *
     * @param ry
     *   The y-radius of the ellipse.
     */
    traceEllipse(origin: point, rx: number, ry: number) {
        this.g.beginPath();
        this.g.ellipse(
            origin.x + this.origin.x, origin.y + this.origin.y,
            rx, ry,
            0,
            0, 2 * Math.PI
        );
    }

    /**
     * `traceArrow`
     *
     *   Traces an arrow towards the destination point.
     *
     *   The arrow is traced by computing the unit vector from the given source
     *   and destination points and rotating, scaling, and translating the unit
     *   vector before tracing the left and right sides of the arrow.
     *
     * @param src
     *   The coordinates of the origin of the arrow.
     *
     * @param dst
     *   The coordinates of the endpoint of the arrow.
     */
    traceArrow(src: point, dst: point): void {
        // Get the unit vector from the source point to the destination point.
        const u = unit(diff(dst, src));

        // Trace arrow.
        this.tracePath(
            {
                x: dst.x + GRID_SPACING * (u.x * COS_150 - u.y * SIN_150) / 2,
                y: dst.y + GRID_SPACING * (u.x * SIN_150 + u.y * COS_150) / 2
            },
            dst,
            {
                x: dst.x + GRID_SPACING * (u.x * COS_150 + u.y * SIN_150) / 2,
                y: dst.y + GRID_SPACING * (-u.x * SIN_150 + u.y * COS_150) / 2
            }
        );

    }


    // Draw methods ////////////////////////////////////////////////////////////


    /**
     * `clear`
     *
     *   Clears the canvas with the provided color. If no color is provided, the
     *   canvas is cleared to transparency.
     *
     * @param bgColor
     *   The background color with which to clear the canvas.
     */
    clear(bgColor?: string): void {
        const canvas = this.g.canvas;
        if (bgColor) {
            this.g.fillStyle = bgColor;
            this.g.fillRect(
                0, 0,
                canvas.width / this._scale, canvas.height / this._scale
            );
        }
        else {
            this.g.clearRect(
                0, 0,
                canvas.width / this._scale, canvas.height / this._scale
            );
        }
    }

    /**
     * `drawSelectionBox`
     *
     *   Draws the selection box.
     *
     * @param rect
     *   The selection box rectangle.
     */
    drawSelectionBox(rect: rect): void {
        this.traceRectangle(rect);
        this.g.strokeStyle = SELECTION_COLOR;
        this.g.fillStyle = SELECTION_COLOR;
        this.g.globalAlpha = 0.1;
        this.g.fill();
        this.g.globalAlpha = 1.0;
        this.g.lineWidth = 1;
        this.lineStyle = "solid";
        this.g.stroke();
    }

    /**
     * `drawImage`
     *
     *   Draws an image with the center at the given point.
     *
     * @param p
     *   The canvas coordinate where the center of the image should be.
     *
     * @param img
     *   Path to the image. This is used as the lookup key in `IMAGES`.
     */
    drawImage(p: point, img: string) {
        const image = IMAGES.get(img)!;
        this.g.drawImage(
            image,
            this._origin.x + p.x - image.width / 2,
            this._origin.y + p.y - image.height / 2,
        );
    }

    /**
     * `drawGrid`
     *
     *   Draws the editor grid.
     */
    drawGrid() {

        const w = this.g.canvas.width / this._scale;
        const h = this.g.canvas.height / this._scale;

        const o = {
            x: this.origin.x % GRID_SPACING - GRID_SPACING,
            y: this.origin.y % GRID_SPACING - GRID_SPACING
        };

        // Major grid.
        this.strokeColor = GRID_MAJOR_COLOR;
        this.lineWidth = GRID_MAJOR_WIDTH;
        this.lineStyle = GRID_MAJOR_STYLE;
        this.drawGridLines(o, h, w);

        // Minor grid.
        this.strokeColor = GRID_MINOR_COLOR;
        this.lineWidth = GRID_MINOR_WIDTH;
        this.lineStyle = GRID_MINOR_STYLE;
        o.x += GRID_MINOR_OFFSET;
        o.y += GRID_MINOR_OFFSET;
        this.drawGridLines(o, h, w);

    }

    /**
     * `drawGridLines`
     *
     *   Draws a bunch of evenly-spaced grid lines.
     *
     * @private
     */
    private drawGridLines(o: point, h: number, w: number) {
        for (let x = o.x; x < w + GRID_SPACING; x += GRID_SPACING) {
            this.g.beginPath();
            this.g.moveTo(x, 0);
            this.g.lineTo(x, h);
            this.g.stroke();
        }
        for (let y = o.y; y < h + GRID_SPACING; y += GRID_SPACING) {
            this.g.beginPath();
            this.g.moveTo(0, y);
            this.g.lineTo(w, y);
            this.g.stroke();
        }
    }


    // Get and Set methods /////////////////////////////////////////////////////


    /**
     * `size`
     *
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

    /**
     * `origin`
     *
     *   Gets or sets the origin offset of the canvas.
     */
    get origin() {
        return this._origin;
    }

    set origin(value: point) {
        this._origin.x = value.x;
        this._origin.y = value.y;
    }

    /**
     * `scale`
     *
     *   Gets or sets the canvas scaling factor.
     */
    get scale(): number {
        return this._scale / AA_SCALE;
    }

    set scale(value: number) {
        this._scale = AA_SCALE * value;
        this.g.setTransform(this._scale, 0, 0, this._scale, 0, 0);
    }

    /**
     * `lineStyle`
     *
     *   Sets the line style of the rendering context.
     */
    set lineStyle(value: LineStyles) {
        const dotSize = this.g.lineWidth;
        switch (value) {
            case "dashed":
                this.g.setLineDash([6 * dotSize, 3 * dotSize]);
                break;

            case "dotted":
                this.g.setLineDash([dotSize, 2 * dotSize]);
                break;

            default:
                this.g.setLineDash([]);
        }
    }

    /**
     * `shadowBlur`
     *
     *   Sets the shadow blur range.
     */
    set shadowBlur(value: number) {
        this.g.shadowBlur = value * this._scale;
    }

    /**
     * `shadowColor`
     *
     *   Sets the shadow color.
     */
    set shadowColor(value: string) {
        this.g.shadowColor = value;
    }

    /**
     * `globalAlpha`
     *
     *   Sets the global alpha channel.
     */
    set globalAlpha(value: number) {
        this.g.globalAlpha = value;
    }

    /**
     * `globalCompositeOperation`
     *
     *   Sets the global composite operation.
     */
    set globalCompositeOperation(value: CompositeOperations) {
        this.g.globalCompositeOperation = value;
    }

    /**
     * `strokeColor`
     *
     *   Sets the stroke color.
     */
    set strokeColor(value: string) {
        this.g.strokeStyle = value;
    }

    /**
     * `fillColor`
     *
     *   Sets the fill color.
     */
    set fillColor(value: string) {
        this.g.fillStyle = value;
    }

    /**
     * `lineWidth`
     *
     *   Sets the line width.
     */
    set lineWidth(value: number) {
        this.g.lineWidth = value;
    }

    /**
     * `getTextWidth`
     *
     *   Gets the width of a string.
     *
     * @param text
     *   The string to be measured.
     *
     * @returns
     *   The width of the string.
     */
    getTextWidth(text: string) {
        this.g.font = FONT;
        return this.g.measureText(text).width;
    }

    /**
     * `getCoordinates`
     *
     *   Gets the canvas coordinates from a DOM event.
     *
     * @param pt
     *   The DOM event position.
     *
     * @returns
     *   The translated coordinates.
     */
    getCoordinates(pt: point): point {
        const canvas = this.g.canvas;
        const r = canvas.getBoundingClientRect();
        return {
            x: (pt.x - r.left) / (r.right - r.left) * canvas.width / this._scale
            - this.origin.x,
            y: (pt.y - r.top) / (r.bottom - r.top) * canvas.height / this._scale
            - this.origin.y
        };
    }


    // Wrappers ////////////////////////////////////////////////////////////////


    /**
     * `beginPath`
     *
     *   Starts tracing a path.
     */
    beginPath() {
        this.g.beginPath();
    }

    /**
     * `stroke`
     *
     *   Strokes a path.
     */
    stroke() {
        this.g.stroke();
    }

    /**
     * `fill`
     *
     *   Fills a path.
     */
    fill() {
        this.g.fill();
    }

    /**
     * `strokeText`
     *
     *   Strokes the outline of a string. The string is drawn centered around
     *   the provided coordinates.
     *
     * @param text
     *   The string to be stroked.
     *
     * @param x
     *   The x-coordinate of the string.
     *
     * @param y
     *   The y-coordinate of the string.
     */
    strokeText(text: string, x: number, y: number) {
        this.g.font = FONT;
        this.g.textAlign = "center";
        this.g.textBaseline = "middle";
        this.g.strokeText(text, x + this._origin.x, y + this._origin.y);
    }

    /**
     * `fillText`
     *
     *   Fills the string. The string is drawn centered around the provided
     *   coordinates.
     *
     * @param text
     *   The string to be filled.
     *
     * @param x
     *   The x-coordinate of the string.
     *
     * @param y
     *   The y-coordinate of the string.
     */
    fillText(text: string, x: number, y: number) {
        this.g.font = FONT;
        this.g.textAlign = "center";
        this.g.textBaseline = "middle";
        this.g.fillText(text, x + this._origin.x, y + this._origin.y);
    }

}


// Static functions ////////////////////////////////////////////////////////////


/**
 * `makeRect`
 *
 *   Makes a rectangle object with the bottom-left corner and height and width
 *   using the given opposing corner points.
 *
 * @param p1
 *   The first corner point of the rectangle.
 *
 * @param p2
 *   The second corner point of the rectangle.
 *
 * @returns
 *   A rectangle with the given corner points.
 */
export function makeRect(pt1: point, pt2: point): rect {
    return {
        x: Math.min(pt2.x, pt1.x),
        y: Math.min(pt2.y, pt1.y),
        width: Math.abs(pt2.x - pt1.x),
        height: Math.abs(pt2.y - pt1.y)
    };
}
