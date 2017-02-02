// File: make-draw-node.ts
// Created by: CJ Dimaano
// Date created: January 13, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import * as DEFAULT from "./defaults";
import { GraphEditorCanvas, point } from "./canvas";
import { DrawableNode } from "./drawable-interfaces";


/**
 * makeDrawNode  
 *   Makes a draw function for a given node.
 */
export function makeDrawNode(canvas: GraphEditorCanvas, g: CanvasRenderingContext2D, n: DrawableNode, dim: any, isDragging: boolean, isHovered: boolean, pt?: point): () => void {
    let shadowColor = (isDragging ? DEFAULT.NODE_DRAG_SHADOW_COLOR : (isHovered ? DEFAULT.SELECTION_COLOR : undefined));
    let shapeThunk = () => {
        switch (n.shape) {
            case "circle":
                canvas.drawCircle(n.position, dim.r, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                break;
            case "square":
                canvas.drawSquare(n.position, dim.s, n.borderStyle, n.borderWidth, n.borderColor, n.color, shadowColor);
                break;
        }
    }
    if (n.label && n.label.trim() !== "") {
        let lines = n.label.split("\n");
        ///////////////////////////
        // Labelled, With Anchor //
        ///////////////////////////
        if (pt && pt !== n.position) {
            return () => {
                shapeThunk();
                canvas.drawText(n.position, dim.th, lines, "#fff", 2, "#000");
                canvas.drawCircle(pt, 5, "solid", 1, "#000", "#fff");
            };
        }
        /////////////////////////////
        // Labeled, Without Anchor //
        /////////////////////////////
        return () => {
            shapeThunk();
            canvas.drawText(n.position, dim.th, lines, "#fff", 2, "#000");
        };
    }
    /////////////////////////////
    // Unlabelled, With Anchor //
    /////////////////////////////
    if (pt && pt !== n.position) {
        return () => {
            shapeThunk();
            canvas.drawCircle(n.position, 5, "solid", 1, "#000", "#fff");
        };
    }
    ////////////////////////////////
    // Unlabelled, Without Anchor //
    ////////////////////////////////
    return shapeThunk;
}

/**
 * makeDrawSelectedNode  
 *   Makes a draw function for the selection shadow of a given node.
 */
export function makeDrawSelectedNode(canvas: GraphEditorCanvas, g: CanvasRenderingContext2D, n: DrawableNode, dim: any, isDragging: boolean, isHovered: boolean) {
    let shadowColor = (isDragging ? DEFAULT.NODE_DRAG_SHADOW_COLOR : (isHovered ? DEFAULT.SELECTION_COLOR : undefined));
    return () => {
        switch (n.shape) {
            case "circle":
                canvas.drawCircle(n.position, dim.r + n.borderWidth / 2 + 2, "solid", n.borderWidth, DEFAULT.SELECTION_COLOR, DEFAULT.SELECTION_COLOR, shadowColor);
                break;
            case "square":
                canvas.drawSquare(n.position, dim.s + n.borderWidth + 4, "solid", n.borderWidth, DEFAULT.SELECTION_COLOR, DEFAULT.SELECTION_COLOR, shadowColor);
                break;
        }
    };
}