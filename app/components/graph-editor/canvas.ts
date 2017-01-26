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


// Type Aliases ////////////////////////////////////////////////////////////////


/**
 * rect  
 *   Represents a rectangle with the top-left coordinate and height and width.
 */
export type rect = {
    x: number,
    y: number,
    h: number,
    w: number
};

/**
 * point  
 *   Represents a coordinate.
 */
export type point = [number, number];


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
    src: point,
    dst: point
): void {
    g.beginPath();
    g.moveTo(src[0], src[1]);
    g.lineTo(dst[0], dst[1]);
    g.stroke();
}

/**
 * drawQuadraticLine  
 *   Draws a quadratic bezier line between two points.
 */
export function drawQuadraticLine(
    g: CanvasRenderingContext2D,
    src: point,
    dst: point,
    ctl: point
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
 * drawCubicLine  
 *   Draws a cubic bezier line between two points.
 */
export function drawCubicLine(
    g: CanvasRenderingContext2D,
    src: point,
    dst: point,
    ctl1: point,
    ctl2: point
): void {
    g.beginPath();
    g.moveTo(src[0], src[1]);
    g.bezierCurveTo(
        ctl1[0], ctl1[1],
        ctl2[0], ctl2[1],
        dst[0], dst[1]
    );
    g.stroke();
}

/**
 * drawArrow  
 *   Draws an arrow towards the destination point.
 * 
 *   The arrow is drawn by computing the unit vector from the given source and
 *   destination points and rotating, scaling, and translating the unit vector
 *   before drawing the left and right sides of the arrow.
 */
export function drawArrow(
    g: CanvasRenderingContext2D,
    src: point,
    dst: point
): void {
    // Get the unit vector from the source point to the destination point.
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
            dst[0] + CONST.GRID_SPACING * (u[0] * MathEx.COS_150 - u[1] * MathEx.SIN_150) / 2,
            dst[1] + CONST.GRID_SPACING * (u[0] * MathEx.SIN_150 + u[1] * MathEx.COS_150) / 2
        ]
    );
    drawLine(
        g,
        dst,
        [
            dst[0] + CONST.GRID_SPACING * (u[0] * MathEx.COS_150 + u[1] * MathEx.SIN_150) / 2,
            dst[1] + CONST.GRID_SPACING * (-u[0] * MathEx.SIN_150 + u[1] * MathEx.COS_150) / 2
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
export function drawGrid(g: CanvasRenderingContext2D, originPt: point) {

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

/**
 * drawEdgeLabel  
 *   Draws the edge label.
 */
export function drawEdgeLabel(
    g: CanvasRenderingContext2D,
    rect: { x: number, y: number, w: number, h: number },
    labelPt: point,
    height: number,
    lines: string[]
): void {
    g.fillStyle = "#fff";
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
        g,
        labelPt[0], labelPt[1] - height + 1.5 * CONST.EDGE_FONT_SIZE / 2,
        lines,
        CONST.EDGE_FONT_SIZE,
        CONST.EDGE_FONT_FAMILY,
        "#000"
    );
}

export function drawCubicEdgeBothArrows(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    ctl1: point,
    ctl2: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawCubicLine(g, src, dst, ctl1, ctl2);
    drawArrow(g, ctl1, src);
    drawArrow(g, ctl2, dst);
}

export function drawCubicEdgeOneArrow(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    ctl1: point,
    ctl2: point,
    asrc: point,
    adst: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawCubicLine(g, src, dst, ctl1, ctl2);
    drawArrow(g, asrc, adst);
}

export function drawCubicEdgeNoArrows(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    ctl1: point,
    ctl2: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawCubicLine(g, src, dst, ctl1, ctl2);
}

export function drawQuadraticEdgeBothArrows(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    ctl: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, ctl, src);
    drawArrow(g, ctl, dst);
}

export function drawQuadraticEdgeOneArrow(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    ctl: point,
    adst: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, ctl, adst);
}

export function drawQuadraticEdgeNoArrows(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    ctl: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawQuadraticLine(g, src, dst, ctl);
}

export function drawStraightEdgeBothArrows(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawLine(g, src, dst);
    drawArrow(g, dst, src);
    drawArrow(g, src, dst);
}

