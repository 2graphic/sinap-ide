// File: drawable-element.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import { FONT_SIZE } from "./defaults";
import { GraphEditorCanvas, point, rect, size } from "./graph-editor-canvas";
import { Drawable } from "./drawable";
import { DrawableGraph } from "./drawable-graph";
import {
    PropertyChangedEventArgs,
    PropertyChangedEventEmitter,
    PropertyChangedEventListener
} from "./events";


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
export abstract class DrawableElement extends Drawable {

    /**
     * _state  
     *   The drawable state.
     */
    protected _state: DrawableStates
    = DrawableStates.Default;

    /**
     * _selected  
     *   Whether or not the drawable is selected.
     */
    protected _selected: boolean
    = false;

    /**
     * _textSize  
     *   The dimensions of the label text.
     */
    protected _textSize: size
    = { h: 0, w: 0 };

    /**
     * _lines  
     *   The lines of the label text.
     */
    protected _lines: string[]
    = [];

    /**
     * _color  
     *   The main color of the drawable.
     */
    protected _color: string;

    /**
     * _draw  
     *   The draw delegate for drawing the element.
     */
    protected _draw: () => void
    = () => { };

    /**
     * _drawSelectionShadow  
     *   The draw delegate for drawing the selection shadow.
     */
    protected _drawSelectionShadow: () => void
    = () => { };

    /**
     * color  
     *   Gets or sets the main color of the element.
     */
    get color() {
        return this._color;
    }

    set color(value: string) {
        let old = this._color;
        if (this._color !== value) {
            this._color = value;
            this.onPropertyChanged("color", old);
        }
    }

    /**
     * label  
     *   Gets or sets the label of the element.
     */
    get label() {
        return this._lines.join("\n");
    }

    set label(value: string) {
        let old = this.label;
        if (value.trim() !== "") {
            this._lines = value.split("\n");
        }
        else
            this._lines = [];
        this.onPropertyChanged("label", old);
    }

    /**
     * state  
     *   Gets or sets the drawable state.
     */
    get state() {
        return this._state;
    }

    set state(value: DrawableStates) {
        let old = this._state;
        if (this._state !== value) {
            this._state = value;
            this.onPropertyChanged("state", old);
        }
    }

    /**
     * isHovered  
     *   Gets or sets the hovered state of the element.
     */
    get isHovered() {
        return this._state === DrawableStates.Hovered;
    }

    set isHovered(value: boolean) {
        this.state = (value ? DrawableStates.Hovered : DrawableStates.Default);
    }

    /**
     * isDragging  
     *   Gets or sets the dragging state of the element.
     */
    get isDragging() {
        return this._state === DrawableStates.Dragging;
    }

    set isDragging(value: boolean) {
        this.state = (value ? DrawableStates.Dragging : DrawableStates.Default);
    }

    /**
     * isSelected  
     *   Gets or sets the selected state of the element.
     */
    get isSelected() {
        return this._selected;
    }

    set isSelected(value: boolean) {
        let old = this._selected;
        if (this._selected !== value) {
            if (value)
                this.graph.selectItems(this);
            else
                this.graph.deselectItems(this);
            this._selected = value;
            this.onPropertyChanged("isSelected", old);
        }
    }

    /**
     * draw  
     *   Gets the draw delegate of the element.
     */
    get draw() {
        return this._draw;
    }

    /**
     * drawSelectionShadow  
     *   Gets the draw delegate of the selection shadow of the element.
     */
    get drawSelectionShadow() {
        return this._drawSelectionShadow;
    }

    /**
     * constructor
     */
    constructor(protected readonly graph: DrawableGraph) {
        super();
    }

    /**
     * update  
     *   Updates the geometry and draw logic of the drawable element.
     */
    abstract update(g: GraphEditorCanvas): void;

    /**
     * updateDraw  
     *   Updates the draw delegate of the element.
     */
    abstract updateDraw(g: GraphEditorCanvas): void;

    /**
     * hitPoint  
     *   Tests whether a point has captured the element.
     */
    abstract hitPoint(pt: point): point | null;

    /**
     * hitRect  
     *   Tests whether a rectangle has captured the element.
     */
    abstract hitRect(r: rect): boolean;

    /**
     * updateTextSize  
     *   Updates the text dimensions of the label.
     */
    protected updateTextSize(g: GraphEditorCanvas) {
        this._textSize.h = this._lines.length * 1.5 * FONT_SIZE;
        this._textSize.w = 0;
        this._lines.forEach(v => {
            this._textSize.w = Math.max(g.getTextWidth(v), this._textSize.w);
        });
    }

}
