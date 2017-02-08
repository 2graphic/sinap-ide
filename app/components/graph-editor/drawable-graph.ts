// File: drawable-graph.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//


import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";


/**
 * EdgeValidator  
 *   Determines whether or not an edge is valid for a given source and
 *   destination node.
 * 
 *   If `dst` is not specified, the validator should check if an edge can be
 *   created from the source node.
 * 
 *   If `like` is specified, a drawable edge with a matching type of `like`
 *   is checked against the given source and destination nodes.
 */
export type EdgeValidator = (
    src: DrawableNode | null,
    dst?: DrawableNode,
    like?: DrawableEdge
) => boolean;

type DrawableEventListener<D extends DrawableElement>
    = Listener<DrawableEventArgs<D>>;

export type DrawableEdgeEventListener = DrawableEventListener<DrawableEdge>;
export type DrawableNodeEventListener = DrawableEventListener<DrawableNode>;

export type DrawableEdgeEventArgs = DrawableEventArgs<DrawableEdge>;
export type DrawableNodeEventArgs = DrawableEventArgs<DrawableNode>;


type DrawableEdgeEventEmitter = DrawableEventEmitter<DrawableEdge>;
type DrawableNodeEventEmitter = DrawableEventEmitter<DrawableNode>;

/**
 * DrawableGraph  
 *   Exposes drawable graph properties and methods.
 */
export class DrawableGraph {

    private _creatingNodeEmitter: DrawableNodeEventEmitter
    = new DrawableEventEmitter<DrawableNode>();

    private _createdNodeEmitter: DrawableNodeEventEmitter
    = new DrawableEventEmitter<DrawableNode>();

    private _creatingEdgeEmitter: DrawableEdgeEventEmitter
    = new DrawableEventEmitter<DrawableEdge>();

    private _createdEdgeEmitter: DrawableEdgeEventEmitter
    = new DrawableEventEmitter<DrawableEdge>();

    private _deletedNodeEmitter: DrawableNodeEventEmitter
    = new DrawableEventEmitter<DrawableNode>();

    private _deletedEdgeEmitter: DrawableEdgeEventEmitter
    = new DrawableEventEmitter<DrawableEdge>();

    private _propertyChangedEmitter: PropertyChangedEventEmitter<any>
    = new PropertyChangedEventEmitter<any>();

    private _selectionChangedEmitter: PropertyChangedEventEmitter<Iterable<DrawableElement>>
    = new PropertyChangedEventEmitter<Iterable<DrawableElement>>();

    private _nodes: Set<DrawableNode>
    = new Set<DrawableNode>();

    private _edges: Set<DrawableEdge>
    = new Set<DrawableEdge>();

    private _selected: Set<DrawableElement>
    = new Set<DrawableElement>();

    private _unselected: Set<DrawableElement>
    = new Set<DrawableElement>();

    private _origin: { x: number, y: number }
    = { x: 0, y: 0 };

    private _scale: number
    = 1;

    constructor(public readonly isValidEdge: EdgeValidator) { }

    /**
     * nodes  
     *   The iterable collection of drawable nodes that are part of the graph.
     */
    get nodes(): Iterable<DrawableNode> {
        return this._nodes;
    }

    /**
     * edges  
     *   The iterable collection of drawable edges that are part of the graph.
     */
    get edges(): Iterable<DrawableEdge> {
        return this._edges;
    }

    /**
     * selectedItems  
     *   The iterable of selected drawable elements.
     */
    get selectedItems(): Iterable<DrawableElement> {
        return this._selected;
    }

    /**
     * origin  
     *   The displacement of the origin point of the graph editor canvas.
     */
    get origin() {
        return this._origin;
    }

    set origin(value: { x: number, y: number }) {
        if (this._origin.x !== value.x || this._origin.y !== value.y) {
            this._origin.x = value.x;
            this._origin.y = value.y;
        }
    }

    /**
     * scale  
     *   The zoom scale of the graph editor canvas.
     */
    get scale() {
        return this._scale;
    }

    set scale(value: number) {
        if (this._scale !== value) {
            this._scale = value;
        }
    }

    addCreatingNodeListener(listener: DrawableNodeEventListener) {
        this._creatingNodeEmitter.addListener(listener);
    }
    removeCreatingNodeListener(listener: DrawableNodeEventListener) {
        this._creatingNodeEmitter.removeListener(listener);
    }


    addCreatedNodeListener(listener: DrawableNodeEventListener) {
        this._createdNodeEmitter.addListener(listener);
    }
    removeCreatedNodeListener(listener: DrawableNodeEventListener) {
        this._createdNodeEmitter.removeListener(listener);
    }


    addCreatingEdgeListener(listener: DrawableEdgeEventListener) {
        this._creatingEdgeEmitter.addListener(listener);
    }
    removeCreatingEdgeListener(listener: DrawableEdgeEventListener) {
        this._creatingEdgeEmitter.removeListener(listener);
    }


    addCreatedEdgeListener(listener: DrawableEdgeEventListener) {
        this._createdEdgeEmitter.addListener(listener);
    }
    removeCreatedEdgeListener(listener: DrawableEdgeEventListener) {
        this._createdEdgeEmitter.removeListener(listener);
    }


    addDeletedNodeListener(listener: DrawableNodeEventListener) {
        this._deletedNodeEmitter.addListener(listener);
    }
    removeDeletedNodeListener(listener: DrawableNodeEventListener) {
        this._deletedNodeEmitter.removeListener(listener);
    }


