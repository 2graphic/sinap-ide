// File: drawable-element.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import { FONT_SIZE } from "./defaults";
import { GraphEditorCanvas, point, rect, size } from "./graph-editor-canvas";
import { DrawableGraph } from "./drawable-graph";


/**
 * DrawableStates  
 *   The states in which a drawable can be.
 */
export enum DrawableStates {
    Default,
    Dragging,
    Hovered
};

/**
 * DrawableElement  
 *   Common properties shared between drawable edges and nodes.
 */
export abstract class DrawableElement {

    // TODO:
    // Each time a property is updated, mark this as dirty to signal a redraw.

    protected _state: DrawableStates
    = DrawableStates.Default;

    protected _selected: boolean
    = false;

    protected _lines: string[]
    = [];

    protected _color: string;

    protected _draw: () => void
    = () => { };

    protected _drawSelectionShadow: () => void
    = () => { };

    /**
     * color  
     *   The color of the element. This can be any valid `CSS` color string.
     */
    get color() {
        return this._color;
    }

    set color(value: string) {
        if (this._color !== value) {
            this._color = value;
        }
    }

    /**
     * label  
     *   The text label to be displayed by the element.
     */
    get label() {
        return this._lines.join("\n");
    }

    set label(value: string) {
        if (value.trim() !== "") {
            this._lines = value.split("\n");
        }
        else
            this._lines = [];
    }

    get state() {
        return this._state;
    }

    set state(value: DrawableStates) {
        if (this._state !== value) {
            this._state = value;
        }
    }

    set isHovered(value: boolean) {
        this.state = (value ? DrawableStates.Hovered : DrawableStates.Default);
    }

    get isHovered() {
        return this._state === DrawableStates.Hovered;
    }

    set isDragging(value: boolean) {
        this.state = (value ? DrawableStates.Dragging : DrawableStates.Default);
    }

    get isDragging() {
        return this._state === DrawableStates.Dragging;
    }

    set isSelected(value: boolean) {
        if (this._selected !== value) {
            if (value)
                this.graph.selectItems(this);
            else
                this.graph.deselectItems(this);
            this._selected = value;
        }
    }

    get isSelected() {
        return this._selected;
    }

    constructor(
        protected readonly graph: DrawableGraph
    ) {
        this.init();
    }

    get draw() {
        return this._draw;
    }

    get drawSelectionShadow() {
        return this._drawSelectionShadow;
    }

    abstract update(g: GraphEditorCanvas): void;

    abstract updateDraw(g: GraphEditorCanvas): void;

    abstract hitPoint(pt: point): point | null;

    abstract hitRect(r: rect): boolean;

    protected abstract init(): void;

}
