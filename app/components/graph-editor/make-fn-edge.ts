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


export function makeFnEdge(
  g: CanvasRenderingContext2D,
  e: DrawableEdge,
  pts: number[],
  isDragging: boolean,
  isHovered: boolean,
  isSelected: boolean
): () => void {

  let src = [pts[0], pts[1]];
  let dst = [pts[2], pts[3]];

  switch (pts.length) {
    case 4:
      if (e.label.trim() !== "") {
        let lines = e.label.split("\n");
        let size = canvas.getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
        let rect = canvas.makeRect(
          src[0], src[1],
          dst[0], dst[1]
        );
        let labelPt = [
          rect.x + rect.w / 2,
          rect.y + rect.h / 2
        ];
        size.w /= 2;
        size.h /= 2;
        rect = canvas.makeRect(
          labelPt[0] - size.w - 6, labelPt[1] - size.h,
          labelPt[0] + size.w + 6, labelPt[1] + size.h
        );

        ////////////////////////////////////////////////////////////////////////////////
        // Straight, Label, Selected, Dragging, Both Arrows ////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        if (isSelected) {
          if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {
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
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Dragging, Source Arrow ///////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                canvas.drawArrow(g, dst, src);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Dragging, Destination Arrow //////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                canvas.drawArrow(g, src, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Dragging, No Arrows //////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, Label, Selected, Hovered, Both Arrows /////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {
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
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Hovered, Source Arrow ////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
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
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Hovered, Destination Arrow ///////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Hovered, No Arrows ///////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                g.shadowBlur = 20 * CONST.AA_SCALE;
                g.shadowColor = CONST.SELECTION_COLOR;
                canvas.drawLine(g, src, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, Label, Selected, Default, Both Arrows /////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                canvas.drawArrow(g, dst, src);
                canvas.drawArrow(g, src, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Default, Source Arrow ////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                canvas.drawArrow(g, dst, src);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Default, Destination Arrow ///////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                canvas.drawArrow(g, src, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Selected, Default, No Arrows ///////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawLine(g, src, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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






        ////////////////////////////////////////////////////////////////////////////////
        // Straight, Label, Unselected, Dragging, Both Arrows //////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else {
          if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Dragging, Source Arrow /////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Dragging, Destination Arrow ////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Dragging, No Arrows ////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, Label, Unselected, Hovered, Both Arrows ///////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Hovered, Source Arrow //////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Hovered, Destination Arrow /////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Hovered, No Arrows /////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, Label, Unselected, Default, Both Arrows ///////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
            if (e.showSourceArrow && e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Default, Source Arrow //////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Default, Destination Arrow /////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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

            ////////////////////////////////////////////////////////////////////////////////
            // Straight, Label, Unselected, Default, No Arrows /////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
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





      ////////////////////////////////////////////////////////////////////////////////
      // Straight, No Label, Selected, Dragging, Both Arrows /////////////////////////
      ////////////////////////////////////////////////////////////////////////////////

      if (isSelected) {
        if (isDragging) {
          if (e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Dragging, Source Arrow ////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Dragging, Destination Arrow ///////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Dragging, No Arrows ///////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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

        ////////////////////////////////////////////////////////////////////////////////
        // Straight, No Label, Selected, Hovered, Both Arrows //////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else if (isHovered) {
          if (e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Hovered, Source Arrow /////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Hovered, Destination Arrow ////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Hovered, No Arrows ////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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

        ////////////////////////////////////////////////////////////////////////////////
        // Straight, No Label, Selected, Default, Both Arrows //////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else {
          if (e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Default, Source Arrow /////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Default, Destination Arrow ////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Selected, Default, No Arrows ////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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

      ////////////////////////////////////////////////////////////////////////////////
      // Straight, No Label, Unselected, Dragging, Both Arrows ///////////////////////
      ////////////////////////////////////////////////////////////////////////////////

      else {
        if (isDragging) {
          if (e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Dragging, Source Arrow //////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Dragging, Destination Arrow /////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Dragging, No Arrows /////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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

        ////////////////////////////////////////////////////////////////////////////////
        // Straight, No Label, Unselected, Hovered, Both Arrows ////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else if (isHovered) {
          if (e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Hovered, Source Arrow ///////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Hovered, Destination Arrow //////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Hovered, No Arrows //////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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

        ////////////////////////////////////////////////////////////////////////////////
        // Straight, No Label, Unselected, Default, Both Arrows ////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else {
          if (e.showSourceArrow && e.showDestinationArrow) {
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

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Default, Source Arrow ///////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawLine(g, src, dst);
              canvas.drawArrow(g, dst, src);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Default, Destination Arrow //////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawLine(g, src, dst);
              canvas.drawArrow(g, src, dst);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Straight, No Label, Unselected, Default, No Arrows //////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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









    case 6:
      let ctl = [pts[4], pts[5]];
      if (e.label.trim() !== "") {
        let lines = e.label.split("\n");
        let size = canvas.getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
        let rect = canvas.makeRect(
          src[0], src[1],
          dst[0], dst[1]
        );
        let labelPt = [
          rect.x + rect.w / 2,
          rect.y + rect.h / 2
        ];
        size.w /= 2;
        size.h /= 2;
        rect = canvas.makeRect(
          labelPt[0] - size.w - 6, labelPt[1] - size.h,
          labelPt[0] + size.w + 6, labelPt[1] + size.h
        );

        ////////////////////////////////////////////////////////////////////////////////
        // Quadratic, Label, Selected, Dragging, Both Arrows ///////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        if (isSelected) {
          if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
                canvas.drawArrow(g, ctl, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Dragging, Source Arrow ///////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Dragging, Destination Arrow //////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, ctl, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Dragging, No Arrows //////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, Label, Selected, Hovered, Both Arrows /////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                g.shadowBlur = 20 * CONST.AA_SCALE;
                g.shadowColor = CONST.SELECTION_COLOR;
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
                canvas.drawArrow(g, ctl, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
              };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Hovered, Source Arrow ////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                g.shadowBlur = 20 * CONST.AA_SCALE;
                g.shadowColor = CONST.SELECTION_COLOR;
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
              };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Hovered, Destination Arrow ///////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Hovered, No Arrows ///////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                g.shadowBlur = 20 * CONST.AA_SCALE;
                g.shadowColor = CONST.SELECTION_COLOR;
                canvas.drawQuadraticLine(g, src, dst, ctl);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.shadowBlur = 0;
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, Label, Selected, Default, Both Arrows /////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
                canvas.drawArrow(g, ctl, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
              };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Default, Source Arrow ////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
              };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Default, Destination Arrow ///////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, ctl, dst);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Selected, Default, No Arrows ///////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = CONST.SELECTION_COLOR;
                g.fillStyle = CONST.SELECTION_COLOR;
                g.lineWidth = e.lineWidth + 2;
                canvas.setLineStyle(g, "solid");
                canvas.drawQuadraticLine(g, src, dst, ctl);
                g.fillRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);
                g.strokeRect(rect.x - 2, rect.y - 2, rect.w + 2, rect.h + 2);

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
            }
          }
        }






        ////////////////////////////////////////////////////////////////////////////////
        // Quadratic, Label, Unselected, Dragging, Both Arrows //////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else {
          if (isDragging) {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Dragging, Source Arrow /////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.globalAlpha = 0.5;
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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Dragging, Destination Arrow ////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Dragging, No Arrows ////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
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
            }
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, Label, Unselected, Hovered, Both Arrows ///////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (isHovered) {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = e.color;
                g.lineWidth = e.lineWidth;
                canvas.setLineStyle(g, e.lineStyle);
                g.shadowBlur = 20 * CONST.AA_SCALE;
                g.shadowColor = CONST.SELECTION_COLOR;
                canvas.drawQuadraticLine(g, src, dst, ctl);
                canvas.drawArrow(g, dst, src);
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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Hovered, Source Arrow //////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

                g.strokeStyle = e.color;
                g.lineWidth = e.lineWidth;
                canvas.setLineStyle(g, e.lineStyle);
                g.shadowBlur = 20 * CONST.AA_SCALE;
                g.shadowColor = CONST.SELECTION_COLOR;
                canvas.drawQuadraticLine(g, src, dst, ctl);
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

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Hovered, Destination Arrow /////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Hovered, No Arrows /////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
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
            }
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, Label, Unselected, Default, Both Arrows ///////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
            if (e.showSourceArrow && e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

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
              };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Default, Source Arrow //////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (e.showSourceArrow && !e.showDestinationArrow) {
              return () => {
                g.lineJoin = "round";

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
              };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Default, Destination Arrow /////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else if (!e.showSourceArrow && e.showDestinationArrow) {
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
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Quadratic, Label, Unselected, Default, No Arrows /////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////

            else {
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
            }
          }
        }
      }





      ////////////////////////////////////////////////////////////////////////////////
      // Quadratic, No Label, Selected, Dragging, Both Arrows /////////////////////////
      ////////////////////////////////////////////////////////////////////////////////

      if (isSelected) {
        if (isDragging) {
          if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.globalAlpha = 0.5;
              g.strokeStyle = CONST.SELECTION_COLOR;
              g.lineWidth = e.lineWidth + 2;
              canvas.setLineStyle(g, "solid");
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
              g.globalAlpha = 1;
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Dragging, Source Arrow ////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.globalAlpha = 0.5;
              g.strokeStyle = CONST.SELECTION_COLOR;
              g.lineWidth = e.lineWidth + 2;
              canvas.setLineStyle(g, "solid");
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              g.globalAlpha = 1;
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Dragging, Destination Arrow ///////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Dragging, No Arrows ///////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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
          }
        }

        ////////////////////////////////////////////////////////////////////////////////
        // Quadratic, No Label, Selected, Hovered, Both Arrows //////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else if (isHovered) {
          if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = CONST.SELECTION_COLOR;
              g.lineWidth = e.lineWidth + 2;
              canvas.setLineStyle(g, "solid");
              g.shadowBlur = 20 * CONST.AA_SCALE;
              g.shadowColor = CONST.SELECTION_COLOR;
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
              g.shadowBlur = 0;

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Hovered, Source Arrow /////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = CONST.SELECTION_COLOR;
              g.lineWidth = e.lineWidth + 2;
              canvas.setLineStyle(g, "solid");
              g.shadowBlur = 20 * CONST.AA_SCALE;
              g.shadowColor = CONST.SELECTION_COLOR;
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              g.shadowBlur = 0;

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Hovered, Destination Arrow ////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Hovered, No Arrows ////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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
          }
        }

        ////////////////////////////////////////////////////////////////////////////////
        // Quadratic, No Label, Selected, Default, Both Arrows //////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else {
          if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = CONST.SELECTION_COLOR;
              g.lineWidth = e.lineWidth + 2;
              canvas.setLineStyle(g, "solid");
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Default, Source Arrow /////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = CONST.SELECTION_COLOR;
              g.lineWidth = e.lineWidth + 2;
              canvas.setLineStyle(g, "solid");
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Default, Destination Arrow ////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Selected, Default, No Arrows ////////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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
          }
        }
      }

      ////////////////////////////////////////////////////////////////////////////////
      // Quadratic, No Label, Unselected, Dragging, Both Arrows ///////////////////////
      ////////////////////////////////////////////////////////////////////////////////

      else {
        if (isDragging) {
          if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.globalAlpha = 0.5;
              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
              g.globalAlpha = 1;
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Dragging, Source Arrow //////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.globalAlpha = 0.5;
              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              g.globalAlpha = 1;
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Dragging, Destination Arrow /////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Dragging, No Arrows /////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
            return () => {
              g.lineJoin = "round";

              g.globalAlpha = 0.5;
              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              g.globalAlpha = 1;
            };
          }
        }

        ////////////////////////////////////////////////////////////////////////////////
        // Quadratic, No Label, Unselected, Hovered, Both Arrows ////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else if (isHovered) {
          if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              g.shadowBlur = 20 * CONST.AA_SCALE;
              g.shadowColor = CONST.SELECTION_COLOR;
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
              g.shadowBlur = 0;
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Hovered, Source Arrow ///////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              g.shadowBlur = 20 * CONST.AA_SCALE;
              g.shadowColor = CONST.SELECTION_COLOR;
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              g.shadowBlur = 0;
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Hovered, Destination Arrow //////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
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
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Hovered, No Arrows //////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
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
          }
        }

        ////////////////////////////////////////////////////////////////////////////////
        // Quadratic, No Label, Unselected, Default, Both Arrows ////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        else {
          if (e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
              canvas.drawArrow(g, ctl, dst);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Default, Source Arrow ///////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (e.showSourceArrow && !e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, dst, src);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Default, Destination Arrow //////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else if (!e.showSourceArrow && e.showDestinationArrow) {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
              canvas.drawArrow(g, ctl, dst);
            };
          }

          ////////////////////////////////////////////////////////////////////////////////
          // Quadratic, No Label, Unselected, Default, No Arrows //////////////////////////
          ////////////////////////////////////////////////////////////////////////////////

          else {
            return () => {
              g.lineJoin = "round";

              g.strokeStyle = e.color;
              g.lineWidth = e.lineWidth;
              canvas.setLineStyle(g, e.lineStyle);
              canvas.drawQuadraticLine(g, src, dst, ctl);
            };
          }
        }
      }

      // TODO:
      // Bezier
      // case 8:

  }


  return () => { };
}