export function drawStraightEdgeOneArrow(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point,
    asrc: point,
    adst: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawLine(g, src, dst);
    drawArrow(g, asrc, adst);
}

export function drawStraightEdgeNoArrows(
    g: CanvasRenderingContext2D,
    strokeStyle: string,
    lineWidth: number,
    lineStyle: string,
    src: point,
    dst: point
): void {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    setLineStyle(g, lineStyle);
    drawLine(g, src, dst);
}


// Hit Test functions //////////////////////////////////////////////////////////


export function hitTestCircle(
    originPt: point,
    hitPt: point,
    r: number
): boolean {
    let dPt = [
        originPt[0] - hitPt[0],
        originPt[1] - hitPt[1]
    ];
    return MathEx.dot(dPt, dPt) <= r * r;
}

export function hitTestSquare(
    originPt: point,
    hitPt: point,
    s: number
): boolean {
    let dPt = [
        originPt[0] - hitPt[0],
        originPt[1] - hitPt[1]
    ];
    let hs = s / 2;
    let sq = makeRect(
        [originPt[0] - hs, originPt[1] - hs],
        [originPt[0] + hs, originPt[1] + hs]
    );
    return (hitPt[0] >= sq.x && hitPt[0] <= sq.x + sq.w) &&
        (hitPt[1] >= sq.y && hitPt[1] <= sq.y + sq.w);
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
    dotSize = (dotSize ? dotSize : g.lineWidth);
    switch (value) {
        case "dashed":
            g.setLineDash([3 * dotSize, 6 * dotSize]);
            break;

        case "dotted":
            g.setLineDash([dotSize, 2 * dotSize]);
            break;

        default:
            g.setLineDash([1, 0]);
    }
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
export function getMousePt(g: CanvasRenderingContext2D, e: MouseEvent): point {
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
    u: point,
    n: DrawableNode,
    dim: any
): point {
    let v: point = [0, 0];

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
            let s = dim.s / 2;
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
 *   Gets the end points and midpoint of a straight line.
 */
export function getStraightEdgePoints(
    e: DrawableEdge,
    srcDim?: any,
    dstDim?: any,
    pt?: point
): point[] {
    let pts: point[] = [];
    if (e.source && e.destination) {
        console.assert(srcDim, "error getStraightEdgePoints: srcDim undefined");
        console.assert(dstDim, "error getStraightEdgePoints: dstDim undefined");
        let v = [
            e.destination.position.x - e.source.position.x,
            e.destination.position.y - e.source.position.y
        ];
        let d = MathEx.mag(v);
        let u: point = [v[0] / d, v[1] / d];
        let shiftPt = getEdgePtShift(u, e.source, srcDim);
        pts.push([
            e.source.position.x + shiftPt[0],
            e.source.position.y + shiftPt[1]
        ]);
        u[0] *= -1;
        u[1] *= -1;
        shiftPt = getEdgePtShift(u, e.destination, dstDim);
        pts.push([
            e.source.position.x + v[0] + shiftPt[0],
            e.source.position.y + v[1] + shiftPt[1]
        ]);
    }
    else if (e.source && !e.destination) {
        console.assert(pt, "error getStraightEdgePoints: pt undefined");
        console.assert(srcDim, "error getStraightEdgePoints: srcDim undefined");
        let p = pt as point;
        let v = [
            p[0] - e.source.position.x,
            p[1] - e.source.position.y
        ];
        let d = MathEx.mag(v);
        let u: point = [v[0] / d, v[1] / d];
        let shiftPt = getEdgePtShift(u, e.source, srcDim);
        pts.push([
            e.source.position.x + shiftPt[0],
            e.source.position.y + shiftPt[1]
        ]);
        pts.push(p);
    }
    else if (!e.source && e.destination) {
        console.assert(pt, "error getStraightEdgePoints: pt undefined");
        console.assert(dstDim, "error getStraightEdgePoints: dstDim undefined");
        let p = pt as point;
        let v = [
            e.destination.position.x - p[0],
            e.destination.position.y - p[1]
        ];
        let d = MathEx.mag(v);
        let u: point = [-v[0] / d, -v[1] / d];
        pts.push(p);
        let shiftPt = getEdgePtShift(u, e.destination, dstDim);
        pts.push([
            p[0] + v[0] + shiftPt[0],
            p[1] + v[1] + shiftPt[1]
        ]);
    }
    pts.push([
        (pts[0][0] + pts[1][0]) / 2,
        (pts[0][1] + pts[1][1]) / 2
    ]);
    return pts;
}

/**
 * getLoopEdgePoints  
 *   Gets the edge points and midpoint of a self-referencing node.
 */
export function getLoopEdgePoints(
    e: DrawableEdge,
    src: DrawableNode,
    srcDim: any
): point[] {
    let u: point = [MathEx.SIN_22_5, -MathEx.COS_22_5];
    let v: point = [-MathEx.SIN_22_5, -MathEx.COS_22_5];
    let pt0: point = getEdgePtShift(u, src, srcDim);
    let pt1: point = getEdgePtShift(v, src, srcDim);
    let pt2: point = [
        src.position.x + 2 * CONST.GRID_SPACING * u[0],
        src.position.y + 2 * CONST.GRID_SPACING * u[1]
    ];
    let pt3: point = [
        src.position.x + 2 * CONST.GRID_SPACING * v[0],
        src.position.y + 2 * CONST.GRID_SPACING * v[1]
    ];
    let pts: point[] = [];
    pts.push([src.position.x + pt0[0], src.position.y + pt0[1]]);
    pts.push([src.position.x + pt1[0], src.position.y + pt1[1]]);
    pts.push([
        MathEx._5_3 * (pts[0][0] + 3 * (pt2[0] + pt3[0]) + pts[1][0]),
        MathEx._5_3 * (pts[0][1] + 3 * (pt2[1] + pt3[1]) + pts[1][1])
    ]);
    pts.push(pt2);
    pts.push(pt3);
    return pts;
}

/**
 * getQuadraticEdgePoints  
 *   Gets the edge points and midpoint of an overlapping edge.
 */
export function getQuadraticEdgePoints(
    e: DrawableEdge,
    src: DrawableNode,
    dst: DrawableNode,
    srcDim: any,
    dstDim: any
): point[] {
    // Get a vector from the source node to the destination node.
    let v: point = [
        dst.position.x - src.position.x,
        dst.position.y - src.position.y
    ];
    // Get the normal to the vector.
    let d = MathEx.mag(v);
    let n: point = [
        v[1] / d,
        -v[0] / d
    ];

    // Set the control point to the midpoint of the vector plus the scaled
    // normal.
    let pt1: point = [
        v[0] / 2 + v[1] / d * CONST.GRID_SPACING,
        v[1] / 2 - v[0] / d * CONST.GRID_SPACING
    ];
    // Shift the source endpoint.
    d = MathEx.mag(pt1);
    let shiftPt: point = getEdgePtShift([pt1[0] / d, pt1[1] / d], src, srcDim);
    let pt0: point = [
        src.position.x + shiftPt[0],
        src.position.y + shiftPt[1]
    ];
    // Shift the destination endpoint.
    shiftPt = getEdgePtShift([(pt1[0] - v[0]) / d, (pt1[1] - v[1]) / d], dst, dstDim);
    let pt2: point = [
        src.position.x + v[0] + shiftPt[0],
        src.position.y + v[1] + shiftPt[1]
    ];
    // Translate the controlpoint by the position of the source node.
    pt1[0] += src.position.x;
    pt1[1] += src.position.y;
    let pts: point[] = [];
    pts.push(pt0);
    pts.push(pt2);
    // Midpoint.
    pts.push([
        MathEx._5_2 * (pt0[0] + 2 * pt1[0] + pt2[0]),
        MathEx._5_2 * (pt0[1] + 2 * pt1[1] + pt2[1])
    ]);
    pts.push(pt1);
    return pts;
}

/**
 * getNodeDimensions  
 *   Gets the deminsions of a given node based on its geometry.
 */
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
 *   Makes a rectangle object with the bottom-left corner and height and width
 *   using the given opposing corner points.
 */
export function makeRect(pt1: point, pt2: point): rect {
    let w = pt2[0] - pt1[0];
    let h = pt2[1] - pt1[1];
    return {
        x: (w < 0 ? pt2[0] : pt1[0]),
        y: (h < 0 ? pt2[1] : pt1[1]),
        w: (w < 0 ? -1 * w : w),
        h: (h < 0 ? -1 * h : h)
    };
}
