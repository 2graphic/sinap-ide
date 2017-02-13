// File: drawable-element.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import { FONT_SIZE } from "./defaults";
import { GraphEditorCanvas, point, rect, size } from "./graph-editor-canvas";
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
export abstract class DrawableElement {

    protected static i: number = 0;

    // TODO:
    // Each time a property is updated, mark this as dirty to signal a redraw.

    private _propertyChangedEmitter: PropertyChangedEventEmitter<any>
    = new PropertyChangedEventEmitter<any>();

    protected _state: DrawableStates
    = DrawableStates.Default;

    protected _selected: boolean
    = false;

    protected _textSize: size
    = { h: 0, w: 0 };

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
        let old = this._color;
        if (this._color !== value) {
            this._color = value;
            this.onPropertyChanged("color", old);
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
        let old = this.label;
        if (value.trim() !== "") {
            this._lines = value.split("\n");
        }
        else
            this._lines = [];
        this.onPropertyChanged("label", old);
    }

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

    get isSelected() {
        return this._selected;
    }

    get draw() {
        return this._draw;
    }

    get drawSelectionShadow() {
        return this._drawSelectionShadow;
    }

    constructor(protected readonly graph: DrawableGraph) { }

    addPropertyChangedEventListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.addListener(listener);
    }

    removePropertyChangedEventListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.removeListener(listener);
    }

    abstract update(g: GraphEditorCanvas): void;

    abstract updateDraw(g: GraphEditorCanvas): void;

    abstract hitPoint(pt: point): point | null;

    abstract hitRect(r: rect): boolean;

    protected updateTextSize(g: GraphEditorCanvas) {
        this._textSize.h = this._lines.length * 1.5 * FONT_SIZE;
        this._textSize.w = 0;
        this._lines.forEach(v => {
            this._textSize.w = Math.max(g.getTextWidth(v), this._textSize.w);
        });
    }

    protected onPropertyChanged(key: keyof this, oldVal: any) {
        this._propertyChangedEmitter.emit(new PropertyChangedEventArgs<any>(
            this,
            key,
            oldVal,
            this[key]
        ));
    }

}
