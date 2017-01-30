// File: make-draw-node.ts
// Created by: CJ Dimaano
// Date created: January 13, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import * as CONST from "./constants";
import { GraphEditorCanvas, point } from "./canvas";
import { DrawableNode } from "./drawable-interfaces";


/**
 * makeDrawNode  
 *   Makes a draw function for a given node.
 */
export function makeDrawNode(canvas: GraphEditorCanvas, g: CanvasRenderingContext2D, n: DrawableNode, dim: any, isDragging: boolean, isHovered: boolean, pt?: point): () => void {
    // TODO:
    // Deal with pt.
    let shadowColor = (isDragging ? CONST.NODE_DRAG_SHADOW_COLOR : (isHovered ? CONST.SELECTION_COLOR : undefined));
    if (n.label && n.label.trim() !== "") {
        let lines = n.label.split("\n");
        ///////////////////////////
        // Labelled, With Anchor //
        ///////////////////////////
        if (pt && pt !== n.position) {
            return () => {
                switch (n.shape) {
                    case "circle":
                        canvas.drawCircle(n.position, dim.r, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                        break;
                    case "square":
                        canvas.drawSquare(n.position, dim.s, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                        break;
                }
                canvas.drawText(n.position, dim.th, lines, "#fff", 2, "#000");
                canvas.drawCircle(pt, 5, "solid", 1, "#000", "#fff");
            };
        }
        /////////////////////////////
        // Labeled, Without Anchor //
        /////////////////////////////
        return () => {
            switch (n.shape) {
                case "circle":
                    canvas.drawCircle(n.position, dim.r, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                    break;
                case "square":
                    canvas.drawSquare(n.position, dim.s, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                    break;
            }
            canvas.drawText(n.position, dim.th, lines, "#fff", 2, "#000");
        };
    }
    /////////////////////////////
    // Unlabelled, With Anchor //
    /////////////////////////////
    if (pt && pt !== n.position) {
        return () => {
            switch (n.shape) {
                case "circle":
                    canvas.drawCircle(n.position, dim.r, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                    break;
                case "square":
                    canvas.drawSquare(n.position, dim.s, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                    break;
            }
            canvas.drawCircle(n.position, 5, "solid", 1, "#000", "#fff");
        };
    }
    ////////////////////////////////
    // Unlabelled, Without Anchor //
    ////////////////////////////////
    return () => {
        switch (n.shape) {
            case "circle":
                canvas.drawCircle(n.position, dim.r, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                break;
            case "square":
                canvas.drawSquare(n.position, dim.s, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                break;
        }
    };
}

/**
 * makeDrawSelectedNode  
 *   Makes a draw function for the selection shadow of a given node.
 */
export function makeDrawSelectedNode(
    canvas: GraphEditorCanvas,
    g: CanvasRenderingContext2D,
    n: DrawableNode,
    dim: any,
    isDragging: boolean,
    isHovered: boolean
) {
    let shadowColor = (isDragging ? CONST.NODE_DRAG_SHADOW_COLOR : (isHovered ? CONST.SELECTION_COLOR : undefined));
    switch (n.shape) {
        case "circle":
            return () => {
                canvas.drawCircle(n.position, dim.r + n.borderWidth / 2 + 2, "solid", n.borderWidth, CONST.SELECTION_COLOR, CONST.SELECTION_COLOR, shadowColor);
            };
        case "square":
            return () => {
                canvas.drawSquare(n.position, dim.s + n.borderWidth + 4, "solid", n.borderWidth, CONST.SELECTION_COLOR, CONST.SELECTION_COLOR, shadowColor);
            };
    }
    return () => { };
}