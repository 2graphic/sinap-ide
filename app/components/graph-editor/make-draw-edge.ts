// File: make-draw-edge.ts
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
export function makeDrawEdge(
    canvas: GraphEditorCanvas,
    g: CanvasRenderingContext2D,
    e: DrawableEdge,
    pts: point[],
    isDragging: boolean,
    isHovered: boolean
): () => void {
    // Endpoints for the given edge.
    let src = pts[0];
    let dst = pts[1];
    if (e.label.trim() !== "") {
        // Split the label into lines.
        let lines = e.label.split("\n");
        // Get the bounding box of the label.
        let size = canvas.getTextSize(lines);
        // Get the center point of the label.
        let labelPt = pts[2];
        if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {
                /////////////////////////////////////
                // Labelled, Dragging, Both Arrows //
                /////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                }
            }
            else if (e.showSourceArrow && !e.showDestinationArrow) {
                //////////////////////////////////////
                // Labelled, Dragging, Source Arrow //
                //////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                }
            }
            else if (!e.showSourceArrow && e.showDestinationArrow) {
                ///////////////////////////////////////////
                // Labelled, Dragging, Destination Arrow //
                ///////////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                }
            }
            else {
                ///////////////////////////////////
                // Labelled, Dragging, No Arrows //
                ///////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                    // Straight
                    default:
                        return () => {
                            g.globalAlpha = 0.5;
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                            g.globalAlpha = 1;
                        };
                }
            }
        }
        else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {
                ////////////////////////////////////
                // Labelled, Hovered, Both Arrows //
                ////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
            else if (e.showSourceArrow && !e.showDestinationArrow) {
                /////////////////////////////////////
                // Labelled, Hovered, Source Arrow //
                /////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
            else if (!e.showSourceArrow && e.showDestinationArrow) {
                //////////////////////////////////////////
                // Labelled, Hovered, Destination Arrow //
                //////////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
            else {
                //////////////////////////////////
                // Labelled, Hovered, No Arrows //
                //////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            g.shadowBlur = 20 * canvas.scale;
                            g.shadowColor = CONST.SELECTION_COLOR;
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
        }
        else {
            if (e.showSourceArrow && e.showDestinationArrow) {
                ////////////////////////////////////
                // Labelled, Default, Both Arrows //
                ////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            canvas.drawCubicEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeBothArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
            else if (e.showSourceArrow && !e.showDestinationArrow) {
                /////////////////////////////////////
                // Labelled, Default, Source Arrow //
                /////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl1, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, dst, src);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
            else if (!e.showSourceArrow && e.showDestinationArrow) {
                //////////////////////////////////////////
                // Labelled, Default, Destination Arrow //
                //////////////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            canvas.drawCubicEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2, ctl2, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, ctl, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeOneArrow(e.color, e.lineWidth, e.lineStyle, src, dst, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
            else {
                //////////////////////////////////
                // Labelled, Default, No Arrows //
                //////////////////////////////////
                switch (pts.length) {
                    // Bezier
                    case 5:
                        let ctl1 = pts[3];
                        let ctl2 = pts[4];
                        return () => {
                            canvas.drawCubicEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl1, ctl2);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Quadratic
                    case 4:
                        let ctl = pts[3];
                        return () => {
                            canvas.drawQuadraticEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst, ctl);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                    // Straight
                    default:
                        return () => {
                            canvas.drawStraightEdgeNoArrows(e.color, e.lineWidth, e.lineStyle, src, dst);
                            canvas.drawEdgeLabel(labelPt, size, lines);
                        };
                }
            }
        }
    }
    else {
        if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {
                ///////////////////////////////////////
                // Unlabelled, Dragging, Both Arrows //
                ///////////////////////////////////////
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
                ////////////////////////////////////////
                // Unlabelled, Dragging, Source Arrow //
                ////////////////////////////////////////
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
                /////////////////////////////////////////////
                // Unlabelled, Dragging, Destination Arrow //
                /////////////////////////////////////////////
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
                /////////////////////////////////////
                // Unlabelled, Dragging, No Arrows //
                /////////////////////////////////////
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
                //////////////////////////////////////
                // Unlabelled, Hovered, Both Arrows //
                //////////////////////////////////////
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
                ///////////////////////////////////////
                // Unlabelled, Hovered, Source Arrow //
                ///////////////////////////////////////
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
                ////////////////////////////////////////////
                // Unlabelled, Hovered, Destination Arrow //
                ////////////////////////////////////////////
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
                ////////////////////////////////////
                // Unlabelled, Hovered, No Arrows //
                ////////////////////////////////////
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
                //////////////////////////////////////
                // Unlabelled, Default, Both Arrows //
                //////////////////////////////////////
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
                ///////////////////////////////////////
                // Unlabelled, Default, Source Arrow //
                ///////////////////////////////////////
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
                ////////////////////////////////////////////
                // Unlabelled, Default, Destination Arrow //
                ////////////////////////////////////////////
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
                ////////////////////////////////////
                // Unlabelled, Default, No Arrows //
                ////////////////////////////////////
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

export function makeDrawSelectedEdge(
    canvas: GraphEditorCanvas,
    g: CanvasRenderingContext2D,
    e: DrawableEdge,
    pts: point[],
    isHovered: boolean
) {
    let src = pts[0];
    let dst = pts[1];
    if (e.label.trim() !== "") {
        // Split the label into lines.
        let lines = e.label.split("\n");
        // Get the bounding box of the label.
        let size = canvas.getTextSize(lines);
        // Get the center point of the label.
        let labelPt = pts[2];
        // Get the label background rectangle.
        size.w += 4;
        size.h += 4;
        //////////////////////
        // Labeled, Hovered //
        //////////////////////
        if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    g.shadowBlur = 20 * canvas.scale;
                    g.shadowColor = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
            else if (e.showSourceArrow && !e.showDestinationArrow) {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    g.shadowBlur = 20 * canvas.scale;
                    g.shadowColor = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[3], src);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], src);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, dst, src);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
            else if (!e.showSourceArrow && e.showDestinationArrow) {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    g.shadowBlur = 20 * canvas.scale;
                    g.shadowColor = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[4], dst);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], dst);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, src, dst);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
            else {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    g.shadowBlur = 20 * canvas.scale;
                    g.shadowColor = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
        }
        //////////////////////
        // Labeled, Default //
        //////////////////////
        else {
            if (e.showSourceArrow && e.showDestinationArrow) {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
            else if (e.showSourceArrow && !e.showDestinationArrow) {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[3], src);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], src);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, dst, src);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
            else if (!e.showSourceArrow && e.showDestinationArrow) {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[4], dst);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], dst);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, src, dst);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
            else {
                return () => {
                    g.fillStyle = CONST.SELECTION_COLOR;
                    switch (pts.length) {
                        // Bezier
                        case 5:
                            canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                            break;
                        // Quadratic
                        case 4:
                            canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                            break;
                        // Straight
                        default:
                            canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                            break;
                    }
                    g.lineWidth = e.lineWidth;
                    canvas.drawEdgeLabelRect(labelPt, size);
                };
            }
        }
    }
    /////////////////////////
    // Unlabelled, Hovered //
    /////////////////////////
    if (isHovered) {
        if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
                g.shadowBlur = 20 * canvas.scale;
                g.shadowColor = CONST.SELECTION_COLOR;
                switch (pts.length) {
                    // Bezier
                    case 5:
                        canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                        break;
                    // Quadratic
                    case 4:
                        canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                        break;
                    // Straight
                    default:
                        canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                        break;
                }
                g.shadowBlur = 0;
            };
        }
        else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
                g.shadowBlur = 20 * canvas.scale;
                g.shadowColor = CONST.SELECTION_COLOR;
                switch (pts.length) {
                    // Bezier
                    case 5:
                        canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[3], src);
                        break;
                    // Quadratic
                    case 4:
                        canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], src);
                        break;
                    // Straight
                    default:
                        canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, dst, src);
                        break;
                }
                g.shadowBlur = 0;
            };
        }
        else if (!e.showSourceArrow && e.showDestinationArrow) {
            return () => {
                g.shadowBlur = 20 * canvas.scale;
                g.shadowColor = CONST.SELECTION_COLOR;
                switch (pts.length) {
                    // Bezier
                    case 5:
                        canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[4], dst);
                        break;
                    // Quadratic
                    case 4:
                        canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], dst);
                        break;
                    // Straight
                    default:
                        canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, src, dst);
                        break;
                }
                g.shadowBlur = 0;
            };
        }
        else {
            return () => {
                g.shadowBlur = 20 * canvas.scale;
                g.shadowColor = CONST.SELECTION_COLOR;
                switch (pts.length) {
                    // Bezier
                    case 5:
                        canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                        break;
                    // Quadratic
                    case 4:
                        canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                        break;
                    // Straight
                    default:
                        canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                        break;
                }
                g.shadowBlur = 0;
            };
        }
    }
    /////////////////////////
    // Unlabelled, Default //
    /////////////////////////
    if (e.showSourceArrow && e.showDestinationArrow) {
        return () => {
            switch (pts.length) {
                // Bezier
                case 5:
                    canvas.drawCubicEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                    break;
                // Quadratic
                case 4:
                    canvas.drawQuadraticEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                    break;
                // Straight
                default:
                    canvas.drawStraightEdgeBothArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                    break;
            }
        };
    }
    else if (e.showSourceArrow && !e.showDestinationArrow) {
        return () => {
            switch (pts.length) {
                // Bezier
                case 5:
                    canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[3], src);
                    break;
                // Quadratic
                case 4:
                    canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], src);
                    break;
                // Straight
                default:
                    canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, dst, src);
                    break;
            }
        };
    }
    else if (!e.showSourceArrow && e.showDestinationArrow) {
        return () => {
            switch (pts.length) {
                // Bezier
                case 5:
                    canvas.drawCubicEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4], pts[4], dst);
                    break;
                // Quadratic
                case 4:
                    canvas.drawQuadraticEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], dst);
                    break;
                // Straight
                default:
                    canvas.drawStraightEdgeOneArrow(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, src, dst);
                    break;
            }
        };
    }
    else {
        return () => {
            switch (pts.length) {
                // Bezier
                case 5:
                    canvas.drawCubicEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3], pts[4]);
                    break;
                // Quadratic
                case 4:
                    canvas.drawQuadraticEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst, pts[3]);
                    break;
                // Straight
                default:
                    canvas.drawStraightEdgeNoArrows(CONST.SELECTION_COLOR, e.lineWidth + 4, "solid", src, dst);
                    break;
            }
        };
    }
}