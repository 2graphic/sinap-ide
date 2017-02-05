// File: graph-editor-element.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import { FONT_FAMILY, FONT_SIZE } from "./defaults";
import { GraphEditorCanvas, point, rect, size } from "./canvas";
import { Drawable, DrawableElement } from "./drawable-interfaces";


export abstract class GraphEditorElement<D extends DrawableElement> {

    private hovered: boolean
    = false;

    private dragging: boolean
    = false;

    private selected: boolean
    = false;

    private textRect: size
    = { h: 0, w: 0 };

    private lines: string[]
    = [];

    set isHovered(value: boolean) {
        if (this.hovered !== value) {
            this.dragging = false;
            this.hovered = value;
            this.updateDraw();
        }
    }

    get isHovered() {
        return this.hovered;
    }

    set isDragging(value: boolean) {
        if (this.dragging !== value) {
            this.hovered = false;
            this.dragging = value;
            this.updateDraw();
        }
    }

    get isDragging() {
        return this.dragging;
    }

    set isSelected(value: boolean) {
        if (this.selected !== value) {
            this.selected = value;
            this.updateDraw();
        }
    }

    get isSelected() {
        return this.selected;
    }

    get drawableProperties() {
        return this.d;
    }

    get textBox() {
        return this.textRect;
    }

    get textLines() {
        return this.lines;
    }

    constructor(protected d: D, protected readonly g: GraphEditorCanvas) {
        // TODO:
        // watch for changes in d.
    }

    draw: () => void
    = () => { };

    drawSelectionShadow: () => void
    = () => { };

    update(): void {
        this.lines = [];
        this.textRect.h = 0;
        this.textRect.h = 0;
        if (this.d.label.trim() !== "") {
            this.lines = this.d.label.trim().split("\n");
            this.textRect.h = this.lines.length * 1.5 * FONT_SIZE;
            this.lines.forEach(v => { this.textRect.w = Math.max(this.g.getTextWidth(v), this.textRect.w) });
        }
        this.updateGeometry();
    }

    protected abstract updateDraw(): void;

    protected abstract updateGeometry(): void;

    abstract hitPoint(pt: point): point | null;

    abstract hitRect(r: rect): boolean;

}