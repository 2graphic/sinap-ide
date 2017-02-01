// File: canvas.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import * as DEFAULT from "./defaults";
import * as MathEx from "./math";
import {
    DrawableEdge,
    DrawableNode,
    LineStyles
} from "./drawable-interfaces";

import { makeDrawEdge, makeDrawSelectedEdge } from "./make-draw-edge";
import { makeDrawNode, makeDrawSelectedNode } from "./make-draw-node";


/**
 * AA_SCALE  
 *   Anti-aliasing scale.
 */
export const AA_SCALE: number = 2;


// Type Aliases ////////////////////////////////////////////////////////////////


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


export class GraphEditorCanvas {


    // Fields //////////////////////////////////////////////////////////////////


    private _scale: number = AA_SCALE;

    /**
     * origin  
     *   The coordinates of the canvas origin.
     */
    origin: point = { x: 0, y: 0 };


    // Constructor /////////////////////////////////////////////////////////////


    constructor(private g: CanvasRenderingContext2D) {
        this.g.mozImageSmoothingEnabled = true;
        this.g.msImageSmoothingEnabled = true;
        this.g.oImageSmoothingEnabled = true;
    }


    // Draw methods ////////////////////////////////////////////////////////////


    /**
     * clear  
     *   Clears the canvas.
     */
    clear(bgColor?: string): void {
        let canvas = this.g.canvas;
        if (bgColor) {
            this.g.fillStyle = bgColor;
            this.g.fillRect(0, 0, canvas.width / this._scale, canvas.height / this._scale);
        }
        else {
            this.g.clearRect(0, 0, canvas.width / this._scale, canvas.height / this._scale);
        }
    }

    tracePath(...pts: point[]) {
        this.g.moveTo(pts[0].x + this.origin.x, pts[0].y + this.origin.y);
        for (let i = 1; i < pts.length; i++)
            this.g.lineTo(pts[i].x + this.origin.x, pts[i].y + this.origin.y);
    }

    traceQuadratic(start: point, end: point, control: point) {
        this.g.moveTo(start.x + this.origin.x, start.y + this.origin.y);
        this.g.quadraticCurveTo(
            control.x + this.origin.x, control.y + this.origin.y,
            end.x + this.origin.x, end.y + this.origin.y
        );
    }

    traceCubic(start: point, end: point, control1: point, control2: point) {
        this.g.moveTo(start.x + this.origin.x, start.y + this.origin.y);
        this.g.bezierCurveTo(
            control1.x + this.origin.x, control1.y + this.origin.y,
            control2.x + this.origin.x, control2.y + this.origin.y,
            end.x + this.origin.x, end.y + this.origin.y
        );
    }

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

