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
    protected _state: DrawableStates;

    /**
     * _selected
     *   Whether or not the drawable is selected.
     */
    protected _selected: boolean;

    /**
     * _textSize
     *   The dimensions of the label text.
     */
    protected _textSize: size;

    /**
     * _lines
     *   The lines of the label text.
     */
    protected _lines: string[];

    /**
     * _color
     *   The main color of the drawable.
     */
    protected _color: string;

    /**
     * _draw
     *   The draw delegate for drawing the element.
     */
    protected _draw: () => void;

    /**
     * _drawSelectionShadow
     *   The draw delegate for drawing the selection shadow.
     */
    protected _drawSelectionShadow: () => void;

    /**
     * constructor
     */
    constructor(protected readonly graph: DrawableGraph) {
        super();
        Object.defineProperties(this, {
            _state: {
                enumerable: false,
                writable: true,
                value: DrawableStates.Default
            },
            _selected: {
                enumerable: false,
                writable: true,
                value: false
            },
            _textSize: {
                enumerable: false,
                writable: true,
                value: { h: 0, w: 0 }
            },
            _lines: {
                enumerable: false,
                writable: true,
                value: []
            },
            _color: {
                enumerable: false,
                writable: true
            },
            _draw: {
                enumerable: false,
                writable: true,
                value: () => { }
            },
            _drawSelectionShadow: {
                enumerable: false,
                writable: true,
                value: () => { }
            },
            graph: {
                enumerable: false,
                writable: false
            },
            color: {
                enumerable: true,
                get: () => this._color,
                set: (value: string) => {
                    let old = this._color;
                    if (this._color !== value) {
                        this._color = value;
                        this.onPropertyChanged("color", old);
                    }
                }
            },
            label: {
                enumerable: true,
                get: () => this._lines.join("\n"),
                set: (value: string) => {
                    let old = this.label;
                    if (value !== this.label) {
                        if (value.trim() !== "")
                            this._lines = value.split("\n");
                        else
                            this._lines = [];
                        this.onPropertyChanged("label", old);
                    }
                }
            },
            state: {
                enumerable: false,
                get: () => this._state,
                set: (value: DrawableStates) => {
                    let old = this._state;
                    if (this._state !== value) {
                        this._state = value;
                        this.onPropertyChanged("state", old);
                    }
                }
            },
            isHovered: {
                enumerable: false,
                get: () => this._state === DrawableStates.Hovered,
                set: (value: boolean) => this.state = (value ? DrawableStates.Hovered : DrawableStates.Default)
            },
            isDragging: {
                enumerable: false,
                get: () => this._state === DrawableStates.Dragging,
                set: (value: boolean) => this.state = (value ? DrawableStates.Dragging : DrawableStates.Default)
            },
            isSelected: {
                enumerable: false,
                get: () => this._selected,
                set: (value: boolean) => {
                    let old = this._selected;
                    if (this._selected !== value) {
                        if (value)
                            this.graph.select(this);
                        else
                            this.graph.deselect(this);
                        this._selected = value;
                        this.onPropertyChanged("isSelected", old);
                    }
                }
            }
        });
    }

    /**
     * color
     *   Gets or sets the main color of the element.
     *
     * <p>
     *   Can be any valid CSS color string.
     * </p>
     */
    color: string;

    /**
     * label
     *   Gets or sets the label of the element.
     */
    label: string;

    /**
     * state
     *   Gets or sets the drawable state.
     */
    state: DrawableStates;

    /**
     * isHovered
     *   Gets or sets the hovered state of the element.
     */
    isHovered: boolean;

    /**
     * isDragging
     *   Gets or sets the dragging state of the element.
     */
    isDragging: boolean;

    /**
     * isSelected
     *   Gets or sets the selected state of the element.
     */
    isSelected: boolean;

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
