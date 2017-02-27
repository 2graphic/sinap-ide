// File: drawable-graph.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016


import { point } from "./graph-editor-canvas";
import { Drawable } from "./drawable";
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


// Typedefs ////////////////////////////////////////////////////////////////////


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


// Classes /////////////////////////////////////////////////////////////////////


/**
 * DrawableGraph
 *   Exposes drawable graph properties and methods.
 */
export class DrawableGraph extends Drawable {
    constructor(public readonly isValidEdge: EdgeValidator) {
        super();
        Object.defineProperties(this, {
            _creatingNodeEmitter: {
                enumerable: false,
                writable: false,
                value: new DrawableEventEmitter<DrawableNode>()
            },
            _createdNodeEmitter: {
                enumerable: false,
                writable: false,
                value: new DrawableEventEmitter<DrawableNode>()
            },
            _creatingEdgeEmitter: {
                enumerable: false,
                writable: false,
                value: new DrawableEventEmitter<DrawableEdge>()
            },
            _createdEdgeEmitter: {
                enumerable: false,
                writable: false,
                value: new DrawableEventEmitter<DrawableEdge>()
            },
            _deletedNodeEmitter: {
                enumerable: false,
                writable: false,
                value: new DrawableEventEmitter<DrawableNode>()
            },
            _deletedEdgeEmitter: {
                enumerable: false,
                writable: false,
                value: new DrawableEventEmitter<DrawableEdge>()
            },
            _selectionChangedEmitter: {
                enumerable: false,
                writable: false,
                value: new PropertyChangedEventEmitter<Iterable<DrawableElement>>()
            },
            _deleted: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableElement>()
            },
            _nodes: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableNode>()
            },
            _edges: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableEdge>()
            },
            _selected: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableElement>()
            },
            _unselected: {
                enumerable: false,
                writable: false,
                value: new Set<DrawableElement>()
            },
            _origin: {
                enumerable: false,
                writable: false,
                value: { x: 0, y: 0 }
            },
            _scale: {
                enumerable: false,
                writable: true,
                value: 1
            },
            isValidEdge: { enumerable: false },
            nodes: {
                enumerable: false,
                get: () => this._nodes
            },
            edges: {
                enumerable: false,
                get: () => this._edges
            },
            selectedItems: {
                enumerable: false,
                get: () => this._selected
            },
            selectedItemCount: {
                enumerable: false,
                get: () => this._selected.size
            },
            origin: {
                enumerable: false,
                get: () => this._origin,
                set: (value: point) => {
                    let old = this.origin;
                    if (this._origin.x !== value.x || this._origin.y !== value.y) {
                        this._origin.x = value.x;
                        this._origin.y = value.y;
                        this.onPropertyChanged("origin", old);
                    }
                }
            },
            scale: {
                enumerable: false,
                get: () => this._scale,
                set: (value: number) => {
                    let old = this._scale;
                    if (this._scale !== value) {
                        this._scale = value;
                        this.onPropertyChanged("scale", old);
                    }
                }
            }
        });
        Object.seal(this);
    }


    // Private fields //////////////////////////////////////////////////////////


    /**
     * _creatingNodeEmitter
     *   The event emitter for creating nodes.
     */
    private _creatingNodeEmitter: DrawableNodeEventEmitter;

    /**
     * _createdNodeEmitter
     *   The event emitter for created nodes.
     */
    private _createdNodeEmitter: DrawableNodeEventEmitter;

    /**
     * _creatingEdgeEmitter
     *   The event emitter for creating edges.
     */
    private _creatingEdgeEmitter: DrawableEdgeEventEmitter;

    /**
     * _createdEdgeEmitter
     *   The event emitter for created edges.
     */
    private _createdEdgeEmitter: DrawableEdgeEventEmitter;

    /**
     * _deletedNodeEmitter
     *   The event emitter for deleted nodes.
     */
    private _deletedNodeEmitter: DrawableNodeEventEmitter;

    /**
     * _deletedEdgeEmitter
     *   The event emitter for deleted edges.
     */
    private _deletedEdgeEmitter: DrawableEdgeEventEmitter;

    /**
     * _selectionChangedEmitter
     *   The event emitter for selection changes.
     */
    private _selectionChangedEmitter: PropertyChangedEventEmitter<Iterable<DrawableElement>>;

    /**
     * _nodes
     *   The set of nodes.
     */
    private _nodes: Set<DrawableNode>;

    /**
     * _edges
     *   The set of edges.
     */
    private _edges: Set<DrawableEdge>;

    /**
     * _deleted
     *   The set of deleted elements.
     */
    private _deleted: Set<DrawableElement>;

    /**
     * _selected
     *   The set of selected elements.
     */
    private _selected: Set<DrawableElement>;

    /**
     * _unselected
     *   The set of unselected elements.
     */
    private _unselected: Set<DrawableElement>;

    /**
     * _origin
     *   The origin point of the graph.
     */
    private _origin: { x: number, y: number };

    /**
     * _scale
     *   The zoom scale of the graph.
     */
    private _scale: number;


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * nodes
     *   The iterable collection of drawable nodes that are part of the graph.
     */
    readonly nodes: Iterable<DrawableNode>;

    /**
     * edges
     *   The iterable collection of drawable edges that are part of the graph.
     */
    readonly edges: Iterable<DrawableEdge>;

    /**
     * selectedItems
     *   The iterable collection of selected drawable elements.
     */
    readonly selectedItems: Iterable<DrawableElement>;

    /**
     * selectedItemCount
     *   The number of selected items.
     */
    readonly selectedItemCount: number;

    /**
     * origin
     *   The displacement of the origin point of the graph editor canvas.
     */
    origin: point;

    /**
     * scale
     *   The zoom scale of the graph editor canvas.
     */
    scale: number;


    // Creation methods ////////////////////////////////////////////////////////


    /**
     * createNode
     *   Creates a drawable node.
     *
     *   If `like` is specified, a `DrawableNode` with a matching type of `like`
     *   is created.
     */
    createNode(like?: DrawableNode): DrawableNode | null {
        return this.createItem(
            this._creatingNodeEmitter,
            this._createdNodeEmitter,
            "nodes",
            this._nodes,
            new DrawableNode(this, like),
            like
        );
    }

    /**
     * createEdge
     *   Creates a drawable edge with a source and destination node.
     *
     *   If `like` is specified, a `DrawableEdge` with a matching type of `like`
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
        return this.createItem(
            this._creatingEdgeEmitter,
            this._createdEdgeEmitter,
            "edges",
            this._edges,
            new DrawableEdge(this, src, dst, like),
            like
        );
    }

    /**
     * createItem
     *   Creates a drawable element.
     */
    private createItem<D extends DrawableElement>(
        creatingEmitter: DrawableEventEmitter<D>,
        createdEmitter: DrawableEventEmitter<D>,
        key: keyof this,
        items: Set<D>,
        item: D,
        like?: D
    ) {
        let old = [...items];
        let args = new DrawableEventArgs<D>(this, [item], like);
        creatingEmitter.emit(args);
        if (args.isCancelled)
            return null;
        items.add(item);
        createdEmitter.emit(args);
        this.onPropertyChanged(key, old);
        return item;
    }


    // Deletion methods ////////////////////////////////////////////////////////


    /**
     * delete
     *   Deletes elements from the graph.
     */
    delete<D extends DrawableElement>(...items: D[]): boolean {
        let result = false;
        let edges = [...this._edges];
        let nodes = [...this._nodes];
        let deletedNodes: DrawableNode[] = [];
        let deletedEdges: DrawableEdge[] = [];
        let deleteEdge = (d: DrawableEdge) => {
            if (this._edges.delete(d)) {
                this._deleted.add(d);
                deletedEdges.push(d);
                // d.source.removeEdge(d);
                // d.destination.removeEdge(d);
            }
        };

        // Sorting should never be necessary.
        //
        // Delete edges first
        // selected.sort((a, b) => {
        //     let af = (a instanceof DrawableEdge) ? -1 : 1;
        //     let bf = (b instanceof DrawableEdge) ? -1 : 1;

        //     return af - bf;
        // });

        this.deselect(...items);
        items.forEach(v => {
            if (v instanceof DrawableEdge) {
                deleteEdge(v);
                this._unselected.delete(v);
            }
            else if (v instanceof DrawableNode) {
                let vedges = [...v.edges];
                vedges.forEach(e => deleteEdge(e));
                deletedNodes.push(v);
                this._deleted.add(v);
                this._nodes.delete(v);
                this._unselected.delete(v);
            }
        });

        if (result = nodes.length !== this._nodes.size) {
            this._deletedNodeEmitter.emit(
                new DrawableEventArgs<DrawableNode>(this, deletedNodes)
            );
            this.onPropertyChanged("nodes", nodes);
        }
        if (result = (result || edges.length !== this._edges.size)) {
            this._deletedEdgeEmitter.emit(
                new DrawableEventArgs<DrawableEdge>(this, deletedEdges)
            );
            this.onPropertyChanged("edges", edges);
        }

        return result;
    }

    /**
     * undelete
     *   Undoes the deletion of elements.
     */
    undelete<D extends DrawableElement>(...items: D[]) {
        const undeleteEdges: DrawableEdge[] = [];
        const undeleteNodes: DrawableNode[] = [];
        const oldNodes = [...this._nodes];
        const oldEdges = [...this._edges];
        let result = false;
        items.forEach(v => {
            if (this._deleted.delete(v)) {
                this._unselected.add(v);
                if (v instanceof DrawableNode) {
                    undeleteNodes.push(v);
                    this._nodes.add(v);
                }
                else if (v instanceof DrawableEdge) {
                    undeleteEdges.push(v);
                    this._edges.add(v);
                }
            }
        });
        if (result = undeleteNodes.length > 0) {
            this._createdNodeEmitter.emit(
                new DrawableEventArgs<DrawableNode>(this, undeleteNodes)
            );
            this.onPropertyChanged("nodes", oldNodes);
        }
        if (result = (result || undeleteEdges.length > 0)) {
            this._createdEdgeEmitter.emit(
                new DrawableEventArgs<DrawableEdge>(this, undeleteEdges)
            );
            this.onPropertyChanged("edges", oldEdges);
        }
        return result;
    }

    // insertElement(element: DrawableElement): DrawableElement | null {
    //     // TODO, cleanup
    //     if (element instanceof DrawableNode) {
    //         let old = [...this._nodes];
    //         let args = new DrawableEventArgs<DrawableNode>(this, element);
    //         this._nodes.add(element);
    //         this._createdNodeEmitter.emit(args);
    //         this.onPropertyChanged("nodes", old);
    //         return element;
    //     } else if (element instanceof DrawableEdge) {
    //         let old = [...this._edges];
    //         let args = new DrawableEventArgs<DrawableEdge>(this, element);
    //         this._edges.add(element);
    //         this._createdEdgeEmitter.emit(args);
    //         this.onPropertyChanged("edges", old);
    //         return element;
    //     }

    //     return null;
    // }


    /**
     * deleteNode
     *   Guarantees that the given node is not present in the graph.
     */
    // deleteNode(node: DrawableNode): boolean {
    //     return this.deleteItem(
    //         this._nodes,
    //         node,
    //         this._deletedNodeEmitter,
    //         "nodes"
    //     );
    // }


    /**
     * deleteEdge
     *   Guarantees that the given edge is not present in the graph.
     */
    // deleteEdge(edge: DrawableEdge): boolean {
    //     edge.source.removeEdge(edge);
    //     edge.destination.removeEdge(edge);
    //     return this.deleteItem(
    //         this._edges,
    //         edge,
    //         this._deletedEdgeEmitter,
    //         "edges"
    //     );
    // }

    /**
     * deleteItem
     *   Deletes a drawable element.
     */
    // private deleteItem<D extends DrawableElement>(
    //     items: Set<D>,
    //     item: D,
    //     deletedEmitter: DrawableEventEmitter<D>,
    //     key: keyof this
    // ): boolean {
    //     let old = [...items];
    //     if (items.delete(item)) {
    //         this._deleted.add(item);
    //         this.deselectItems(item);
    //         this._unselected.delete(item);
    //         deletedEmitter.emit(new DrawableEventArgs<D>(this, [item]));
    //         this.onPropertyChanged(key, old);
    //         return true;
    //     }
    //     return false;
    // }


    // Selection methods ///////////////////////////////////////////////////////


    /**
     * select
     *   Adds items to the selection.
     */
    select<D extends DrawableElement>(...items: D[]) {
        this.move(this._unselected, this._selected, ...items);
    }

    /**
     * deselect
     *   Removes items from the selection.
     */
    deselect<D extends DrawableElement>(...items: D[]) {
        this.move(this._selected, this._unselected, ...items);
    }

    /**
     * clearSelection
     *   Clears the selection.
     */
    clearSelection() {
        this.move(
            this._selected,
            this._unselected,
            ...this._selected
        );
    }

    /**
     * move
     *   Moves items from one set to the other.
     */
    private move<D extends DrawableElement>(
        src: Set<D>,
        dst: Set<D>,
        ...items: D[]
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


    // Listener register methods ///////////////////////////////////////////////


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

}

/**
 * DrawableEventArgs
 *   Event arguments for a drawable event.
 */
export class DrawableEventArgs<D extends DrawableElement> extends CancellableEventArgs {
    constructor(source: any, public readonly drawables: Iterable<D>, public readonly like?: D) {
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
