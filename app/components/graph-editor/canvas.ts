// File: canvas.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import * as CONST from "./constants";
import * as Drawables from "./drawable-interfaces";
import * as MathEx from "./math";


// Draw functions //////////////////////////////////////////////////////////////


/**
 * clear  
 *   Clears the canvas.
 */
export function clear(g: CanvasRenderingContext2D, bgColor: string): void {
    let canvas = g.canvas;
    g.fillStyle = bgColor;
    g.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * drawSelectionBox  
 *   Draws the selection box.
 */
export function drawSelectionBox(g: CanvasRenderingContext2D, rect: any): void {
    g.strokeStyle = CONST.SELECTION_COLOR;
    g.fillStyle = CONST.SELECTION_COLOR;
    g.globalAlpha = 0.1;
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.globalAlpha = 1.0;
    g.lineWidth = 1;
    setLineStyle(g, "solid");
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/**
 * drawLine  
 *   Draws a line.
 */
export function drawLine(
    g: CanvasRenderingContext2D,
    src: number[],
    dst: number[]
): void {
    g.beginPath();
    g.moveTo(src[0], src[1]);
    g.lineTo(dst[0], dst[1]);
    g.stroke();
}

/**
 * drawQuadraticLine  
 *   Draws a quadratic line between two points.
 */
export function drawQuadraticLine(
    g: CanvasRenderingContext2D,
    src: number[],
    dst: number[],
    ctl: number[]
): void {
    g.beginPath();
    g.moveTo(src[0], src[1]);
    g.quadraticCurveTo(
        ctl[0], ctl[1],
        dst[0], dst[1]
    );
    g.stroke();
}

/**
 * drawArrow  
 *   Draws an arrow towards the destination node.
 */
export function drawArrow(
    g: CanvasRenderingContext2D,
    src: number[],
    dst: number[]
): void {
    let v = [
        dst[0] - src[0],
        dst[1] - src[1]
    ];
    let d = MathEx.mag(v);
    let u = [v[0] / d, v[1] / d];

    // Draw arrow.
    drawLine(
        g,
        dst,
        [
            dst[0] + CONST.GRID_SPACING * (u[0] * CONST.COS_150 - u[1] * CONST.SIN_150) / 2,
            dst[1] + CONST.GRID_SPACING * (u[0] * CONST.SIN_150 + u[1] * CONST.COS_150) / 2
        ]
    );
    drawLine(
        g,
        dst,
        [
            dst[0] + CONST.GRID_SPACING * (u[0] * CONST.COS_150 + u[1] * CONST.SIN_150) / 2,
            dst[1] + CONST.GRID_SPACING * (-u[0] * CONST.SIN_150 + u[1] * CONST.COS_150) / 2
        ]
    );

}

/**
 * drawCircle  
 *   Draws a circle.
 */
export function drawCircle(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    borderStyle: string,
    borderWidth: number,
    borderColor: string,
    fillColor: string,
    shadowColor?: string
) {
    g.beginPath();
    g.arc(x, y, r, 0, 2 * Math.PI);
    g.fillStyle = fillColor;
    if (shadowColor) {
        g.shadowBlur = 20 * CONST.AA_SCALE;
        g.shadowColor = shadowColor;
    }
    g.fill();
    g.shadowBlur = 0;
    if (borderWidth > 0) {
        setLineStyle(g, borderStyle, borderWidth);
        g.lineWidth = borderWidth;
        g.strokeStyle = borderColor;
        g.stroke();
    }
}

/**
 * drawSquare  
 *   Draws a square.
 */
export function drawSquare(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    borderStyle: string,
    borderWidth: number,
    borderColor: string,
    fillColor: string,
    shadowColor?: string
) {
    g.fillStyle = fillColor;
    if (shadowColor) {
        g.shadowBlur = 20 * CONST.AA_SCALE;
        g.shadowColor = shadowColor;
    }
    g.fillRect(x, y, s, s);
    g.shadowBlur = 0;
    if (borderWidth > 0) {
        setLineStyle(g, borderStyle, borderWidth);
        g.lineWidth = borderWidth;
        g.strokeStyle = borderColor;
        g.strokeRect(x, y, s, s);
    }
}

/**
 * drawGrid  
 *   Draws the editor grid.
 */
export function drawGrid(g: CanvasRenderingContext2D, originPt: number[]) {

    let w = g.canvas.width;
    let h = g.canvas.height;

    for (
        let x = originPt[0] % CONST.GRID_SPACING - CONST.GRID_SPACING;
        x < w + CONST.GRID_SPACING;
        x += CONST.GRID_SPACING
    ) {
        g.strokeStyle = CONST.GRID_MAJOR_COLOR;
        g.lineWidth = CONST.GRID_MAJOR_WIDTH;
        setLineStyle(g, CONST.GRID_MAJOR_STYLE);
        drawLine(g, [x, 0], [x, h]);
        g.strokeStyle = CONST.GRID_MINOR_COLOR;
        g.lineWidth = CONST.GRID_MINOR_WIDTH;
        setLineStyle(g, CONST.GRID_MINOR_STYLE);
        drawLine(g, [x + CONST.GRID_MINOR_OFFSET, 0], [x + CONST.GRID_MINOR_OFFSET, h]);
    }
    for (
        let y = originPt[1] % CONST.GRID_SPACING - CONST.GRID_SPACING;
        y < h + CONST.GRID_SPACING;
        y += CONST.GRID_SPACING
    ) {
        g.strokeStyle = CONST.GRID_MAJOR_COLOR;
        g.lineWidth = CONST.GRID_MAJOR_WIDTH;
        setLineStyle(g, CONST.GRID_MAJOR_STYLE);
        drawLine(g, [0, y], [w, y]);
        g.strokeStyle = CONST.GRID_MINOR_COLOR;
        g.lineWidth = CONST.GRID_MINOR_WIDTH;
        setLineStyle(g, CONST.GRID_MINOR_STYLE);
        drawLine(g, [0, y + CONST.GRID_MINOR_OFFSET], [w, y + CONST.GRID_MINOR_OFFSET]);
    }

}

/**
 * drawText  
 *   Draws text.
 */
export function drawText(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    lines: Array<string>,
    fontSize: number,
    fontFamily: string,
    color: string,
    borderWidth?: number,
    borderColor?: string
) {
    g.font = fontSize + "pt " + fontFamily;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = color;
    if (borderWidth && borderColor) {
        g.lineWidth = 2;
        g.strokeStyle = "#000";
        setLineStyle(g, "solid");
        for (let l = 0; l < lines.length; l++) {
            g.strokeText(lines[l], x, y);
            g.fillText(lines[l], x, y);
            y += 1.5 * fontSize;
        }
    }
    else {
        for (let l = 0; l < lines.length; l++) {
            g.fillText(lines[l], x, y);
            y += 1.5 * fontSize;
        }
    }
}


// Get and Set functions ///////////////////////////////////////////////////////


/**
 * setLineStyle  
 *   Sets the line style of the rendering context.
 */
export function setLineStyle(
    g: CanvasRenderingContext2D,
    value: string,
    dotSize?: number
) {
    if (!dotSize)
        dotSize = g.lineWidth;
    if (value == "dashed")
        g.setLineDash([3 * dotSize, 6 * dotSize]);
    else if (value == "dotted")
        g.setLineDash([dotSize, 2 * dotSize]);
    else
        g.setLineDash([1, 0]);
}

/**
 * getTextSize  
 *   Gets the bounding box of text.
 */
export function getTextSize(
    g: CanvasRenderingContext2D,
    lines: Array<string>,
    fontFamily: string,
    fontSize: number
) {
    g.font = fontSize + "pt " + fontFamily;
    let textHeight = lines.length * 1.5 * fontSize;
    let textWidth = 0;
    for (let l = 0; l < lines.length; l++) {
        let tw = g.measureText(lines[l]).width;
        if (textWidth < tw)
            textWidth = tw;
    }
    return { h: textHeight, w: textWidth };
}

/**
 * getMousePt  
 *   Gets the canvas coordinates from a mouse event.
 */
export function getMousePt(g: CanvasRenderingContext2D, e: MouseEvent): number[] {
    let canvas = g.canvas;
    let r = canvas.getBoundingClientRect();
    return [
        (e.clientX - r.left) / (r.right - r.left) * canvas.width / CONST.AA_SCALE,
        (e.clientY - r.top) / (r.bottom - r.top) * canvas.height / CONST.AA_SCALE
    ];
}


// Make functions //////////////////////////////////////////////////////////////


/**
 * makeRect  
 *   Makes a rectangle object with the bottom-left corner and height and width.
 */
export function makeRect(x1: number, y1: number, x2: number, y2: number) {
    let w = x2 - x1;
    let h = y2 - y1;
    return {
        x: (w < 0 ? x2 : x1),
        y: (h < 0 ? y2 : y1),
        w: (w < 0 ? -1 * w : w),
        h: (h < 0 ? -1 * h : h)
    };
}
