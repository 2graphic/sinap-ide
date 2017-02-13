// File: drawable-graph.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016


import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";
import {
    CancellableEventArgs,
    CancellableEventEmitter,
    Listener,
    PropertyChangedEventArgs,
    PropertyChangedEventEmitter,
    PropertyChangedEventListener
} from "./events";


/**
 * EdgeValidator  
 *   Determines whether or not an edge is valid for a given source and
 *   destination node.
 * 
 * <p>
 *   If `dst` is not specified, the validator should check if an edge can be
 *   created from the source node.
 * </p>
 * 
 * <p>
 *   If `like` is specified, a drawable edge with a matching type of `like`
 *   should be checked against the given source and destination nodes.
 * </p>
 */
export type EdgeValidator = (
    src: DrawableNode,
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

    /**
     * _creatingNodeEmitter  
     *   The event emitter for creating nodes.
     */
    private _creatingNodeEmitter: DrawableNodeEventEmitter
    = new DrawableEventEmitter<DrawableNode>();

    /**
     * _createdNodeEmitter  
     *   The event emitter for created nodes.
     */
    private _createdNodeEmitter: DrawableNodeEventEmitter
    = new DrawableEventEmitter<DrawableNode>();

    /**
     * _creatingEdgeEmitter  
     *   The event emitter for creating edges.
     */
    private _creatingEdgeEmitter: DrawableEdgeEventEmitter
    = new DrawableEventEmitter<DrawableEdge>();

    /**
     * _createdEdgeEmitter  
     *   The event emitter for created edges.
     */
    private _createdEdgeEmitter: DrawableEdgeEventEmitter
    = new DrawableEventEmitter<DrawableEdge>();

    /**
     * _deletedNodeEmitter  
     *   The event emitter for deleted nodes.
     */
    private _deletedNodeEmitter: DrawableNodeEventEmitter
    = new DrawableEventEmitter<DrawableNode>();

    /**
     * _deletedEdgeEmitter  
     *   The event emitter for deleted edges.
     */
    private _deletedEdgeEmitter: DrawableEdgeEventEmitter
    = new DrawableEventEmitter<DrawableEdge>();

    /**
     * _propertyChangedEmitter  
     *   The event emitter for property changes.
     */
    private _propertyChangedEmitter: PropertyChangedEventEmitter<any>
    = new PropertyChangedEventEmitter<any>();

    /**
     * _selectionChangedEmitter  
     *   The event emitter for selection changes.
     */
    private _selectionChangedEmitter: PropertyChangedEventEmitter<Iterable<DrawableElement>>
    = new PropertyChangedEventEmitter<Iterable<DrawableElement>>();

    /**
     * _nodes  
     *   The set of nodes.
     */
    private _nodes: Set<DrawableNode>
    = new Set<DrawableNode>();

    /**
     * _edges  
     *   The set of edges.
     */
    private _edges: Set<DrawableEdge>
    = new Set<DrawableEdge>();

    /**
     * _selected  
     *   The set of selected elements.
     */
    private _selected: Set<DrawableElement>
    = new Set<DrawableElement>();

    /**
     * _unselected  
     *   The set of unselected elements.
     */
    private _unselected: Set<DrawableElement>
    = new Set<DrawableElement>();

    /**
     * _origin  
     *   The origin point of the graph.
     */
    private _origin: { x: number, y: number }
    = { x: 0, y: 0 };

    /**
     * _scale  
     *   The zoom scale of the graph.
     */
    private _scale: number
    = 1;

    /**
     * constructor
     */
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
     *   The iterable collection of selected drawable elements.
     */
    get selectedItems(): Iterable<DrawableElement> {
        return this._selected;
    }

    /**
     * selectedItemCount  
     *   The number of selected items.
     */
    get selectedItemCount(): number {
        return this._selected.size;
    }

    /**
     * origin  
     *   The displacement of the origin point of the graph editor canvas.
     */
    get origin() {
        let pt = this._origin;
        return { get x() { return pt.x; }, get y() { return pt.y; } };
    }

    set origin(value: { x: number, y: number }) {
        let old = this.origin;
        if (this._origin.x !== value.x || this._origin.y !== value.y) {
            this._origin.x = value.x;
            this._origin.y = value.y;
            this.onPropertyChanged("origin", old);
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
        let old = this._scale;
        if (this._scale !== value) {
            this._scale = value;
            this.onPropertyChanged("scale", old);
        }
    }

    /**
     * addCreatingNodeListener  
     *   Adds a listener to the creating node event.
     */
    addCreatingNodeListener(listener: DrawableNodeEventListener) {
        this._creatingNodeEmitter.addListener(listener);
    }

    /**
     * removeCreatingNodeListener  
     *   Removes a listener from the creating node event.
     */
    removeCreatingNodeListener(listener: DrawableNodeEventListener) {
        this._creatingNodeEmitter.removeListener(listener);
    }

    /**
     * addCreatedNodeListener  
     *   Adds a listener to the created node event.
     */
    addCreatedNodeListener(listener: DrawableNodeEventListener) {
        this._createdNodeEmitter.addListener(listener);
    }

    /**
     * removeCreatedNodeListener  
     *   Removes a listener from the created node event.
     */
    removeCreatedNodeListener(listener: DrawableNodeEventListener) {
        this._createdNodeEmitter.removeListener(listener);
    }

    /**
     * addCreatingEdgeListener  
     *   Adds a listener to the creating edge event.
     */
    addCreatingEdgeListener(listener: DrawableEdgeEventListener) {
        this._creatingEdgeEmitter.addListener(listener);
    }

    /**
     * removeCreatingEdgeListener  
     *   Removes a listener from the creating edge event.
     */
    removeCreatingEdgeListener(listener: DrawableEdgeEventListener) {
        this._creatingEdgeEmitter.removeListener(listener);
    }

    /**
     * addCreatedEdgeListener  
     *   Adds a listener to the created edge event.
     */
    addCreatedEdgeListener(listener: DrawableEdgeEventListener) {
        this._createdEdgeEmitter.addListener(listener);
    }

    /**
     * removeCreatedEdgeListener  
     *   Removes a listener from the created event event.
     */
    removeCreatedEdgeListener(listener: DrawableEdgeEventListener) {
        this._createdEdgeEmitter.removeListener(listener);
    }

    /**
     * addDeletedNodeListener  
     *   Adds a listener for the deleted node event.
     */
    addDeletedNodeListener(listener: DrawableNodeEventListener) {
        this._deletedNodeEmitter.addListener(listener);
    }

    /**
     * removeDeletedNodeListener  
     *   Removes a listener from the deleted node event.
     */
    removeDeletedNodeListener(listener: DrawableNodeEventListener) {
        this._deletedNodeEmitter.removeListener(listener);
    }

    /**
     * addDeletedEdgeListener  
     *   Adds a listener to the deleted edge event.
     */
    addDeletedEdgeListener(listener: DrawableEdgeEventListener) {
        this._deletedEdgeEmitter.addListener(listener);
    }

    /**
     * removeDeletedEdgeListener  
     *   Removes a listener from the deleted edge event.
     */
    removeDeletedEdgeListener(listener: DrawableEdgeEventListener) {
        this._deletedEdgeEmitter.removeListener(listener);
    }

    /**
     * addPropertyChangedListener  
     *   Adds a listener to the property changed event.
     */
    addPropertyChangedListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.addListener(listener);
    }

    /**
     * removePropertyChangedListener  
     *   Removes a listener from the property changed event.
     */
    removePropertyChangedListener(listener: PropertyChangedEventListener<any>) {
        this._propertyChangedEmitter.removeListener(listener);
    }

    /**
     * addSelectionChangedListener  
     *   Adds a listener to the selection changed event.
     */
    addSelectionChangedListener(listener: PropertyChangedEventListener<Iterable<DrawableElement>>) {
        this._selectionChangedEmitter.addListener(listener);
    }

    /**
     * removeSelectionChangedListener  
     *   Removes a listener from the selection changed event.
     */
    removeSelectionChangedListener(listener: PropertyChangedEventListener<Iterable<DrawableElement>>) {
        this._selectionChangedEmitter.removeListener(listener);
    }

    /**
     * createNode  
     *   Creates a drawable node.
     */
    createNode(): DrawableNode | null {
        return this.createItem(
            this._nodes,
            new DrawableNode(this),
            this._creatingNodeEmitter,
            this._createdNodeEmitter,
            "nodes"
        );
    }

    /**
     * deleteNode  
     *   Guarantees that the given node is not present in the graph.
     */
    deleteNode(node: DrawableNode): boolean {
        return this.deleteItem(
            this._nodes,
            node,
            this._deletedNodeEmitter,
            "nodes"
        );
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
        if (like)
            this.deleteEdge(like);
        return this.createItem(
            this._edges,
            new DrawableEdge(this, src, dst, like),
            this._creatingEdgeEmitter,
            this._createdEdgeEmitter,
            "edges"
        );
    }

    /**
     * deleteEdge  
     *   Guarantees that the given edge is not present in the graph.
     */
    deleteEdge(edge: DrawableEdge): boolean {
        edge.sourceNode.removeEdge(edge);
        edge.destinationNode.removeEdge(edge);
        return this.deleteItem(
            this._edges,
            edge,
            this._deletedEdgeEmitter,
            "edges"
        );
    }

    /**
     * selectItems  
     *   Adds items to the selection.
     */
    selectItems(...items: DrawableElement[]) {
        this.moveSelectedItems(this._unselected, this._selected, ...items);
    }

    /**
     * deselectItems  
     *   Removes items from the selection.
     */
    deselectItems(...items: DrawableElement[]) {
        this.moveSelectedItems(this._selected, this._unselected, ...items);
    }

    /**
     * clearSelection  
     *   Clears the selection.
     */
    clearSelection() {
        this.moveSelectedItems(
            this._selected,
            this._unselected,
            ...this._selected
        );
    }

    /**
     * deleteSelected  
     *   Deletes the selected items from the graph.
     */
    deleteSelected() {
        let selected = [...this._selected];
        let edges = [...this._edges];
        let nodes = [...this._nodes];
        let deleteEdge = (d: DrawableEdge) => {
            if (this._edges.delete(d)) {
                d.sourceNode.removeEdge(d);
                d.destinationNode.removeEdge(d);
                this._deletedEdgeEmitter.emit(
                    new DrawableEventArgs<DrawableEdge>(this, d)
                );
            }
        }
        this.clearSelection();
        selected.forEach(v => {
            if (v instanceof DrawableEdge) {
                deleteEdge(v);
            }
            else if (v instanceof DrawableNode) {
                this._nodes.delete(v);
                this._deletedNodeEmitter.emit(
                    new DrawableEventArgs<DrawableNode>(this, v)
                );
                v.edges.forEach(e => deleteEdge(e));
            }
        });
        if (edges.length !== this._edges.size)
            this.onPropertyChanged("edges", edges);
        if (nodes.length !== this._nodes.size)
            this.onPropertyChanged("nodes", nodes);
    }

    /**
     * onPropertyChanged  
     *   Emits the property changed event.
     */
    private onPropertyChanged(key: keyof this, old: any) {
        this._propertyChangedEmitter.emit(new PropertyChangedEventArgs<any>(
            this,
            key,
            old,
            this[key]
        ));
    }

    /**
     * creatItem  
     *   Creates a drawable element.
     */
    private createItem<D extends DrawableElement>(
        items: Set<D>,
        item: D,
        creatingEmitter: DrawableEventEmitter<D>,
        createdEmitter: DrawableEventEmitter<D>,
        key: keyof this
    ) {
        let old = [...items];
        let args = new DrawableEventArgs<D>(this, item);
        creatingEmitter.emit(args)
        if (args.isCancelled)
            return null;
        items.add(item);
        createdEmitter.emit(args);
        this.onPropertyChanged(key, old);
        return item;
    }

    /**
     * deleteItem  
     *   Deletes a drawable element.
     */
    private deleteItem<D extends DrawableElement>(
        items: Set<D>,
        item: D,
        deletedEmitter: DrawableEventEmitter<D>,
        key: keyof this
    ): boolean {
        let old = [...items];
        if (items.delete(item)) {
            this.deselectItems(item);
            deletedEmitter.emit(new DrawableEventArgs<D>(this, item));
            this.onPropertyChanged(key, old);
            return true;
        }
        return false;
    }

    /**
     * moveSelectedItems  
     *   Moves items from one set to the other.
     */
    private moveSelectedItems(
        src: Set<DrawableElement>,
        dst: Set<DrawableElement>,
        ...items: DrawableElement[]
    ) {
        let oldSelection = [...this._selected];
        items.forEach(v => {
            if (!dst.has(v)) {
                dst.add(v);
                src.delete(v);
                v.isSelected = (dst === this._selected);
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

/**
 * DrawableEventArgs  
 *   Event arguments for a drawable event.
 */
export class DrawableEventArgs<D extends DrawableElement> extends CancellableEventArgs {
    constructor(source: any, public readonly drawable: D) {
        super(source);
    }
}

/**
 * DrawableEventEmitter  
 *   Event emitter for drawable events.
 */
class DrawableEventEmitter<D extends DrawableElement>
    extends CancellableEventEmitter<DrawableEventArgs<D>, DrawableEventListener<D>> {
}
