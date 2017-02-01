// File: drawable-interfaces.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import { EDGE_DEFAULTS, NODE_DEFAULTS } from "./defaults";
import * as MathEx from "./math";


// Type aliases ////////////////////////////////////////////////////////////////


/**
 * Drawable  
 *   Type alias for the the union type of `DrawableEdge` and `DrawableNode`.
 */
export type Drawable = DrawableEdge | DrawableNode;

/**
 * LineStyles
 */
export type LineStyles = "solid" | "dotted" | "dashed";

/**
 * Shapes  
 * 
 * TODO:  
 * -For now this only supports circles and squares.
 */
export type Shapes = "circle" | "square";


// Interfaces //////////////////////////////////////////////////////////////////


/**
 * DrawableGraph  
 *   Interface that exposes drawable graph properties and methods.
 */
export interface DrawableGraph {

    /**
     * nodes  
     *   The collection of drawable nodes that are part of the graph.
     */
    readonly nodes: Iterable<DrawableNode>;

    /**
     * edges  
     *   The collection of drawable edges that are part of the graph.
     */
    readonly edges: Iterable<DrawableEdge>;

    /**
     * selectedItems  
     *   The set of selected graph elements.
     */
    readonly selectedItems: Set<Drawable>;

    /**
     * origin  
     *   The displacement of the origin point of the graph editor canvas.
     */
    origin: { x: number, y: number };

    /**
     * scale  
     *   The zoom scale of the graph editor canvas.
     */
    scale: number;

    /**
     * backgroundColor  
     *   What is this doing here? It should be a public property of the graph
     *   editor component.
     */
    backgroundColor: string;

    /**
     * createNode  
     *   Creates a drawable node with an optional position.
     */
    createNode(): DrawableNode;

    /**
     * removeNode  
     *   Guarantees that the given node is not present in the graph.
     */
    removeNode(node: DrawableNode): void;

    /**
     * canCreateEdge  
     *   Checks if a drawable edge can be created with the given source and
     *   destination nodes.
     * 
     *   If `like` is specified, a drawable edge with a matching type of `like`
     *   is checked against the given source and destination nodes.
     * 
     *   This method must be called before calling `createEdge`.
     */
    canCreateEdge(
        src: DrawableNode,
        dst: DrawableNode,
        like?: DrawableEdge
    ): boolean;

    /**
     * createEdge  
     *   Creates a drawable edge with a source and destination node.
     * 
     *   If `like` is specified, a drawable edge with a matching type of `like`
     *   is created.
     * 
     *   The `canCreateEdge` method must be called to check if creating the edge
     *   is valid.
     */
    createEdge(
        src: DrawableNode,
        dst: DrawableNode,
        like?: DrawableEdge
    ): DrawableEdge;

    /**
     * removeEdge  
     *   Guarantees that the given edge is not present in the graph.
     */
    removeEdge(edge: DrawableEdge): void;

}

/**
 * DrawableEdge  
 *   Interface that exposes drawable edge properties.
 */
export interface DrawableEdge {

    /**
     * source  
     *   The source node of the edge.
     */
    source: DrawableNode | null;

    /**
     * destination  
     *   The destination node of the edge.
     */
    destination: DrawableNode | null;

    /**
     * showSourceArrow  
     *   True to draw an arrow pointing to the source node; otherwise, false.
     */
    showSourceArrow: boolean;

    /**
     * showDestinationArrow  
     *   True to draw an arrow pointing to the destination node; otherwise, false.
     */
    showDestinationArrow: boolean;

    /**
     * color  
     *   The color of the edge. This can be any valid `CSS` color string.
     */
    color: string;

    /**
     * lineStyle  
     *   The line style of the edge. This can be `solid`, `dotted`, or `dashed`.
     */
    lineStyle: LineStyles;

    /**
     * lineWidth  
     *   The width of the edge. This value must be non-negative.
     */
    lineWidth: number;

    /**
     * label  
     *   The text label to be displayed by the edge.
     */
    label: string;
}

/**
 * DrawableNode  
 *   Interface that exposes drawable node properties.
 */
export interface DrawableNode {

    /**
     * position  
     *   The coordinates of the center of the node.
     */
    position: { x: number, y: number };

    /**
     * label  
     *   The text label to be displayed in the node.
     */
    label: string;

    /**
     * shape  
     *   The shape of the node.
     */
    shape: Shapes;

    /**
     * color  
     *   The background color of the node.  Can be any valid `CSS` color string.
     */
    color: string;

    /**
     * borderColor  
     *   The border color of the node.  Can be any valid `CSS` color string.
     */
    borderColor: string;

    /**
     * borderStyle  
     *   The line style of the border. Can be `solid`, `dotted`, or `dashed`.
     */
    borderStyle: LineStyles;

