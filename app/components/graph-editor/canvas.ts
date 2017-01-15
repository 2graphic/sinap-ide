// File: canvas.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import * as CONST from "./constants";
import * as MathEx from "./math";
import {
    DrawableEdge,
    DrawableNode
} from "./drawable-interfaces";


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

    // Major grid.
    g.strokeStyle = CONST.GRID_MAJOR_COLOR;
    g.lineWidth = CONST.GRID_MAJOR_WIDTH;
    setLineStyle(g, CONST.GRID_MAJOR_STYLE);
    for (
        let x = originPt[0] % CONST.GRID_SPACING - CONST.GRID_SPACING;
        x < w + CONST.GRID_SPACING;
        x += CONST.GRID_SPACING
    )
        drawLine(g, [x, 0], [x, h]);
    for (
        let y = originPt[1] % CONST.GRID_SPACING - CONST.GRID_SPACING;
        y < h + CONST.GRID_SPACING;
        y += CONST.GRID_SPACING
    )
        drawLine(g, [0, y], [w, y]);

    // Minor grid.
    g.strokeStyle = CONST.GRID_MINOR_COLOR;
    g.lineWidth = CONST.GRID_MINOR_WIDTH;
    setLineStyle(g, CONST.GRID_MINOR_STYLE);
    for (
        let x = originPt[0] % CONST.GRID_SPACING - CONST.GRID_SPACING + CONST.GRID_MINOR_OFFSET;
        x < w + CONST.GRID_SPACING;
        x += CONST.GRID_SPACING
    )
        drawLine(g, [x, 0], [x, h]);
    for (
        let y = originPt[1] % CONST.GRID_SPACING - CONST.GRID_SPACING + CONST.GRID_MINOR_OFFSET;
        y < h + CONST.GRID_SPACING;
        y += CONST.GRID_SPACING
    )
        drawLine(g, [0, y], [w, y]);

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

/**
 * getEdgePtShift  
 *   Gets the vector in the direction of `u` that is on the boundary of a
 *   node based on its geometry.
 */
export function getEdgePtShift(
    u: number[],
    n: DrawableNode,
    dim: any
): number[] {
    let v = [0, 0];

    switch (n.shape) {
        // The boundary of a circle is just its radius plus half its border width.
        case "circle":
            v[0] = u[0] * dim.r + n.borderWidth / 2;
            v[1] = u[1] * dim.r + n.borderWidth / 2;
            break;

        // The boundary of a square depends on the direction of u.
        case "square":
            let up = [
                (u[0] < 0 ? -u[0] : u[0]),
                (u[1] < 0 ? -u[1] : u[1])
            ];
            let s = dim.s;
            if (up[0] < up[1]) {
                let ratio = up[0] / up[1];
                let b = s / up[1];
                let a = ratio * up[0];
                s = MathEx.mag([a, b]);
            }
            else {
                let ratio = up[1] / up[0];
                let a = s / up[0];
                let b = ratio * up[1];
                s = MathEx.mag([a, b]);
            }
            v[0] = u[0] * s + n.borderWidth / 2;
            v[1] = u[1] * s + n.borderWidth / 2;
            break;
    }
    return v;
}

/**
 * getStraightEdgePoints  
 *   Gets the end points of a straight line.
 */
