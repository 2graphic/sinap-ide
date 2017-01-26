// File: make-fn-edge.ts
// Created by: CJ Dimaano
// Date created: January 13, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//
// TODO:
// - Draw anchor points.


import * as CONST from "./constants";
import { GraphEditorCanvas, point } from "./canvas";
import { DrawableEdge } from "./drawable-interfaces";


/**
 * makeFnEdge  
 *   Makes a draw function for a given edge.
 */
export function makeFnEdge(
    canvas: GraphEditorCanvas,
    g: CanvasRenderingContext2D,
    e: DrawableEdge,
    pts: point[],
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
        let size = canvas.getTextSize(lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
        let rect = canvas.makeRect(src, dst);
        // Get the center point of the label.
        let labelPt = pts[2];
        // Get the label background rectangle.
        size.w /= 2;
        size.h /= 2;
        rect = canvas.makeRect([labelPt[0] - size.w - 6, labelPt[1] - size.h], [labelPt[0] + size.w + 6, labelPt[1] + size.h]);
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
                                canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.fillStyle = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                                canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                                g.globalAlpha = 1;
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                g.globalAlpha = 0.5;
                                canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                g.shadowBlur = 20 * canvas.scale;
                                g.shadowColor = CONST.SELECTION_COLOR;
                                canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                g.fillStyle = "#fff";
                                g.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g.shadowBlur = 0;
                                g.strokeRect(rect.x, rect.y, rect.w, rect.h);
                                canvas.drawText(
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
                                canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                                canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Quadratic
                        case 4:
                            let ctl = pts[3];
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
                            };
                        // Straight
                        default:
                            return () => {
                                g.lineJoin = "round";
                                canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                                canvas.drawEdgeLabel(rect, labelPt, size.h, lines);
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
                            canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            g.shadowBlur = 0;
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            g.shadowBlur = 0;
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, src);
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, dst, src);
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl, dst);
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, src, dst);
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl1, ctl2);
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst, ctl);
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 2, "solid", src, dst);
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            g.shadowBlur = 0;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            g.shadowBlur = 0;
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
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
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
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
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
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
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                        };
                }
            }
        }
    }
}
