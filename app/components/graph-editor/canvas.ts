// File: canvas.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts


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
  w: number,
  h: number,
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
  g.fillRect(x, y, w, h);
  g.shadowBlur = 0;
  if (borderWidth > 0) {
    setLineStyle(g, borderStyle, borderWidth);
    g.lineWidth = borderWidth;
    g.strokeStyle = borderColor;
    g.strokeRect(x, y, w, h);
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

//// Unselected Node ///////////////////////////////////////////////////////////

export function makeFnUnselectedCircleNodeWithLabel(
  g: CanvasRenderingContext2D,
  origin: number[],
  r: number,
  lines: string[],
  borderStyle: string,
  borderWidth: number,
  borderColor: string,
  color: string,
  shadowColor?: string
): () => void {
  return () => {
    // TODO:
    // Remove lets from makeFns
    let size = getTextSize(
      g,
      lines,
      CONST.NODE_FONT_FAMILY,
      CONST.NODE_FONT_SIZE
    );
    drawCircle(
      g,
      origin[0], origin[1],
      r,
      borderStyle,
      borderWidth,
      borderColor,
      color,
      shadowColor
    );
    drawText(
      g,
      origin[0], origin[1] - size.h / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
      lines,
      CONST.NODE_FONT_SIZE,
      CONST.NODE_FONT_FAMILY,
      "#fff",
      2,
      "#000"
    );
  };
}

export function makeFnUnselectedCircleNodeWithNoLabel(
  g: CanvasRenderingContext2D,
  origin: number[],
  r: number,
  borderStyle: string,
  borderWidth: number,
  borderColor: string,
  color: string,
  shadowColor?: string
): () => void {
  return () => {
    drawCircle(
      g,
      origin[0], origin[1],
      r,
      borderStyle,
      borderWidth,
      borderColor,
      color,
      shadowColor
    );
  };
}

export function makeFnUnselectedSquareNodeWithLabel(
  g: CanvasRenderingContext2D,
  origin: number[],
  s: number,
  lines: string[],
  borderStyle: string,
  borderWidth: number,
  borderColor: string,
  color: string,
  shadowColor?: string
): () => void {
  return () => {
    let size = getTextSize(
      g,
      lines,
      CONST.NODE_FONT_FAMILY,
      CONST.NODE_FONT_SIZE
    );
    drawSquare(
      g,
      origin[0] - s / 2, origin[1] - s / 2,
      s, s,
      borderStyle,
      borderWidth,
      borderColor,
      color,
      shadowColor
    );
    drawText(
      g,
      origin[0], origin[1] - size.h / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
      lines,
      CONST.NODE_FONT_SIZE,
      CONST.NODE_FONT_FAMILY,
      "#fff",
      2,
      "#000"
    );
  };
}

export function makeFnUnselectedSquareNodeWithNoLabel(
  g: CanvasRenderingContext2D,
  origin: number[],
  s: number,
  borderStyle: string,
  borderWidth: number,
  borderColor: string,
  color: string,
  shadowColor?: string
): () => void {
  return () => {
    drawSquare(
      g,
      origin[0] - s / 2, origin[1] - s / 2,
      s, s,
      borderStyle,
      borderWidth,
      borderColor,
      color,
      shadowColor
    );
  };
}

//// Unselected Straight Edge //////////////////////////////////////////////////

/**
 * makeFnUnselectedStraightEdgeWithBothArrowsAndLabel  
 *   Returns a function that draws a straight edge with both arrows and a label.
 */
export function makeFnUnselectedStraightEdgeWithBothArrowsAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedStraightEdgeWithBothArrowsNoLabel  
 *   Returns a function that draws a straight edge with both arrows and no
 *   label.
 */
export function makeFnUnselectedStraightEdgeWithBothArrowsNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);
  };
}

/**
 * makeFnUnselectedStraightEdgeWithSourceArrowAndLabel  
 *   Returns a function that draws a straight edge with a source arrow and a
 *   label.
 */
export function makeFnUnselectedStraightEdgeWithSourceArrowAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedStraightEdgeWithSourceArrowNoLabel  
 *   Returns a function that draws a straight edge with a source arrow and no
 *   label.
 */
export function makeFnUnselectedStraightEdgeWithSourceArrowNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);
  };
}

