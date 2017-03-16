// File: drawable-element.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import { Drawable } from "./drawable";
import { DrawableGraph } from "./drawable-graph";

/**
 * DrawableElement
 *
 *   Contains common properties shared between drawable edges and nodes.
 */
export class DrawableElement extends Drawable {
    constructor(public readonly graph: DrawableGraph) {
        super();
        Object.defineProperties(this, {
            _isSelected: {
                enumerable: false,
                writable: true,
                value: false
            },
            _label: {
                enumerable: false,
                writable: true
            },
            _color: {
                enumerable: false,
                writable: true
            },
            graph: {
                enumerable: false,
                writable: false
            },
            label: {
                enumerable: true,
                get: () => this._label,
                set: (value: string) => {
                    const old = this._label;
                    if (value !== this._label) {
                        this._label = value.trim();
                        this.onPropertyChanged("label", old);
                    }
                }
            },
            color: {
                enumerable: true,
                get: () => this._color,
                set: (value: string) => {
                    const old = this._color;
                    if (this._color !== value) {
                        this._color = value;
                        this.onPropertyChanged("color", old);
                    }
                }
            },
            isSelected: {
                enumerable: false,
                get: () => this._isSelected,
                set: (value: boolean) => {
                    const old = this._isSelected;
                    if (this._isSelected !== value) {
                        this._isSelected = value;
                        this.onPropertyChanged("isSelected", old);
                    }
                }
            }
        });
    }


    // Private fields //////////////////////////////////////////////////////////


    private _label: string;

    private _color: string;

    private _isSelected: boolean;


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * label
     *
     *   Gets or sets the label of the element.
     */
    label: string;

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
     * isSelected
     *   Gets or sets the selected state of the element.
     */
    isSelected: boolean;

}
