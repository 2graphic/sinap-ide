// File: make-fn-node.ts
// Created by: CJ Dimaano
// Date created: January 13, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import * as CONST from "./constants";
import * as canvas from "./canvas";
import { DrawableNode } from "./drawable-interfaces";


/**
 * makeFnNode  
 *   Makes a draw function for a given node.
 */
export function makeFnNode(
    g: CanvasRenderingContext2D,
    n: DrawableNode,
    dim: any,
    isDragging: boolean,
    isHovered: boolean,
    isSelected: boolean
): () => void {
    let shadowColor = (isDragging ? CONST.NODE_DRAG_SHADOW_COLOR : (isHovered ? CONST.SELECTION_COLOR : undefined));


    if (n.label && n.label.trim() !== "") {
        let lines = n.label.split("\n");
        if (isSelected) {

            ////////////////////////
            // Labelled, Selected //
            ////////////////////////
            switch (n.shape) {

                case "circle":
                    return () => {
                        canvas.drawCircle(
                            g,
                            n.position.x, n.position.y,
                            dim.r + n.borderWidth / 2 + 2,
                            "solid",
                            n.borderWidth,
                            CONST.SELECTION_COLOR,
                            CONST.SELECTION_COLOR,
                            shadowColor
                        );
                        canvas.drawCircle(
                            g,
                            n.position.x, n.position.y,
                            dim.r,
                            n.borderStyle,
                            n.borderWidth,
                            n.borderColor,
                            n.color
                        );
                        canvas.drawText(
                            g,
                            n.position.x, n.position.y - dim.th / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
                            lines,
                            CONST.NODE_FONT_SIZE,
                            CONST.NODE_FONT_FAMILY,
                            "#fff",
                            2,
                            "#000"
                        );
                    };

                case "square":
                    let ss = dim.s + n.borderWidth + 4;
                    return () => {
                        canvas.drawSquare(
                            g,
                            n.position.x - ss / 2, n.position.y - ss / 2,
                            ss,
                            "solid",
                            n.borderWidth,
                            CONST.SELECTION_COLOR,
                            CONST.SELECTION_COLOR,
                            shadowColor
                        );
                        canvas.drawSquare(
                            g,
                            n.position.x - dim.s / 2, n.position.y - dim.s / 2,
                            dim.s,
                            n.borderStyle,
                            n.borderWidth,
                            n.borderColor,
                            n.color
                        );
                        canvas.drawText(
                            g,
                            n.position.x, n.position.y - dim.th / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
                            lines,
                            CONST.NODE_FONT_SIZE,
                            CONST.NODE_FONT_FAMILY,
                            "#fff",
                            2,
                            "#000"
                        );
                    };
            }
        }

        //////////////////////////
        // Labelled, Unselected //
        //////////////////////////
        switch (n.shape) {
            case "circle":
                return () => {
                    canvas.drawCircle(
                        g,
                        n.position.x, n.position.y,
                        dim.r,
                        n.borderStyle,
                        n.borderWidth,
                        n.borderColor,
                        n.color,
                        shadowColor
                    );
                    canvas.drawText(
                        g,
                        n.position.x, n.position.y - dim.th / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
                        lines,
                        CONST.NODE_FONT_SIZE,
                        CONST.NODE_FONT_FAMILY,
                        "#fff",
                        2,
                        "#000"
                    );
                };

            case "square":
                return () => {
                    canvas.drawSquare(
                        g,
                        n.position.x - dim.s / 2, n.position.y - dim.s / 2,
                        dim.s,
                        n.borderStyle,
                        n.borderWidth,
                        n.borderColor,
                        n.color,
                        shadowColor
                    );
                    canvas.drawText(
                        g,
                        n.position.x, n.position.y - dim.th / 2 + 1.5 * CONST.NODE_FONT_SIZE / 2,
                        lines,
                        CONST.NODE_FONT_SIZE,
                        CONST.NODE_FONT_FAMILY,
                        "#fff",
                        2,
                        "#000"
                    );
                };
        }
    }

    //////////////////////////
    // Unlabelled, Selected //
    //////////////////////////
    if (isSelected) {
        switch (n.shape) {

            case "circle":
                return () => {
                    canvas.drawCircle(
                        g,
                        n.position.x, n.position.y,
                        dim.r + n.borderWidth / 2 + 2,
                        "solid",
                        n.borderWidth,
                        CONST.SELECTION_COLOR,
                        CONST.SELECTION_COLOR,
                        shadowColor
                    );
                    canvas.drawCircle(
                        g,
                        n.position.x, n.position.y,
                        dim.r,
                        n.borderStyle,
                        n.borderWidth,
                        n.borderColor,
                        n.color
                    );
                };

            case "square":
                let ss = dim.s + n.borderWidth + 4;
                return () => {
                    canvas.drawSquare(
                        g,
                        n.position.x - ss / 2, n.position.y - ss / 2,
                        ss,
                        "solid",
                        n.borderWidth,
                        CONST.SELECTION_COLOR,
                        CONST.SELECTION_COLOR,
                        shadowColor
                    );
                    canvas.drawSquare(
                        g,
                        n.position.x - dim.s / 2, n.position.y - dim.s / 2,
                        dim.s,
                        n.borderStyle,
                        n.borderWidth,
                        n.borderColor,
                        n.color
                    );
                };
        }
    }

    ////////////////////////////
    // Unlabelled, Unselected //
    ////////////////////////////
    switch (n.shape) {
        case "circle":
            return () => {
                canvas.drawCircle(
                    g,
                    n.position.x, n.position.y,
                    dim.r,
                    n.borderStyle,
                    n.borderWidth,
                    n.borderColor,
                    n.color,
                    shadowColor
                );
            };

        case "square":
            return () => {
                canvas.drawSquare(
                    g,
                    n.position.x - dim.s / 2, n.position.y - dim.s / 2,
                    dim.s,
                    n.borderStyle,
                    n.borderWidth,
                    n.borderColor,
                    n.color,
                    shadowColor
                );
            };
    }

    /////////////
    // Default //
    /////////////
    return () => { };
}
