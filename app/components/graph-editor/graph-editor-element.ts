// File: graph-editor-element.ts
// Created by: CJ Dimaano
// Date created: March 11, 2017


import { FONT_SIZE } from "./defaults";
import { PropertyChangedEvent } from "./events";
import { DrawableElement } from "./drawable-element";
import { GraphEditorCanvas, LineStyles, point, size, rect } from "./graph-editor-canvas";


/**
 * DrawableStates
 *
 *   The states in which a drawable can be.
 */
export enum DrawableStates {
    Default,
    Dragging,
    Hovered
};

/**
 * GraphEditorElement
 *
 *   A wrapper around drawable elements.
 */
export class GraphEditorElement<D extends DrawableElement> {
    constructor(public readonly drawable: D) { }

    private _state: DrawableStates
    = DrawableStates.Default;

    /**
     * textRect
     *
     *   The dimensions and position of the label text.
     */
    protected readonly textRect: rect
    = { x: 0, y: 0, height: 0, width: 0 };

    /**
     * lines
     *
     *   The lines of the label text.
     */
    protected lines: string[]
    = [];

    get state() {
        return this._state;
    }

    /**
     * isDragging
     *
     *   Gets or sets the drag state of the element.
     */
    get isDragging() {
        return this._state === DrawableStates.Dragging;
    }

    set isDragging(value: boolean) {
        this._state = (value ? DrawableStates.Dragging : DrawableStates.Default);
    }

    /**
     * isHovered
     *
     *   Gets or sets the hovered state of the element.
     */
    get isHovered() {
        return this._state === DrawableStates.Hovered;
    }

    set isHovered(value: boolean) {
        this._state = (value ? DrawableStates.Hovered : DrawableStates.Default);
    }

    /**
     * drawHighlight
     *
     *   Draws the selection highlight on a given canvas.
     */
    drawHighlight(g: GraphEditorCanvas) { }

    /**
     * draw
     *
     *   Draws the element on a given canvas.
     */
    draw(g: GraphEditorCanvas) { }

    /**
     * update
     *
     *   Updates the element for a given canvas.
     */
    update(g: GraphEditorCanvas) { }

    /**
     * updateTextSize
     *
     *   Updates the text geometry for a given canvas.
     */
    updateTextSize(g: GraphEditorCanvas) {
        this.lines = this.drawable.label.split("\n");
        this.textRect.width = 0;
        this.lines.forEach(l => {
            this.textRect.width = Math.max(g.getTextWidth(l), this.textRect.width);
        });
        this.textRect.height = this.textRect.width > 0 ?
            this.lines.length * 1.5 * FONT_SIZE :
            0;
    }

    /**
     * hitPoint
     *
     *   Tests whether a given point is within the element region.
     */
    hitPoint(pt: point): point | null {
        return null;
    }

    /**
     * hitRect
     *
     *   Tests whether the element is hit by a rectangle.
     */
    hitRect(r: rect): boolean {
        return false;
    }

}
