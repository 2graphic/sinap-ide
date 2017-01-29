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
    DrawableNode,
    LineStyles
} from "./drawable-interfaces";

import { makeDrawEdge, makeDrawSelectedEdge } from "./make-draw-edge";
import { makeDrawNode, makeDrawSelectedNode } from "./make-draw-node";


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
export type point = { x: number, y: number };


export class GraphEditorCanvas {


    // Fields //////////////////////////////////////////////////////////////////


    private _scale: number = CONST.AA_SCALE;

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
            this.g.fillRect(0, 0, canvas.width, canvas.height);
        }
        else {
            this.g.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * drawSelectionBox  
     *   Draws the selection box.
     */
    drawSelectionBox(rect: rect): void {
        rect.x += this.origin.x;
        rect.y += this.origin.y;
        this.g.strokeStyle = CONST.SELECTION_COLOR;
        this.g.fillStyle = CONST.SELECTION_COLOR;
        this.g.globalAlpha = 0.1;
        this.g.fillRect(rect.x, rect.y, rect.w, rect.h);
        this.g.globalAlpha = 1.0;
        this.g.lineWidth = 1;
        this.lineStyle = { style: "solid" };
        this.g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    /**
     * drawLine  
     *   Draws a line.
     */
    drawLine(
        src: point,
        dst: point
    ): void {
        this.g.beginPath();
        this.g.moveTo(src.x + this.origin.x, src.y + this.origin.y);
        this.g.lineTo(dst.x + this.origin.x, dst.y + this.origin.y);
        this.g.stroke();
    }

    /**
     * drawQuadraticLine  
     *   Draws a quadratic bezier line between two points.
     */
    drawQuadraticLine(
        src: point,
        dst: point,
        ctl: point
    ): void {
        this.g.beginPath();
        this.g.moveTo(src.x + this.origin.x, src.y + this.origin.y);
        this.g.quadraticCurveTo(
            ctl.x + this.origin.x, ctl.y + this.origin.y,
            dst.x + this.origin.x, dst.y + this.origin.y
        );
        this.g.stroke();
    }

    /**
     * drawCubicLine  
     *   Draws a cubic bezier line between two points.
     */
    drawCubicLine(
        src: point,
        dst: point,
        ctl1: point,
        ctl2: point
    ): void {
        this.g.beginPath();
        this.g.moveTo(src.x + this.origin.x, src.y + this.origin.y);
        this.g.bezierCurveTo(
            ctl1.x + this.origin.x, ctl1.y + this.origin.y,
            ctl2.x + this.origin.x, ctl2.y + this.origin.y,
            dst.x + this.origin.x, dst.y + this.origin.x
        );
        this.g.stroke();
    }

    /**
     * drawArrow  
     *   Draws an arrow towards the destination point.
     * 
     *   The arrow is drawn by computing the unit vector from the given source and
     *   destination points and rotating, scaling, and translating the unit vector
     *   before drawing the left and right sides of the arrow.
     */
    drawArrow(
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

        // Draw arrow.
        this.drawLine(
            dst,
            {
                x: dst.x + CONST.GRID_SPACING * (u.x * MathEx.COS_150 - u.y * MathEx.SIN_150) / 2,
                y: dst.y + CONST.GRID_SPACING * (u.x * MathEx.SIN_150 + u.y * MathEx.COS_150) / 2
            }
        );
        this.drawLine(
            dst,
            {
                x: dst.x + CONST.GRID_SPACING * (u.x * MathEx.COS_150 + u.y * MathEx.SIN_150) / 2,
                y: dst.y + CONST.GRID_SPACING * (-u.x * MathEx.SIN_150 + u.y * MathEx.COS_150) / 2
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
        this.g.beginPath();
        this.g.arc(o.x + this.origin.x, o.y + this.origin.y, r, 0, 2 * Math.PI);
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
        let x = p.x + this.origin.x - s / 2;
        let y = p.y + this.origin.y - s / 2;
        this.g.fillStyle = fillColor;
        if (shadowColor) {
            this.g.shadowBlur = 20 * this._scale;
            this.g.shadowColor = shadowColor;
        }
        this.g.fillRect(x, y, s, s);
        this.g.shadowBlur = 0;
        if (borderWidth > 0) {
            this.lineStyle = { style: borderStyle, dotSize: borderWidth };
            this.g.lineWidth = borderWidth;
            this.g.strokeStyle = borderColor;
            this.g.lineJoin = "miter";
            this.g.strokeRect(x, y, s, s);
        }
    }

    /**
     * drawGrid  
     *   Draws the editor grid.
     */
    drawGrid() {

        let w = this.g.canvas.width;
        let h = this.g.canvas.height;

        let o = {
            x: this.origin.x % CONST.GRID_SPACING - CONST.GRID_SPACING,
            y: this.origin.y % CONST.GRID_SPACING - CONST.GRID_SPACING
        };

        // Major grid.
        this.g.strokeStyle = CONST.GRID_MAJOR_COLOR;
        this.g.lineWidth = CONST.GRID_MAJOR_WIDTH;
        this.lineStyle = { style: CONST.GRID_MAJOR_STYLE };
        this.drawGridLines(o, h, w);

        // Minor grid.
        this.g.strokeStyle = CONST.GRID_MINOR_COLOR;
        this.g.lineWidth = CONST.GRID_MINOR_WIDTH;
        this.lineStyle = { style: CONST.GRID_MINOR_STYLE };
        o.x += CONST.GRID_MINOR_OFFSET;
        o.y += CONST.GRID_MINOR_OFFSET;
        this.drawGridLines(o, h, w);

    }

    private drawGridLines(o: point, h: number, w: number) {
        for (let x = o.x; x < w + CONST.GRID_SPACING; x += CONST.GRID_SPACING) {
            this.g.beginPath();
            this.g.moveTo(x, 0);
            this.g.lineTo(x, h);
            this.g.stroke();
        }
        for (let y = o.y; y < h + CONST.GRID_SPACING; y += CONST.GRID_SPACING) {
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
        fontSize: number,
        fontFamily: string,
        color: string,
        borderWidth?: number,
        borderColor?: string
    ) {
        let x = p.x + this.origin.x;
        let y = p.y + this.origin.y - height / 2 + 1.5 * CONST.EDGE_FONT_SIZE / 2;
        this.g.font = fontSize + "pt " + fontFamily;
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
                y += 1.5 * fontSize;
            }
        }
        else {
            for (let l = 0; l < lines.length; l++) {
                this.g.fillText(lines[l], x, y);
                y += 1.5 * fontSize;
            }
        }
    }

    /**
     * drawEdgeLabel  
     *   Draws the edge label.
     */
    drawEdgeLabel(
        rect: rect,
        labelPt: point,
        height: number,
        lines: string[]
    ): void {
        rect.x += this.origin.x;
        rect.y += this.origin.y;
        this.g.fillStyle = "#fff";
        this.g.fillRect(rect.x, rect.y, rect.w, rect.h);
        this.g.shadowBlur = 0;
        this.g.strokeRect(rect.x, rect.y, rect.w, rect.h);
        this.drawText(
            labelPt,
            height,
            lines,
            CONST.EDGE_FONT_SIZE,
            CONST.EDGE_FONT_FAMILY,
            "#000"
        );
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
        this.drawCubicLine(src, dst, ctl1, ctl2);
        this.drawArrow(ctl1, src);
        this.drawArrow(ctl2, dst);
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
        this.drawCubicLine(src, dst, ctl1, ctl2);
        this.drawArrow(asrc, adst);
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
        this.drawCubicLine(src, dst, ctl1, ctl2);
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
        this.drawQuadraticLine(src, dst, ctl);
        this.drawArrow(ctl, src);
        this.drawArrow(ctl, dst);
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
        this.drawQuadraticLine(src, dst, ctl);
        this.drawArrow(ctl, adst);
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
        this.drawQuadraticLine(src, dst, ctl);
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
        this.drawLine(src, dst);
        this.drawArrow(dst, src);
        this.drawArrow(src, dst);
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
        this.drawLine(src, dst);
        this.drawArrow(asrc, adst);
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
        this.drawLine(src, dst);
    }


    // Get and Set methods /////////////////////////////////////////////////////


    set size(value: { h: number, w: number }) {
        let el = this.g.canvas;
        el.height = value.h * CONST.AA_SCALE;
        el.width = value.w * CONST.AA_SCALE;
        this.scale = this.scale;
    }

    set scale(value: number) {
        this._scale = CONST.AA_SCALE * value;
        this.g.setTransform(this._scale, 0, 0, this._scale, 0, 0);
    }

    get scale(): number {
        return this._scale / CONST.AA_SCALE;
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

    /**
     * getTextSize  
     *   Gets the bounding box of text.
     */
    getTextSize(
        lines: Array<string>,
        fontFamily: string,
        fontSize: number
    ) {
        this.g.font = fontSize + "pt " + fontFamily;
        let textHeight = lines.length * 1.5 * fontSize;
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
    getPt(e: MouseEvent): point {
        let canvas = this.g.canvas;
        let r = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) / (r.right - r.left) * canvas.width / this._scale - this.origin.x,
            y: (e.clientY - r.top) / (r.bottom - r.top) * canvas.height / this._scale - this.origin.y
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
        let pts: point[] = [];
        if (e.source && e.destination) {
            console.assert(srcDim, "error getStraightEdgePoints: srcDim undefined");
            console.assert(dstDim, "error getStraightEdgePoints: dstDim undefined");
            let v = {
                x: e.destination.position.x - e.source.position.x,
                y: e.destination.position.y - e.source.position.y
            };
            let d = MathEx.mag(v);
            let u: point = { x: v.x / d, y: v.y / d };
            let shiftPt = this.getEdgePtShift(u, e.source, srcDim);
            pts.push({
                x: e.source.position.x + shiftPt.x,
                y: e.source.position.y + shiftPt.y
            });
            u.x *= -1;
            u.y *= -1;
            shiftPt = this.getEdgePtShift(u, e.destination, dstDim);
            pts.push({
                x: e.source.position.x + v.x + shiftPt.x,
                y: e.source.position.y + v.y + shiftPt.y
            });
        }
        else if (e.source && !e.destination) {
            console.assert(pt, "error getStraightEdgePoints: pt undefined");
            console.assert(srcDim, "error getStraightEdgePoints: srcDim undefined");
            let p = pt as point;
            let v = {
                x: p.x - e.source.position.x,
                y: p.y - e.source.position.y
            };
            let d = MathEx.mag(v);
            let u: point = { x: v.x / d, y: v.y / d };
            let shiftPt = this.getEdgePtShift(u, e.source, srcDim);
            pts.push({
                x: e.source.position.x + shiftPt.x,
                y: e.source.position.y + shiftPt.y
            });
            pts.push(p);
        }
        else if (!e.source && e.destination) {
            console.assert(pt, "error getStraightEdgePoints: pt undefined");
            console.assert(dstDim, "error getStraightEdgePoints: dstDim undefined");
            let p = pt as point;
            let v = {
                x: e.destination.position.x - p.x,
                y: e.destination.position.y - p.y
            };
            let d = MathEx.mag(v);
            let u: point = { x: -v.x / d, y: -v.y / d };
            pts.push(p);
            let shiftPt = this.getEdgePtShift(u, e.destination, dstDim);
            pts.push({
                x: p.x + v.x + shiftPt.x,
                y: p.y + v.y + shiftPt.y
            });
        }
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
            x: src.position.x + 2 * CONST.GRID_SPACING * u.x,
            y: src.position.y + 2 * CONST.GRID_SPACING * u.y
        };
        let pt3: point = {
            x: src.position.x + 2 * CONST.GRID_SPACING * v.x,
            y: src.position.y + 2 * CONST.GRID_SPACING * v.y
        };
        let pts: point[] = [];
        pts.push({ x: src.position.x + pt0.x, y: src.position.y + pt0.y });
        pts.push({ x: src.position.x + pt1.x, y: src.position.y + pt1.y });
        pts.push({
            x: MathEx._5_3 * (pts[0].x + 3 * (pt2.x + pt3.x) + pts[1].x),
            y: MathEx._5_3 * (pts[0].y + 3 * (pt2.y + pt3.y) + pts[1].y)
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
            x: v.x / 2 + v.y / d * CONST.GRID_SPACING,
            y: v.y / 2 - v.x / d * CONST.GRID_SPACING
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
            x: MathEx._5_2 * (pt0.x + 2 * pt1.x + pt2.x),
            y: MathEx._5_2 * (pt0.y + 2 * pt1.y + pt2.y)
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
        let size = this.getTextSize(
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