    /**
     * borderWidth  
     *   The line width of the border. Set to 0 to draw no border; value must be
     *   non-negative.
     */
    borderWidth: number;
}


// Classes /////////////////////////////////////////////////////////////////////


/**
 * DefaultNode  
 *   Creates a drawable node with default properties.
 */
export class DefaultNode implements DrawableNode {
    label: string = NODE_DEFAULTS.label;
    shape: Shapes = NODE_DEFAULTS.shape;
    color: string = NODE_DEFAULTS.color;
    borderColor: string = NODE_DEFAULTS.borderColor;
    borderStyle: LineStyles = NODE_DEFAULTS.borderStyle;
    borderWidth: number = NODE_DEFAULTS.borderWidth;

    constructor(public position: { x: number, y: number }) { }
}

/**
 * DefaultEdge  
 *   Creates a drawable edge with default properties.
 */
export class DefaultEdge implements DrawableEdge {
    source: DrawableNode | null = EDGE_DEFAULTS.source;
    destination: DrawableNode | null = EDGE_DEFAULTS.destination;
    showSourceArrow: boolean = EDGE_DEFAULTS.showSourceArrow;
    showDestinationArrow: boolean = EDGE_DEFAULTS.showDestinationArrow;
    color: string = EDGE_DEFAULTS.color;
    lineStyle: LineStyles = EDGE_DEFAULTS.lineStyle;
    lineWidth: number = EDGE_DEFAULTS.lineWidth;
    label = EDGE_DEFAULTS.label;

    constructor(sourceNode: DrawableNode | null = EDGE_DEFAULTS.source) {
        this.source = sourceNode;
    }
}


// Functions ///////////////////////////////////////////////////////////////////


/**
 * isDrawableEdge  
 *   Typeguard for drawable edges.
 */
export function isDrawableEdge(obj: any): obj is DrawableEdge {
    return isItThat(obj, EDGE_DEFAULTS);
}

/**
 * isDrawableNode  
 *   Typeguard for drawable nodes.
 */
export function isDrawableNode(obj: any): obj is DrawableNode {
    return isItThat(obj, NODE_DEFAULTS);
}

/**
 * isItThat  
 *   Checks if `it` has the same members as `that`.
 */
function isItThat(it: any, that: any): boolean {
    if (!it)
        return false;
    for (const p in that) {
        if (!((p in it) && (typeof that[p] === typeof it[p])))
            return false;
    }
    return true;
}

/**
 * getOverlappedEdges  
 *   Gets the set of overlapped edges between two nodes. Both nodes are assumed
 *   to be distinct.
 */
export function getOpposingEdges(src: DrawableNode, dst: DrawableNode, nodeEdges: Map<DrawableNode, Set<DrawableEdge>>): Set<DrawableEdge> {
    return intersectNodeEdges(src, dst, nodeEdges, v => src === v.destination && dst === v.source);
}

/**
 * getAdjacentEdges  
 *   Gets adjacent edges.
 */
export function getAdjacentEdges(src: DrawableNode, dst: DrawableNode, nodeEdges: Map<DrawableNode, Set<DrawableEdge>>): Set<DrawableEdge> {
    return intersectNodeEdges(src, dst, nodeEdges, v => src === v.source && dst === v.destination);
}

/**
 * intersectNodeEdges  
 *   Gets the intersection of two edge sets based on a given filter.
 */
function intersectNodeEdges(src: DrawableNode, dst: DrawableNode, nodeEdges: Map<DrawableNode, Set<DrawableEdge>>, filter: (v: DrawableEdge) => boolean): Set<DrawableEdge> {
    let srcEdges = nodeEdges.get(src) as Set<DrawableEdge>;
    let dstEdges = nodeEdges.get(dst) as Set<DrawableEdge>;
    return new Set<DrawableEdge>([...srcEdges, ...dstEdges].filter(filter));
}

/**
 * cloneEdge  
 *   Creates a cloned edge.
 */
export function cloneEdge(e: DrawableEdge): DrawableEdge {
    let clone = new DefaultEdge();
    clone.source = e.source;
    clone.destination = e.destination;
    clone.showSourceArrow = e.showSourceArrow;
    clone.showDestinationArrow = e.showDestinationArrow;
    clone.color = e.color;
    clone.lineStyle = e.lineStyle;
    clone.lineWidth = e.lineWidth;
    clone.label = e.label;
    return clone;
}

/**
 * cloneNode  
 *   Creates a cloned node.
 */
export function cloneNode(n: DrawableNode): DrawableNode {
    let clone = new DefaultNode(n.position);
    clone.label = n.label;
    clone.shape = n.shape;
    clone.color = n.color;
    clone.borderColor = n.borderColor;
    clone.borderStyle = n.borderStyle;
    clone.borderWidth = n.borderWidth;
    return clone;
}
