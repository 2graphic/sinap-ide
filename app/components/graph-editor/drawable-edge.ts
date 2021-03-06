/**
 * @file `drawable-edge.ts`
 *   Created on February 4, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


import { EDGE_PROPERTIES } from "./defaults";
import { DrawableGraph } from "./drawable-graph";
import { DrawableElement } from "./drawable-element";
import { DrawableNode } from "./drawable-node";
import { LineStyles, point } from "./editor-canvas";


/**
 * `DrawableEdge`
 *
 *   Represents an edge that is drawn on the `GraphEditorComponent`.
 *
 *   Emits `change` events.
 *
 * @extends DrawableElement
 */
export class DrawableEdge extends DrawableElement {
    constructor(
        graph: DrawableGraph,
        public readonly source: DrawableNode,
        public readonly destination: DrawableNode,
        like?: DrawableEdge
    ) {
        super(graph);
        Object.defineProperties(this, {
            _showSourceArrow: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._showSourceArrow :
                    EDGE_PROPERTIES.showSourceArrow
            },
            _showDestinationArrow: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._showDestinationArrow :
                    EDGE_PROPERTIES.showDestinationArrow
            },
            _lineStyle: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._lineStyle :
                    EDGE_PROPERTIES.lineStyle
            },
            _lineWidth: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._lineWidth :
                    EDGE_PROPERTIES.lineWidth
            },
            _sourcePoint: {
                enumerable: false,
                writable: false,
                value: like ?
                    { x: like._sourcePoint.x, y: like._sourcePoint.y } :
                    { x: source.origin.x, y: source.origin.y }
            },
            _destinationPoint: {
                enumerable: false,
                writable: false,
                value: like ?
                    {
                        x: like._destinationPoint.x,
                        y: like._destinationPoint.y
                    } :
                    { x: destination.origin.x, y: destination.origin.y }
            },
            source: {
                enumerable: true,
                writable: false
            },
            destination: {
                enumerable: true,
                writable: false
            },
            sourcePoint: {
                enumerable: true,
                get: () => this._sourcePoint,
                set: (value: point) => {
                    const old = { x: this._sourcePoint.x, y: this._sourcePoint.y };
                    if (value.x !== old.x || value.y !== old.y) {
                        this._sourcePoint.x = value.x;
                        this._sourcePoint.y = value.y;
                        this.onPropertyChanged("sourcePoint", old);
                    }
                }
            },
            destinationPoint: {
                enumerable: true,
                get: () => this._destinationPoint,
                set: (value: point) => {
                    const old = { x: this._destinationPoint.x, y: this._destinationPoint.y };
                    if (value.x !== old.x || value.y !== old.y) {
                        this._destinationPoint.x = value.x;
                        this._destinationPoint.y = value.y;
                        this.onPropertyChanged("destinationPoint", old);
                    }
                }
            },
            showSourceArrow: {
                enumerable: true,
                get: () => this._showSourceArrow,
                set: (value: boolean) => {
                    const old = this._showSourceArrow;
                    if (value !== old) {
                        this._showSourceArrow = value;
                        this.onPropertyChanged("showSourceArrow", old);
                    }
                }
            },
            showDestinationArrow: {
                enumerable: true,
                get: () => this._showDestinationArrow,
                set: (value: boolean) => {
                    const old = this._showDestinationArrow;
                    if (value !== old) {
                        this._showDestinationArrow = value;
                        this.onPropertyChanged("showDestinationArrow", old);
                    }
                }
            },
            lineStyle: {
                enumerable: true,
                get: () => this._lineStyle,
                set: (value: LineStyles) => {
                    const old = this._lineStyle;
                    if (value !== old) {
                        this._lineStyle = value;
                        this.onPropertyChanged("lineStyle", old);
                    }
                }
            },
            lineWidth: {
                enumerable: true,
                get: () => this._lineWidth,
                set: (value: number) => {
                    value = Math.max(value, 0);
                    const old = this._lineWidth;
                    if (value !== old) {
                        this._lineWidth = value;
                        this.onPropertyChanged("lineWidth", old);
                    }
                }
            }
        });
        Object.seal(this);
        this.color = (like ? like.color : EDGE_PROPERTIES.color);
        this.label = (like ? like.label : EDGE_PROPERTIES.label);
        this.source.addEdge(this);
        this.destination.addEdge(this);
    }


    // Private fields //////////////////////////////////////////////////////////


    private _showSourceArrow: boolean;
    private _showDestinationArrow: boolean;
    private _lineStyle: LineStyles;
    private _lineWidth: number;
    private _sourcePoint: point;
    private _destinationPoint: point;


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * `showSourceArrow`
     *
     *   Gets or sets whether or not an arrow should be displayed towards the
     *   source node.
     *
     * @emits Drawable#change
     */
    showSourceArrow: boolean;

    /**
     * `showDestinationArrow`
     *
     *   Gets or sets whether or not an arrow should be displayed towards the
     *   destination node.
     *
     * @emits Drawable#change
     */
    showDestinationArrow: boolean;

    /**
     * `lineStyle`
     *
     *   Gets or sets the line style of the edge.
     *
     * @emits Drawable#change
     */
    lineStyle: LineStyles;

    /**
     * `lineWidth`
     *
     *   Gets or sets the width of the line of the edge.
     *
     * @emits Drawable#change
     */
    lineWidth: number;

    /**
     * `sourcePoint`
     *
     *   Gets or sets the endpoint of the edge relative to its source node.
     */
    sourcePoint: point;

    /**
     * `destinationPoint`
     *
     *   Gets or sets the endpoint of the edge relative to its destination node.
     */
    destinationPoint: point;

}
