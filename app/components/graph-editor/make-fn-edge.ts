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
        let rect = canvas.makeRect(src[0], src[1], dst[0], dst[1]);
        // Get the center point of the label.
        let labelPt = pts[2];
        // Get the label background rectangle.
        size.w /= 2;
        size.h /= 2;
        rect = canvas.makeRect(labelPt[0] - size.w - 6, labelPt[1] - size.h, labelPt[0] + size.w + 6, labelPt[1] + size.h);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
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
                                g.shadowBlur = 20 * CONST.AA_SCALE;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                                canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(g, rect, labelPt, size.h, lines);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeBothArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            canvas.drawCubicEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            canvas.drawCubicEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeNoArrows(g, CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * CONST.AA_SCALE;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeBothArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            canvas.drawCubicEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(g, e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            canvas.drawCubicEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeNoArrows(g, e.color, e.lineWidth, e.lineStyle, src, dst);
                        };
                }
            }
        }
    }
}
