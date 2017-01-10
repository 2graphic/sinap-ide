// File: draw.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts


import * as CONST from "./constants";
import * as Drawables from "./drawable-interfaces";
import * as MathEx from "./math";


/**
 * drawSelectionBox  
 *   Draws the selection box.
 */
export function drawSelectionBox(g : CanvasRenderingContext2D, rect : any) : void {
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
  g : CanvasRenderingContext2D,
  x1 : number, y1 : number,
  x2 : number, y2 : number
) : void {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

/**
 * drawQuadraticLine  
 *   Draws a quadratic line between two points.
 */
export function drawQuadraticLine(
  g : CanvasRenderingContext2D,
  x1 : number, y1 : number,
  x2 : number, y2 : number
) : void {

  // Get the vector from point 1 to point 2.
  let v = [
    x2 - x1,
    y2 - y1
  ];

  // Get the magnitude of the vector.
  let d = MathEx.mag(v);

  // Get the normal of the vector, rotated 180 degrees.
  let n = [
    v[1] / d,
    -v[0] / d
  ];

  // Draw the quadric curve.
  g.beginPath();
  g.moveTo(x1, y1);
  g.quadraticCurveTo(
    x1 + v[0] / 2 + n[0] * CONST.GRID_SPACING, y1 + v[1] / 2 + n[1] * CONST.GRID_SPACING,
    x2, y2
  );
  g.stroke();

}

/**
 * drawArrow  
 *   Draws an arrow towards the destination node.
 */
export function drawArrow(
  g : CanvasRenderingContext2D,
  src : Drawables.DrawableNode,
  dst : Drawables.DrawableNode
) : void {

  let pt = getEdgeBorderPt(g, src, dst);

  // Draw arrow.
  drawLine(
    g,
    pt.x, pt.y,
    pt.x + CONST.GRID_SPACING * (pt.u[0] * CONST.COS_150 - pt.u[1] * CONST.SIN_150) / 2,
    pt.y + CONST.GRID_SPACING * (pt.u[0] * CONST.SIN_150 + pt.u[1] * CONST.COS_150) / 2
  );
  drawLine(
    g,
    pt.x, pt.y,
    pt.x + CONST.GRID_SPACING * (pt.u[0] * CONST.COS_150 + pt.u[1] * CONST.SIN_150) / 2,
    pt.y + CONST.GRID_SPACING * (-pt.u[0] * CONST.SIN_150 + pt.u[1] * CONST.COS_150) / 2
  );

}

/**
 * drawCircle  
 *   Draws a circle.
 */
export function drawCircle(
  g : CanvasRenderingContext2D,
  x : number,
  y : number,
  r : number,
  borderStyle : string,
  borderWidth : number,
  borderColor : string,
  fillColor : string,
  shadowBlur? : number,
  shadowColor? : string
) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = fillColor;
  if(shadowBlur && shadowColor) {
    g.shadowBlur = shadowBlur;
    g.shadowColor = shadowColor;
  }
  g.fill();
  g.shadowBlur = 0;
  if(borderWidth > 0) {
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
  g : CanvasRenderingContext2D,
  x : number,
  y : number,
  w : number,
  h : number,
  borderStyle : string,
  borderWidth : number,
  borderColor : string,
  fillColor : string,
  shadowBlur? : number,
  shadowColor? : string
) {
  g.fillStyle = fillColor;
  if(shadowBlur && shadowColor) {
    g.shadowBlur = shadowBlur;
    g.shadowColor = shadowColor;
  }
  g.fillRect(x, y, w, h);
  g.shadowBlur = 0;
  if(borderWidth > 0) {
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
export function drawGrid(g : CanvasRenderingContext2D, originPt : number[]) {

  let w = g.canvas.width;
  let h = g.canvas.height;

  for(
    let x = originPt[0] % CONST.GRID_SPACING - CONST.GRID_SPACING;
    x < w + CONST.GRID_SPACING; 
    x += CONST.GRID_SPACING
  ) {
    g.strokeStyle = CONST.GRID_MAJOR_COLOR;
    g.lineWidth = CONST.GRID_MAJOR_WIDTH;
    setLineStyle(g, CONST.GRID_MAJOR_STYLE);
    drawLine(g, x, 0, x, h);
    g.strokeStyle = CONST.GRID_MINOR_COLOR;
    g.lineWidth = CONST.GRID_MINOR_WIDTH;
    setLineStyle(g, CONST.GRID_MINOR_STYLE);
    drawLine(g, x + CONST.GRID_MINOR_OFFSET, 0, x + CONST.GRID_MINOR_OFFSET, h);
  }
  for(
    let y = originPt[1] % CONST.GRID_SPACING - CONST.GRID_SPACING;
    y < h + CONST.GRID_SPACING;
    y += CONST.GRID_SPACING
  ) {
    g.strokeStyle = CONST.GRID_MAJOR_COLOR;
    g.lineWidth = CONST.GRID_MAJOR_WIDTH;
    setLineStyle(g, CONST.GRID_MAJOR_STYLE);
    drawLine(g, 0, y, w, y);
    g.strokeStyle = CONST.GRID_MINOR_COLOR;
    g.lineWidth = CONST.GRID_MINOR_WIDTH;
    setLineStyle(g, CONST.GRID_MINOR_STYLE);
    drawLine(g, 0, y + CONST.GRID_MINOR_OFFSET, w, y + CONST.GRID_MINOR_OFFSET);
  }

}

/**
 * drawText  
 *   Draws text.
 */
export function drawText(
  g : CanvasRenderingContext2D,
  x : number,
  y : number,
  lines : Array<string>,
  fontSize : number,
  fontFamily : string,
  color : string,
  borderWidth? : number,
  borderColor? : string
) {
    g.font = fontSize + "pt " + fontFamily;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = color;
    if(borderWidth && borderColor) {
      g.lineWidth = 2;
      g.strokeStyle = "#000";
      setLineStyle(g, "solid");
      for(let l = 0; l < lines.length; l++) {
        g.strokeText(lines[l], x, y);
        g.fillText(lines[l], x, y);
        y += 1.5 * fontSize;
      }
    }
    else {
      for(let l = 0; l < lines.length; l++) {
        g.fillText(lines[l], x, y);
        y += 1.5 * fontSize;
      }
    }
}

/**
 * setLineStyle  
 *   Sets the line style of the rendering context.
 */
export function setLineStyle(
  g : CanvasRenderingContext2D,
  value : string,
  dotSize? : number
) {
  if(!dotSize)
    dotSize = g.lineWidth;
  if(value == "dashed")
    g.setLineDash([3 * dotSize, 6 * dotSize]);
  else if(value == "dotted")
    g.setLineDash([dotSize, 2 * dotSize]);
  else
    g.setLineDash([1, 0]);
}

/**
 * getEdgeBorderPt  
 *   Gets the point were the edge intersects the border of the specified
 *   destination node.
 */
export function getEdgeBorderPt(
  g : CanvasRenderingContext2D,
  src : Drawables.DrawableNode,
  dst : Drawables.DrawableNode
) {

  //
  // TODO:
  // Either DrawableNode or DrawableEdge needs to define anchor points, and the
  // DrawableEdge must specify which anchor it is attached to for src and dst.
  //

  // Get the vector from src to dst.
  let v = [
    dst.x - src.x,
    dst.y - src.y
  ];

  // Get destination node radius.
  let lines = dst.label.split("\n");
  let size = getTextSize(g, lines, CONST.NODE_FONT_FAMILY, CONST.NODE_FONT_SIZE);
  let r = (size.h + 1.5 * CONST.NODE_FONT_SIZE > size.w + CONST.NODE_FONT_SIZE ?
            size.h + 1.5 * CONST.NODE_FONT_SIZE : size.w + CONST.NODE_FONT_SIZE);
  r = (CONST.GRID_SPACING > r ? CONST.GRID_SPACING : r);
  r /= 2;

  // Get the distance from src to dst.
  let d = MathEx.mag(v);

  // Get the unit vector from src to dst.
  let u = [
    v[0] / d,
    v[1] / d
  ];

  // Extend the radius if the shape is a square.
  if(dst.shape === "square") {
    let up = [
      (u[0] < 0 ? -u[0] : u[0]),
      (u[1] < 0 ? -u[1] : u[1])
    ];
    if(up[0] < up[1]) {
      let ratio = up[0] / up[1];
      let b = r / up[1];
      let a = ratio * up[0];
      r = MathEx.mag([ a, b ]);
    }
    else {
      let ratio = up[1] / up[0];
      let a = r / up[0];
      let b = ratio * up[1];
      r = MathEx.mag([ a, b ]);
    }
  }

  // Get the point where the edge meets the node border.
  v[0] = u[0] * (d - r) + src.x;
  v[1] = u[1] * (d - r) + src.y;

  return { x: v[0], y: v[1], u: u };

}

/**
 * getTextSize  
 *   Gets the bounding box of text.
 */
export function getTextSize(
  g : CanvasRenderingContext2D,
  lines : Array<string>,
  fontFamily : string,
  fontSize : number
) {
  g.font = fontSize + "pt " + fontFamily;
  let textHeight = lines.length * 1.5 * fontSize;
  let textWidth = 0;
  for(let l = 0; l < lines.length; l++) {
    let tw = g.measureText(lines[l]).width;
    if(textWidth < tw)
      textWidth = tw;
  }
  return { h: textHeight, w: textWidth };
}