    traceCircle(origin: point, radius: number) {
        this.g.beginPath();
        this.g.arc(
            origin.x + this.origin.x, origin.y + this.origin.y,
            radius,
            0, 2 * Math.PI
        );
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
        let v: point = {
            x: dst.x - src.x,
            y: dst.y - src.y
        };
        let d = MathEx.mag(v);
        let u = { x: v.x / d, y: v.y / d };

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
            this.g.shadowBlur = 20 * this._scale;
            this.g.shadowColor = shadowColor;
        }
        this.g.fill();
        this.g.shadowBlur = 0;
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
            this.g.shadowBlur = 20 * this._scale;
            this.g.shadowColor = shadowColor;
        }
        this.g.fill();
        this.g.shadowBlur = 0;
        if (borderWidth > 0) {
            this.lineStyle = { style: borderStyle, dotSize: borderWidth };
            this.g.lineWidth = borderWidth;
            this.g.strokeStyle = borderColor;
            this.g.stroke();
        }
    }

    /**
     * drawGrid  
     *   Draws the editor grid.
     */
    drawGrid() {

        let w = this.g.canvas.width / this._scale;
        let h = this.g.canvas.height / this._scale;

        let o = {
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
        let x = p.x + this.origin.x;
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

    /**
     * drawEdgeLabel  
     *   Draws the edge label.
     */
    drawEdgeLabel(
        labelPt: point,
        size: size,
        lines: string[]
    ): void {
        this.g.fillStyle = "#fff";
        this.drawEdgeLabelRect(labelPt, size);
        this.drawText(
            labelPt,
            size.h,
            lines,
            "#000"
        );
    }

    drawEdgeLabelRect(
        labelPt: point,
        size: size
    ) {
        this.traceRect(this.makeRect(
            { x: labelPt.x - size.w / 2 - 6, y: labelPt.y - size.h / 2 },
            { x: labelPt.x + size.w / 2 + 6, y: labelPt.y + size.h / 2 }
        ));
        this.g.fill();
        this.g.shadowBlur = 0;
        this.g.stroke();
    }

    drawCubicEdgeBothArrows(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point,
        ctl1: point,
        ctl2: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.traceCubic(src, dst, ctl1, ctl2);
        this.traceArrow(ctl1, src);
        this.traceArrow(ctl2, dst);
        this.g.stroke();
    }

    drawCubicEdgeOneArrow(
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
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.traceCubic(src, dst, ctl1, ctl2);
        this.traceArrow(asrc, adst);
        this.g.stroke();
    }

    drawCubicEdgeNoArrows(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point,
        ctl1: point,
        ctl2: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.traceCubic(src, dst, ctl1, ctl2);
        this.g.stroke();
    }

    drawQuadraticEdgeBothArrows(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point,
        ctl: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.traceQuadratic(src, dst, ctl);
        this.traceArrow(ctl, src);
        this.traceArrow(ctl, dst);
        this.g.stroke();
    }

    drawQuadraticEdgeOneArrow(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point,
        ctl: point,
        adst: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.traceQuadratic(src, dst, ctl);
        this.traceArrow(ctl, adst);
        this.g.stroke();
    }

    drawQuadraticEdgeNoArrows(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point,
        ctl: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.traceQuadratic(src, dst, ctl);
        this.g.stroke();
    }

    drawStraightEdgeBothArrows(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.tracePath(src, dst);
        this.traceArrow(dst, src);
        this.traceArrow(src, dst);
        this.g.stroke();
    }

    drawStraightEdgeOneArrow(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point,
        asrc: point,
        adst: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.tracePath(src, dst);
        this.traceArrow(asrc, adst);
        this.g.stroke();
    }

    drawStraightEdgeNoArrows(
        strokeStyle: string,
        lineWidth: number,
        lineStyle: string,
        src: point,
        dst: point
    ): void {
        this.g.strokeStyle = strokeStyle;
        this.g.lineWidth = lineWidth;
        this.lineStyle = { style: lineStyle };
        this.g.beginPath();
        this.tracePath(src, dst);
        this.g.stroke();
    }


    // Get and Set methods /////////////////////////////////////////////////////


    set size(value: { h: number, w: number }) {
        let el = this.g.canvas;
        el.height = value.h * AA_SCALE;
        el.width = value.w * AA_SCALE;
        this.scale = this.scale;
    }

    set scale(value: number) {
        value = Math.min(DEFAULT.SCALE_MAX, value);
        value = Math.max(DEFAULT.SCALE_MIN, value);
        this._scale = AA_SCALE * value;
        this.g.setTransform(this._scale, 0, 0, this._scale, 0, 0);
    }

    get scale(): number {
        return this._scale / AA_SCALE;
    }

    /**
     * setLineStyle  
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

    set shadowBlur(value: number) {
        this.g.shadowBlur = value * this._scale;
    }

    /**
     * getTextSize  
     *   Gets the bounding box of text.
     */
    getTextSize(lines: Array<string>) {
        this.g.font = DEFAULT.FONT_SIZE + "pt " + DEFAULT.FONT_FAMILY;
        let textHeight = lines.length * 1.5 * DEFAULT.FONT_SIZE;
        let textWidth = 0;
        for (let l = 0; l < lines.length; l++) {
            let tw = this.g.measureText(lines[l]).width;
            if (textWidth < tw)
                textWidth = tw;
        }
        return { h: textHeight, w: textWidth };
    }

    /**
     * getPt  
     *   Gets the canvas coordinates from a mouse event.
     */
    getPt(pt: point): point {
        let canvas = this.g.canvas;
        let r = canvas.getBoundingClientRect();
        return {
            x: (pt.x - r.left) / (r.right - r.left) * canvas.width / this._scale - this.origin.x,
            y: (pt.y - r.top) / (r.bottom - r.top) * canvas.height / this._scale - this.origin.y
        };
    }

    /**
     * getEdgePtShift  
     *   Gets the vector in the direction of `u` that is on the boundary of a
     *   node based on its geometry.
     */
    getEdgePtShift(
        u: point,
        n: DrawableNode,
        dim: any
    ): point {
        let v: point = { x: 0, y: 0 };

        switch (n.shape) {
            // The boundary of a circle is just its radius plus half its border width.
            case "circle":
                v.x = u.x * dim.r + n.borderWidth / 2;
                v.y = u.y * dim.r + n.borderWidth / 2;
                break;

            // The boundary of a square depends on the direction of u.
            case "square":
                let up = {
                    x: (u.x < 0 ? -u.x : u.x),
                    y: (u.y < 0 ? -u.y : u.y)
                };
                let s = dim.s / 2;
                if (up.x < up.y) {
                    let ratio = up.x / up.y;
                    let b = s / up.y;
                    let a = ratio * up.x;
                    s = MathEx.mag({ x: a, y: b });
                }
                else {
                    let ratio = up.y / up.x;
                    let a = s / up.x;
                    let b = ratio * up.y;
                    s = MathEx.mag({ x: a, y: b });
                }
                v.x = u.x * s + n.borderWidth / 2;
                v.y = u.y * s + n.borderWidth / 2;
                break;
        }
        return v;
    }

    /**
     * getStraightEdgePoints  
     *   Gets the end points and midpoint of a straight line.
     */
    getStraightEdgePoints(
        e: DrawableEdge,
        srcDim?: any,
        dstDim?: any,
        pt?: point
    ): point[] {
        console.assert((e.source && srcDim) || !e.source, "error getStraightEdgePoints: srcDim undefined");
        console.assert((e.destination && dstDim) || !e.destination, "error getStraightEdgePoints: dstDim undefined");
        console.assert(((e.source || e.destination) && pt) || (e.source && e.destination), "error getStraightEdgePoints: pt undefined");
        let pts: point[] = [];
        let src = (e.source ? e.source.position : pt) as point;
        let dst = (e.destination ? e.destination.position : pt) as point;
        let v = { x: dst.x - src.x, y: dst.y - src.y };
        let d = MathEx.mag(v);
        let u = { x: v.x / d, y: v.y / d };
        if (e.source) {
            let shift = this.getEdgePtShift(u, e.source, srcDim);
            pts.push({ x: src.x + shift.x, y: src.y + shift.y });
        }
        else
            pts.push(pt as point);
        if (e.destination) {
            u.x *= -1;
            u.y *= -1;
            let shift = this.getEdgePtShift(u, e.destination, dstDim);
            pts.push({ x: dst.x + shift.x, y: dst.y + shift.y });
        }
        else
            pts.push(pt as point);
        pts.push({
            x: (pts[0].x + pts[1].x) / 2,
            y: (pts[0].y + pts[1].y) / 2
        });
        return pts;
    }

    /**
     * getLoopEdgePoints  
     *   Gets the edge points and midpoint of a self-referencing node.
     */
    getLoopEdgePoints(
        e: DrawableEdge,
        src: DrawableNode,
        srcDim: any
    ): point[] {
        let u: point = { x: MathEx.SIN_22_5, y: -MathEx.COS_22_5 };
        let v: point = { x: -MathEx.SIN_22_5, y: -MathEx.COS_22_5 };
        let pt0: point = this.getEdgePtShift(u, src, srcDim);
        let pt1: point = this.getEdgePtShift(v, src, srcDim);
        let pt2: point = {
            x: src.position.x + 2 * DEFAULT.GRID_SPACING * u.x,
            y: src.position.y + 2 * DEFAULT.GRID_SPACING * u.y
        };
        let pt3: point = {
            x: src.position.x + 2 * DEFAULT.GRID_SPACING * v.x,
            y: src.position.y + 2 * DEFAULT.GRID_SPACING * v.y
        };
        let pts: point[] = [];
        // src
        pts.push({ x: src.position.x + pt0.x, y: src.position.y + pt0.y });
        // dst
        pts.push({ x: src.position.x + pt1.x, y: src.position.y + pt1.y });
        // mid
        pts.push({
            x: (pts[0].x + 3 * (pt2.x + pt3.x) + pts[1].x) / 8,
            y: (pts[0].y + 3 * (pt2.y + pt3.y) + pts[1].y) / 8
        });
        // 1/3
        pts.push({
            x: (8 * pts[0].x + 12 * (pt2.x + pt3.x) + pts[1].x) / 27,
            y: (8 * pts[0].y + 12 * (pt2.y + pt3.y) + pts[1].y) / 27
        });
        // 2/3
        pts.push({
            x: (pts[0].x + 6 * (pt2.x + pt3.x) + 8 * pts[1].x) / 27,
            y: (pts[0].y + 6 * (pt2.y + pt3.y) + 8 * pts[1].y) / 27
        });
        pts.push(pt2);
        pts.push(pt3);
        return pts;
    }

    /**
     * getQuadraticEdgePoints  
     *   Gets the edge points and midpoint of an overlapping edge.
     */
    getQuadraticEdgePoints(
        e: DrawableEdge,
        src: DrawableNode,
        dst: DrawableNode,
        srcDim: any,
        dstDim: any
    ): point[] {
        // Get a vector from the source node to the destination node.
        let v: point = {
            x: dst.position.x - src.position.x,
            y: dst.position.y - src.position.y
        };
        // Get the normal to the vector.
        let d = MathEx.mag(v);
        let n: point = {
            x: v.y / d,
            y: -v.x / d
        };

        // Set the control point to the midpoint of the vector plus the scaled
        // normal.
        let pt1: point = {
            x: v.x / 2 + v.y / d * DEFAULT.GRID_SPACING,
            y: v.y / 2 - v.x / d * DEFAULT.GRID_SPACING
        };
        // Shift the source endpoint.
        d = MathEx.mag(pt1);
        let shiftPt: point = this.getEdgePtShift({ x: pt1.x / d, y: pt1.y / d }, src, srcDim);
        let pt0: point = {
            x: src.position.x + shiftPt.x,
            y: src.position.y + shiftPt.y
        };
        // Shift the destination endpoint.
        shiftPt = this.getEdgePtShift({ x: (pt1.x - v.x) / d, y: (pt1.y - v.y) / d }, dst, dstDim);
        let pt2: point = {
            x: src.position.x + v.x + shiftPt.x,
            y: src.position.y + v.y + shiftPt.y
        };
        // Translate the controlpoint by the position of the source node.
        pt1.x += src.position.x;
        pt1.y += src.position.y;
        let pts: point[] = [];
        pts.push(pt0);
        pts.push(pt2);
        // Midpoint.
        pts.push({
            x: (pt0.x + 2 * pt1.x + pt2.x) / 4,
            y: (pt0.y + 2 * pt1.y + pt2.y) / 4
        });
        pts.push(pt1);
        return pts;
    }

    /**
     * getNodeDimensions  
     *   Gets the deminsions of a given node based on its geometry.
     */
    getNodeDimensions(
        n: DrawableNode
    ): any {
        let lines = n.label.split("\n");
        let size = this.getTextSize(lines);
        let s = (DEFAULT.GRID_SPACING > size.h + 1.5 * DEFAULT.FONT_SIZE ?
            DEFAULT.GRID_SPACING : size.h + 1.5 * DEFAULT.FONT_SIZE);
        switch (n.shape) {
            case "circle":
                return { r: (s < size.w + DEFAULT.FONT_SIZE ? size.w + DEFAULT.FONT_SIZE : s) / 2, th: size.h };

            case "square":
                return { s: (s < size.w + DEFAULT.FONT_SIZE ? size.w + DEFAULT.FONT_SIZE : s), th: size.h };
        }
    }


    // Make methods ////////////////////////////////////////////////////////////


    /**
     * makeRect  
     *   Makes a rectangle object with the bottom-left corner and height and width
     *   using the given opposing corner points.
     */
    makeRect(pt1: point, pt2: point): rect {
        return {
            x: Math.min(pt2.x, pt1.x),
            y: Math.min(pt2.y, pt1.y),
            w: Math.abs(pt2.x - pt1.x),
            h: Math.abs(pt2.y - pt1.y)
        };
    }

    makeDrawEdge(
        e: DrawableEdge,
        pts: point[],
        isDragging: boolean,
        isHovered: boolean
    ): () => void {
        return makeDrawEdge(
            this,
            this.g,
            e,
            pts,
            isDragging,
            isHovered
        );
    }

    makeDrawSelectedEdge(
        e: DrawableEdge,
        pts: point[],
        isHovered: boolean
    ) {
        return makeDrawSelectedEdge(
            this,
            this.g,
            e,
            pts,
            isHovered
        );
    }

    makeDrawNode(
        n: DrawableNode,
        dim: any,
        isDragging: boolean,
        isHovered: boolean,
        pt?: point
    ): () => void {
        return makeDrawNode(
            this,
            this.g,
            n,
            dim,
            isDragging,
            isHovered,
            pt
        );
    }

    makeDrawSelectedNode(
        n: DrawableNode,
        dim: any,
        isDragging: boolean,
        isHovered: boolean
    ) {
        return makeDrawSelectedNode(
            this,
            this.g,
            n,
            dim,
            isDragging,
            isHovered
        );
    }
}