export function getStraightEdgePoints(
    e: DrawableEdge,
    srcDim?: any,
    dstDim?: any,
    pt?: number[]
): number[] {
    let pts: number[] = [];
    if (e.source && e.destination) {
        console.assert(srcDim, "error getStraightEdgePoints: srcDim undefined");
        console.assert(dstDim, "error getStraightEdgePoints: dstDim undefined");
        let v = [
            e.destination.x - e.source.x,
            e.destination.y - e.source.y
        ];
        let d = MathEx.mag(v);
        let u = [v[0] / d, v[1] / d];
        let shiftPt = getEdgePtShift(u, e.source, srcDim);
        pts.push(e.source.x + shiftPt[0]);
        pts.push(e.source.y + shiftPt[1]);
        u[0] *= -1;
        u[1] *= -1;
        shiftPt = getEdgePtShift(u, e.destination, dstDim);
        pts.push(e.source.x + v[0] + shiftPt[0]);
        pts.push(e.source.y + v[1] + shiftPt[1]);
    }
    else if (e.source && !e.destination) {
        console.assert(pt, "error getStraightEdgePoints: pt undefined");
        console.assert(srcDim, "error getStraightEdgePoints: srcDim undefined");
        let v = [
            (pt as number[])[0] - e.source.x,
            (pt as number[])[1] - e.source.y
        ];
        let d = MathEx.mag(v);
        let u = [v[0] / d, v[1] / d];
        let shiftPt = getEdgePtShift(u, e.source, srcDim);
        pts.push(e.source.x + shiftPt[0]);
        pts.push(e.source.y + shiftPt[1]);
        pts.push((pt as number[])[0]);
        pts.push((pt as number[])[1]);
    }
    else if (!e.source && e.destination) {
        console.assert(pt, "error getStraightEdgePoints: pt undefined");
        console.assert(dstDim, "error getStraightEdgePoints: dstDim undefined");
        let v = [
            e.destination.x - (pt as number[])[0],
            e.destination.y - (pt as number[])[1]
        ];
        let d = MathEx.mag(v);
        let u = [-v[0] / d, -v[1] / d];
        pts.push((pt as number[])[0]);
        pts.push((pt as number[])[1]);
        let shiftPt = getEdgePtShift(u, e.destination, dstDim);
        pts.push((pt as number[])[0] + v[0] + shiftPt[0]);
        pts.push((pt as number[])[1] + v[1] + shiftPt[1]);
    }
    return pts;
}

/**
 * getLoopEdgePoints  
 *   Gets the edge points of a self-referencing node.
 */
export function getLoopEdgePoints(e: DrawableEdge): number[] {
    // TODO:
    return [];
}

/**
 * getQuadraticEdgePoints  
 *   Sets the edge points of an overlapping edge.
 */
export function getQuadraticEdgePoints(
    e: DrawableEdge,
    src: DrawableNode,
    dst: DrawableNode,
    srcDim: any,
    dstDim: any
): number[] {
    let v = [
        dst.x - src.x,
        dst.y - src.y
    ];
    let d = MathEx.mag(v);
    let n = [
        v[1] / d,
        -v[0] / d
    ];

    let pt1 = [
        v[0] / 2 + v[1] / d * CONST.GRID_SPACING,
        v[1] / 2 - v[0] / d * CONST.GRID_SPACING
    ];
    d = MathEx.mag(pt1);
    let shiftPt = getEdgePtShift([pt1[0] / d, pt1[1] / d], src, srcDim);
    let pt0 = [
        src.x + shiftPt[0],
        src.y + shiftPt[1]
    ];
    shiftPt = getEdgePtShift([(pt1[0] - v[0]) / d, (pt1[1] - v[1]) / d], dst, dstDim);
    let pt2 = [
        src.x + v[0] + shiftPt[0],
        src.y + v[1] + shiftPt[1]
    ];
    return [pt0[0], pt0[1], pt2[0], pt2[1], pt1[0] + src.x, pt1[1] + src.y];
}

export function getNodeDimensions(
    g: CanvasRenderingContext2D,
    n: DrawableNode
): any {
    let lines = n.label.split("\n");
    let size = getTextSize(
        g,
        lines,
        CONST.NODE_FONT_FAMILY,
        CONST.NODE_FONT_SIZE
    );
    let s = (CONST.GRID_SPACING > size.h + 1.5 * CONST.NODE_FONT_SIZE ?
        CONST.GRID_SPACING : size.h + 1.5 * CONST.NODE_FONT_SIZE);
    switch (n.shape) {
        case "circle":
            return { r: (s < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : s) / 2, th: size.h };

        case "square":
            return { s: (s < size.w + CONST.NODE_FONT_SIZE ? size.w + CONST.NODE_FONT_SIZE : s), th: size.h };
    }
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