/**
 * makeFnUnselectedStraightEdgeWithDestinationArrowAndLabel  
 *   Returns a function that draws a straight edge with a destination arrow and
 *   a label.
 */
export function makeFnUnselectedStraightEdgeWithDestinationArrowAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedStraightEdgeWithDestinationArrowNoLabel  
 *   Returns a function that draws a straight edge with a destination arrow and
 *   no label.
 */
export function makeFnUnselectedStraightEdgeWithDestinationArrowNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);
  };
}

/**
 * makeFnUnselectedStraightEdgeWithNoArrowsAndLabel  
 *   Returns a function that draws a straight edge with no arrows and a label.
 */
export function makeFnUnselectedStraightEdgeWithNoArrowsAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedStraightEdgeWithNoArrowsNoLabel  
 *   Returns a function that draws a straight edge with no arrows and no label.
 */
export function makeFnUnselectedStraightEdgeWithNoArrowsNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawLine(g, src, dst);
  };
}

//// Unselected Quadratic Edge /////////////////////////////////////////////////

/**
 * makeFnUnselectedQuadraticEdgeWithBothArrowsAndLabel  
 *   Returns a function that draws a straight edge with both arrows and a label.
 */
export function makeFnUnselectedQuadraticEdgeWithBothArrowsAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithBothArrowsNoLabel  
 *   Returns a function that draws a straight edge with both arrows and no
 *   label.
 */
export function makeFnUnselectedQuadraticEdgeWithBothArrowsNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithSourceArrowAndLabel  
 *   Returns a function that draws a straight edge with a source arrow and a
 *   label.
 */
export function makeFnUnselectedQuadraticEdgeWithSourceArrowAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithSourceArrowNoLabel  
 *   Returns a function that draws a straight edge with a source arrow and no
 *   label.
 */
export function makeFnUnselectedQuadraticEdgeWithSourceArrowNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, [dst[0], dst[1]], [src[0], src[1]]);
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithDestinationArrowAndLabel  
 *   Returns a function that draws a straight edge with a destination arrow and
 *   a label.
 */
export function makeFnUnselectedQuadraticEdgeWithDestinationArrowAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithDestinationArrowNoLabel  
 *   Returns a function that draws a straight edge with a destination arrow and
 *   no label.
 */
export function makeFnUnselectedQuadraticEdgeWithDestinationArrowNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
    drawArrow(g, [src[0], src[1]], [dst[0], dst[1]]);
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithNoArrowsAndLabel  
 *   Returns a function that draws a straight edge with no arrows and a label.
 */
export function makeFnUnselectedQuadraticEdgeWithNoArrowsAndLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  lines: string[],
  strokeStyle: string,
  fillStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    let size = getTextSize(g, lines, CONST.EDGE_FONT_FAMILY, CONST.EDGE_FONT_SIZE);
    let rect = makeRect(
      src[0], src[1],
      dst[0], dst[1]
    );
    let labelPt = [
      rect.x + rect.w / 2,
      rect.y + rect.h / 2
    ];
    size.w /= 2;
    size.h /= 2;
    rect = makeRect(
      labelPt[0] - size.w - 6, labelPt[1] - size.h,
      labelPt[0] + size.w + 6, labelPt[1] + size.h
    );

    g.strokeStyle = strokeStyle;
    g.fillStyle = fillStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);

    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawText(
      g,
      labelPt[0], labelPt[1] - size.h + 1.5 * CONST.EDGE_FONT_SIZE / 2,
      lines,
      CONST.EDGE_FONT_SIZE,
      CONST.EDGE_FONT_FAMILY,
      "#000"
    );
  };
}

/**
 * makeFnUnselectedQuadraticEdgeWithNoArrowsNoLabel  
 *   Returns a function that draws a straight edge with no arrows and no label.
 */
export function makeFnUnselectedQuadraticEdgeWithNoArrowsNoLabel(
  g: CanvasRenderingContext2D,
  src: number[],
  dst: number[],
  ctl: number[],
  strokeStyle: string,
  lineWidth: number,
  lineStyle: string
): () => void {
  return () => {
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;

    setLineStyle(g, lineStyle, lineWidth);
    drawQuadraticLine(g, src, dst, ctl);
  };
}