    addDeletedEdgeListener(listener: DrawableEdgeEventListener) {
        this._deletedEdgeEmitter.addListener(listener);
    }
    removeDeletedEdgeListener(listener: DrawableEdgeEventListener) {
        this._deletedEdgeEmitter.removeListener(listener);
    }


    addPropertyChangedListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.addListener(listener);
    }
    removePropertyChangedListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.removeListener(listener);
    }


    addSelectionChangedListener(listener: PropertyChangedEventListener<Iterable<DrawableElement>>) {
        this._selectionChangedEmitter.addListener(listener);
    }
    removeSelectionChangedListener(listener: PropertyChangedEventListener<Iterable<DrawableElement>>) {
        this._selectionChangedEmitter.removeListener(listener);
    }


    /**
     * createNode  
     *   Creates a drawable node with an optional position.
     */
    createNode(): DrawableNode | null {
        // TODO:
        // Events.
        return null;
    }

    /**
     * deleteNode  
     *   Guarantees that the given node is not present in the graph.
     */
    deleteNode(node: DrawableNode): boolean {
        // TODO:
        // Events.
        return this._nodes.delete(node);
    }

    /**
     * createEdge  
     *   Creates a drawable edge with a source and destination node.
     * 
     *   If `like` is specified, a drawable edge with a matching type of `like`
     *   is created.
     * 
     *   The `isValidEdge` method must be called to check if creating the edge
     *   is valid.
     */
    createEdge(
        src: DrawableNode,
        dst: DrawableNode,
        like?: DrawableEdge
    ): DrawableEdge | null {
        let d = new DrawableEdge(src, dst, g)
        return null;
    }

    /**
     * deleteEdge  
     *   Guarantees that the given edge is not present in the graph.
     */
    deleteEdge(edge: DrawableEdge): boolean {
        return this.deleteItem(
            this._edges,
            edge,
            this._deletedEdgeEmitter,
            this._propertyChangedEmitter,
            "edge");
    }

    selectItems(...items: DrawableElement[]) {
        this.moveSelectedItems(this._unselected, this._selected, ...items);
    }

    deselectItems(...items: DrawableElement[]) {
        this.moveSelectedItems(this._selected, this._unselected, ...items);
    }

    clearSelection() {
        this.moveSelectedItems(
            this._selected,
            this._unselected,
            ...this._selected
        );
    }

    deleteSelected() {
        let selected = [...this._selected];
        let edges = [...this._edges];
        let nodes = [...this._nodes];
        this.clearSelection();
        selected.forEach(v => {
            if (v instanceof DrawableEdge && this._edges.delete(v)) {
                this._deletedEdgeEmitter.emit(
                    new DrawableEventArgs<DrawableEdge>(this, v)
                );
            }
            else if (v instanceof DrawableNode) {
                this._nodes.delete(v);
                this._deletedNodeEmitter.emit(
                    new DrawableEventArgs<DrawableNode>(this, v)
                );
                v.edges.forEach(e => {
                    if (this._edges.delete(e))
                        this._deletedEdgeEmitter.emit(
                            new DrawableEventArgs<DrawableEdge>(this, e)
                        );
                });
            }
        });
        if (edges.length !== this._edges.size)
            this._propertyChangedEmitter.emit(new PropertyChangedEventArgs<any>(
                this,
                "edges",
                edges,
                [...this._edges]
            ));
        if (nodes.length !== this._nodes.size)
            this._propertyChangedEmitter.emit(new PropertyChangedEventArgs<any>(
                this,
                "nodes",
                nodes,
                [...this._nodes]
            ));
    }

    private deleteItem<T extends DrawableElement>(
        items: Set<T>,
        item: T,
        deletedEmitter: DrawableEventEmitter<T>,
        propertyEmitter: PropertyChangedEventEmitter<any>,
        key: string
    ): boolean {
        let old = [...items];
        if (items.delete(item)) {
            this.deselectItems(item);
            deletedEmitter.emit(new DrawableEventArgs<T>(this, item)),
                propertyEmitter.emit(new PropertyChangedEventArgs<any>(
                    this,
                    key,
                    old,
                    [...items]
                ));
            return true;
        }
        return false;
    }

    private moveSelectedItems(
        src: Set<DrawableElement>,
        dst: Set<DrawableElement>,
        ...items: DrawableElement[]
    ) {
        let oldSelection = [...this._selected];
        items.forEach(v => {
            if (!dst.has(v)) {
                v.isSelected = (dst === this._selected);
                dst.add(v);
                src.delete(v);
            }
        });
        if (oldSelection.length !== this._selected.size) {
            this._selectionChangedEmitter.emit(
                new PropertyChangedEventArgs<Iterable<DrawableElement>>(
                    this,
                    "selectedItems",
                    oldSelection,
                    [...this._selected]
                )
            );
        }
    }

}

class DrawableEventArgs<D extends DrawableElement> extends CancellableEventArgs {
    constructor(source: any, public readonly drawable: D) {
        super(source);
    }
}

class DrawableEventEmitter<D extends DrawableElement>
    extends CancellableEventEmitter<DrawableEventArgs<D>, DrawableEventListener<D>> {
    protected invoke(l: DrawableEventListener<D>, a: DrawableEventArgs<D>) {
        l(a);
    }
}
