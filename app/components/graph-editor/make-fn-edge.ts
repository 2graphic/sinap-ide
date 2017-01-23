// File: make-fn-edge.ts
// Created by: CJ Dimaano
// Date created: January 13, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//
// TODO:
// - Draw anchor points.


import * as CONST from "./constants";
import * as canvas from "./canvas";
import { DrawableEdge } from "./drawable-interfaces";


/**
 * makeFnEdge  
 *   Makes a draw function for a given edge.
 */
export function makeFnEdge(
    g: CanvasRenderingContext2D,
    e: DrawableEdge,
    pts: number[][],
    isDragging: boolean,
    isHovered: boolean,
    isSelected: boolean
): () => void {

    // Endpoints for the given edge.
    let src = pts[0];
    let dst = pts[1];

    if (e.label.trim() !== "") {
        // Split the label into lines.
        let lines = e.label.split("\n");
        // Get the bounding box of the label.
        let size = canvas.getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
        let rect = canvas.makeRect(
            src[0], src[1],
            dst[0], dst[1]
        );
        // Get the center point of the label.
        let labelPt = pts[2];
        // Get the label background rectangle.
        size.w /= 2;
        size.h /= 2;
        rect = canvas.makeRect(
            labelPt[0] - size.w - 6, labelPt[1] - size.h,
            labelPt[0] + size.w + 6, labelPt[1] + size.h
        );

        if (isSelected) {
            if (isDragging) {
                if (e.showSourceArrow && e.showDestinationArrow) {

                    ///////////////////////////////////////////////
                    // Labelled, Selected, Dragging, Both Arrows //
                    ///////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }

                }

                else if (e.showSourceArrow && !e.showDestinationArrow) {

                    ////////////////////////////////////////////////
                    // Labelled, Selected, Dragging, Source Arrow //
                    ////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }

                }

                else if (!e.showSourceArrow && e.showDestinationArrow) {

                    /////////////////////////////////////////////////////
                    // Labelled, Selected, Dragging, Destination Arrow //
                    /////////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                    }

                }

                else {

                    /////////////////////////////////////////////
                    // Labelled, Selected, Dragging, No Arrows //
                    /////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }
                }

            }

            else if (isHovered) {
                if (e.showSourceArrow && e.showDestinationArrow) {

                    //////////////////////////////////////////////
                    // Labelled, Selected, Hovered, Both Arrows //
                    //////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (e.showSourceArrow && !e.showDestinationArrow) {

                    ///////////////////////////////////////////////
                    // Labelled, Selected, Hovered, Source Arrow //
                    ///////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (!e.showSourceArrow && e.showDestinationArrow) {

                    ////////////////////////////////////////////////////
                    // Labelled, Selected, Hovered, Destination Arrow //
                    ////////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else {

                    ////////////////////////////////////////////
                    // Labelled, Selected, Hovered, No Arrows //
                    ////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }
                }

            }

            else {
                if (e.showSourceArrow && e.showDestinationArrow) {

                    //////////////////////////////////////////////
                    // Labelled, Selected, Default, Both Arrows //
                    //////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (e.showSourceArrow && !e.showDestinationArrow) {

                    ///////////////////////////////////////////////
                    // Labelled, Selected, Default, Source Arrow //
                    ///////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (!e.showSourceArrow && e.showDestinationArrow) {

                    ////////////////////////////////////////////////////
                    // Labelled, Selected, Default, Destination Arrow //
                    ////////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else {

                    ////////////////////////////////////////////
                    // Labelled, Selected, Default, No Arrows //
                    ////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = CONST.SELECTION_COLOR;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.lineWidth = e.lineWidth + 2;
                                canvas.setLineStyle(g, "solid");
                                canvas.drawLine(g, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }
                }
            }

        }

        else {
            if (isDragging) {
                if (e.showSourceArrow && e.showDestinationArrow) {

                    /////////////////////////////////////////////////
                    // Labelled, Unselected, Dragging, Both Arrows //
                    /////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }

                }

                else if (e.showSourceArrow && !e.showDestinationArrow) {

                    //////////////////////////////////////////////////
                    // Labelled, Unselected, Dragging, Source Arrow //
                    //////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }

                }

                else if (!e.showSourceArrow && e.showDestinationArrow) {

                    ///////////////////////////////////////////////////////
                    // Labelled, Unselected, Dragging, Destination Arrow //
                    ///////////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }

                }

                else {

                    ///////////////////////////////////////////////
                    // Labelled, Unselected, Dragging, No Arrows //
                    ///////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.globalAlpha = 0.5;
                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                                g.globalAlpha = 1;
                            };
                    }
                }

            }

            else if (isHovered) {
                if (e.showSourceArrow && e.showDestinationArrow) {

                    ////////////////////////////////////////////////
                    // Labelled, Unselected, Hovered, Both Arrows //
                    ////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (e.showSourceArrow && !e.showDestinationArrow) {

                    /////////////////////////////////////////////////
                    // Labelled, Unselected, Hovered, Source Arrow //
                    /////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (!e.showSourceArrow && e.showDestinationArrow) {

                    //////////////////////////////////////////////////////
                    // Labelled, Unselected, Hovered, Destination Arrow //
                    //////////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else {

                    //////////////////////////////////////////////
                    // Labelled, Unselected, Hovered, No Arrows //
                    //////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticLine(g, src, dst, ctl);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawLine(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }
                }

            }

            else {
                if (e.showSourceArrow && e.showDestinationArrow) {

                    ////////////////////////////////////////////////
                    // Labelled, Unselected, Default, Both Arrows //
                    ////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (e.showSourceArrow && !e.showDestinationArrow) {

                    /////////////////////////////////////////////////
                    // Labelled, Unselected, Default, Source Arrow //
                    /////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl1, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, dst, src);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else if (!e.showSourceArrow && e.showDestinationArrow) {

                    //////////////////////////////////////////////////////
                    // Labelled, Unselected, Default, Destination Arrow //
                    //////////////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                                canvas.drawArrow(g, ctl2, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);
                                canvas.drawArrow(g, ctl, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);
                                canvas.drawArrow(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };
                    }

                }

                else {

                    //////////////////////////////////////////////
                    // Labelled, Unselected, Default, No Arrows //
                    //////////////////////////////////////////////
                    switch (pts.length) {

                        // Bezier
                        case 5:
                            let ctl1 = pts[3];
                            let ctl2 = pts[4];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawQuadraticLine(g, src, dst, ctl);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";

                                g.strokeStyle = e.color;
                                g.lineWidth = e.lineWidth;
                                canvas.setLineStyle(g, e.lineStyle);
                                canvas.drawLine(g, src, dst);

                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
                                    g,
                                    labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
                                    lines,
                                    CONST.EDGE_FONT_SIZE,
                                    CONST.EDGE_FONT_FAMILY,
                                    "#000"
                                );
                            };

                    }

                }
            }
        }
    }

    if (isSelected) {
        if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {

                /////////////////////////////////////////////////
                // Unlabelled, Selected, Dragging, Both Arrows //
                /////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                            g.globalAlpha = 1;
                        };
                }

            }

            else if (e.showSourceArrow && !e.showDestinationArrow) {

                //////////////////////////////////////////////////
                // Unlabelled, Selected, Dragging, Source Arrow //
                //////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            g.globalAlpha = 1;
                        };
                }

            }

            else if (!e.showSourceArrow && e.showDestinationArrow) {

                ///////////////////////////////////////////////////////
                // Unlabelled, Selected, Dragging, Destination Arrow //
                ///////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                            g.globalAlpha = 1;
                        };
                }

            }

            else {

                ///////////////////////////////////////////////
                // Unlabelled, Selected, Dragging, No Arrows //
                ///////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            g.globalAlpha = 1;
                        };

                }

            }
        }

        else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {

                ////////////////////////////////////////////////
                // Unlabelled, Selected, Hovered, Both Arrows //
                ////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                        };
                }

            }

            else if (e.showSourceArrow && !e.showDestinationArrow) {

                /////////////////////////////////////////////////
                // Unlabelled, Selected, Hovered, Source Arrow //
                /////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                        };
                }

            }

            else if (!e.showSourceArrow && e.showDestinationArrow) {

                //////////////////////////////////////////////////////
                // Unlabelled, Selected, Hovered, Destination Arrow //
                //////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                        };
                }

            }

            else {

                //////////////////////////////////////////////
                // Unlabelled, Selected, Hovered, No Arrows //
                //////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            g.shadowBlur = 0;

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                        };

                }

            }
        }

        else {
            if (e.showSourceArrow && e.showDestinationArrow) {

                ////////////////////////////////////////////////
                // Unlabelled, Selected, Default, Both Arrows //
                ////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                        };

                }

            }

            else if (e.showSourceArrow && !e.showDestinationArrow) {

                /////////////////////////////////////////////////
                // Unlabelled, Selected, Default, Source Arrow //
                /////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                        };

                }

            }

            else if (!e.showSourceArrow && e.showDestinationArrow) {

                //////////////////////////////////////////////////////
                // Unlabelled, Selected, Default, Destination Arrow //
                //////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                        };

                }

            }

            else {

                //////////////////////////////////////////////
                // Unlabelled, Selected, Default, No Arrows //
                //////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawQuadraticLine(g, src, dst, ctl);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = CONST.SELECTION_COLOR;
                            g.lineWidth = e.lineWidth + 2;
                            canvas.setLineStyle(g, "solid");
                            canvas.drawLine(g, src, dst);

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                        };

                }

            }
        }
    }

    else {
        if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {

                ///////////////////////////////////////////////////
                // Unlabelled, Unselected, Dragging, Both Arrows //
                ///////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                            g.globalAlpha = 1;
                        };

                }

            }

            else if (e.showSourceArrow && !e.showDestinationArrow) {

                ////////////////////////////////////////////////////
                // Unlabelled, Unselected, Dragging, Source Arrow //
                ////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            g.globalAlpha = 1;
                        };

                }

            }

            else if (!e.showSourceArrow && e.showDestinationArrow) {

                /////////////////////////////////////////////////////////
                // Unlabelled, Unselected, Dragging, Destination Arrow //
                /////////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                            g.globalAlpha = 1;
                        };

                }

            }

            else {

                /////////////////////////////////////////////////
                // Unlabelled, Unselected, Dragging, No Arrows //
                /////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            g.globalAlpha = 1;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.globalAlpha = 0.5;
                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            g.globalAlpha = 1;
                        };

                }

            }
        }

        else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {

                //////////////////////////////////////////////////
                // Unlabelled, Unselected, Hovered, Both Arrows //
                //////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                            g.shadowBlur = 0;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                            g.shadowBlur = 0;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                            g.shadowBlur = 0;
                        };

                }

            }

            else if (e.showSourceArrow && !e.showDestinationArrow) {

                ///////////////////////////////////////////////////
                // Unlabelled, Unselected, Hovered, Source Arrow //
                ///////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            g.shadowBlur = 0;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            g.shadowBlur = 0;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            g.shadowBlur = 0;
                        };

                }

            }

            else if (!e.showSourceArrow && e.showDestinationArrow) {

                ////////////////////////////////////////////////////////
                // Unlabelled, Unselected, Hovered, Destination Arrow //
                ////////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                            g.shadowBlur = 0;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                            g.shadowBlur = 0;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                            g.shadowBlur = 0;
                        };

                }

            }

            else {

                ////////////////////////////////////////////////
                // Unlabelled, Unselected, Hovered, No Arrows //
                ////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            g.shadowBlur = 0;
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawLine(g, src, dst);
                            g.shadowBlur = 0;
                        };

                }

            }
        }

        else {
            if (e.showSourceArrow && e.showDestinationArrow) {

                //////////////////////////////////////////////////
                // Unlabelled, Unselected, Default, Both Arrows //
                //////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                            canvas.drawArrow(g, ctl2, dst);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                            canvas.drawArrow(g, ctl, dst);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                            canvas.drawArrow(g, src, dst);
                        };

                }

            }

            else if (e.showSourceArrow && !e.showDestinationArrow) {

                ///////////////////////////////////////////////////
                // Unlabelled, Unselected, Default, Source Arrow //
                ///////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl1, src);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, src);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, dst, src);
                        };

                }

            }

            else if (!e.showSourceArrow && e.showDestinationArrow) {

                ////////////////////////////////////////////////////////
                // Unlabelled, Unselected, Default, Destination Arrow //
                ////////////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                            canvas.drawArrow(g, ctl2, dst);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                            canvas.drawArrow(g, ctl, dst);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                            canvas.drawArrow(g, src, dst);
                        };

                }

            }

            else {

                ////////////////////////////////////////////////
                // Unlabelled, Unselected, Default, No Arrows //
                ////////////////////////////////////////////////
                switch (pts.length) {

                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawCubicLine(g, src, dst, ctl1, ctl2);
                        };

                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawQuadraticLine(g, src, dst, ctl);
                        };

                    // Straight
                    default:
                        return () => {
                            g.lineJoin = "round";

                            g.strokeStyle = e.color;
                            g.lineWidth = e.lineWidth;
                            canvas.setLineStyle(g, e.lineStyle);
                            canvas.drawLine(g, src, dst);
                        };

                }

            }
        }
    }
}
