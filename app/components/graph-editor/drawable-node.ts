// File: drawable-node.ts
// Created by: CJ Dimaano
// Date created: February 4, 2017


import { GRID_SPACING, NODE_PROPERTIES } from "./defaults";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableGraph } from "./drawable-graph";
import { point, size, rect, LineStyles, Shapes } from "./graph-editor-canvas";
import * as MathEx from "./math";


/**
 * DrawableNode
 *
 *   Contains drawable properties for a node.
 */
export class DrawableNode extends DrawableElement {
    constructor(graph: DrawableGraph, like?: DrawableNode) {
        super(graph);
        Object.defineProperties(this, {
            _rect: {
                enumerable: false,
                writable: false,
                value: like ?
                    { x: like._rect.x, y: like._rect.y, height: like._rect.height, width: like._rect.width } :
                    { x: 0, y: 0, height: GRID_SPACING, width: GRID_SPACING }
            },
            _origin: {
                enumerable: false,
                writable: false,
                value: like ?
                    { x: like._origin.x, y: like._origin.y } :
                    { x: 0, y: 0 }
            },
            _shape: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._shape :
                    NODE_PROPERTIES.shape
            },
            _image: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._image :
                    NODE_PROPERTIES.image
            },
            _borderWidth: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._borderWidth :
                    NODE_PROPERTIES.borderWidth
            },
            _borderColor: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._borderColor :
                    NODE_PROPERTIES.borderColor
            },
            _borderStyle: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._borderStyle :
                    NODE_PROPERTIES.borderStyle
            },
            _anchorPoints: {
                enumerable: false,
                writable: true,
                value: like ?
                    like._anchorPoints :
                    []
            },
            position: {
                enumerable: true,
                get: () => this._rect as point,
                set: (value: point) => {
                    const old = { x: this._rect.x, y: this._rect.y };
                    if (value.x !== old.x || value.y !== old.y) {
                        this._rect.x = value.x;
                        this._rect.y = value.y;
                        this.onPropertyChanged("position", old);
                    }
                }
            },
            size: {
                enumerable: true,
                get: () => this._rect as size,
                set: (value: size) => {
                    const old = { height: this._rect.height, width: this._rect.width };
                    if (value.height !== old.height || value.width !== old.width) {
                        this._rect.height = value.height;
                        this._rect.width = value.width;
                        this.onPropertyChanged("size", old);
                    }
                }
            },
            origin: {
                enumerable: true,
                get: () => this._origin,
                set: (value: point) => {
                    const old = { x: this._origin.x, y: this._origin.y };
                    if (value.x !== old.x || value.y !== old.y) {
                        this._origin.x = value.x;
                        this._origin.y = value.y;
                        this.onPropertyChanged("origin", old);
                    }
                }
            },
            shape: {
                enumerable: true,
                get: () => this._shape,
                set: (value: Shapes) => {
                    const old = this._shape;
                    if (value !== old) {
                        this._shape = value;
                        this.onPropertyChanged("shape", old);
                    }
                }
            },
            image: {
                enumerable: true,
                get: () => this._image,
                set: (value: string) => {
                    const old = this._image;
                    if (value !== old) {
                        this._image = value;
                        this.onPropertyChanged("image", old);
                    }
                }
            },
            anchorPoints: {
                enumerable: true,
                get: () => this._anchorPoints,
                set: (value: point[]) => {
                    this._anchorPoints = [];
                    value.forEach(v => {
                        const pt = MathEx.diff(v, this._origin);
                        if (this._anchorPoints.filter(a => a.x === pt.x && a.y === pt.y).length === 0)
                            this._anchorPoints.push(pt);
                    });
                }
            },
            borderWidth: {
                enumerable: true,
                get: () => this._borderWidth,
                set: (value: number) => {
                    value = Math.max(value, 0);
                    const old = this._borderWidth;
                    if (value !== old) {
                        this._borderWidth = value;
                        this.onPropertyChanged("borderWidth", old);
                    }
                }
            },
            borderColor: {
                enumerable: true,
                get: () => this._borderColor,
                set: (value: string) => {
                    const old = this._borderColor;
                    if (value !== old) {
                        this._borderColor = value;
                        this.onPropertyChanged("borderColor", old);
                    }
                }
            },
            borderStyle: {
                enumerable: true,
                get: () => this._borderStyle,
                set: (value: LineStyles) => {
                    const old = this._borderStyle;
                    if (value !== old) {
                        this._borderStyle = value;
                        this.onPropertyChanged("borderStyle", old);
                    }
                }
            },
            incomingEdges: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableEdge>()
            },
            outgoingEdges: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableEdge>()
            },
            edges: {
                enumerable: false,
                get: () => new Set<DrawableEdge>([...this.incomingEdges, ...this.outgoingEdges])
            }
        });
        Object.seal(this);
        this.color = (like ? like.color : NODE_PROPERTIES.color);
        this.label = (like ? like.label : NODE_PROPERTIES.label);
    }


    // Private fields //////////////////////////////////////////////////////////


    private _rect: rect;

    private _origin: point;

    private _shape: Shapes;

    private _image: string;

    private _borderWidth: number;

    private _borderColor: string;

    private _borderStyle: LineStyles;

    private _anchorPoints: point[];


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * position
     *
     *   Gets or sets the position of the node.
     */
    position: point;

    /**
     * size
     *
     *   Gets or sets the size of the node.
     */
    size: size;

    /**
     * origin
     *
     *   Gets or sets the location of the node origin relative to its position.
     *
     * <p>
     *   The origin point is subtracted from the node position prior to being
     *   drawn. The point (0, 0) is the center of the node geometry; in the case
     *   of an image, it is the center of its height and width.
     * </p>
     */
    origin: point;

    /**
     * shape
     *
     *   Gets or sets the shape of the node.
     */
    shape: Shapes;

    /**
     * image
     *
     *   Gets or sets the file path to a custom SVG image.
     */
    image: string;

    /**
     * anchorPoints
     *   Gets or sets the anchor points.
     *
     * <p>
     *   Anchor points are relative to the node origin point. Duplicates are
     *   ignored. If no anchor points are defined, the boundary of the shape is
     *   used to determine where to draw the anchor point.
     * </p>
     */
    anchorPoints: point[];

    /**
     * borderWidth
     *   Gets or sets the line width of the border.
     */
    borderWidth: number;

    /**
     * borderColor
     *   Gets or sets the color of the node border.
     */
    borderColor: string;

    /**
     * borderStyle
     *   Gets or sets the line style of the border.
     */
    borderStyle: LineStyles;

    /**
     * incomingEdges
     *
     *   Gets the set of edges whose destination node is this node.
     */
    incomingEdges: Set<DrawableEdge>;

    /**
     * outgoingEdges
     *
     *   Gets the set of edges whose source node is this node.
     */
    outgoingEdges: Set<DrawableEdge>;

    /**
     * edges
     *
     *   Gets the set of edges connected to this node.
     */
    edges: Set<DrawableEdge>;


    // Public Methods //////////////////////////////////////////////////////////


    /**
     * addEdge
     *
     *   Adds an edge to the node.
     */
    addEdge(edge: DrawableEdge) {
        if (this === edge.source)
            this.outgoingEdges.add(edge);
        if (this === edge.destination)
            this.incomingEdges.add(edge);
    }

    /**
     * removeEdge
     *
     *   Removes an edge from the node.
     */
    removeEdge(edge: DrawableEdge) {
        this.outgoingEdges.delete(edge);
        this.incomingEdges.delete(edge);
    }

}
