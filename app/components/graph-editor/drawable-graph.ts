// File: drawable-graph.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016


import { filterSet, move } from "./generic-functions";
import { point } from "./graph-editor-canvas";
import { Drawable } from "./drawable";
import { DrawableElement } from "./drawable-element";
import { DrawableEdge } from "./drawable-edge";
import { DrawableNode } from "./drawable-node";
import {
    TypedCustomEvent,
    DrawableEventDetail,
    MoveEdgeEventDetail,
    PropertyChangedEventDetail
} from "./events";


// Typedefs ////////////////////////////////////////////////////////////////////


export type SelectionChangedEvent
    = TypedCustomEvent<PropertyChangedEventDetail<Iterable<DrawableElement>>>;

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


// Classes /////////////////////////////////////////////////////////////////////


/**
 * DrawableGraph
 *
 *   Exposes drawable graph properties and methods.
 *
 * <p>
 *   Raises `change`, `creating`, `created`, `moved`, `deleted`, and `select`
 *   events.
 * </p>
 */
export class DrawableGraph extends Drawable {
    constructor(public readonly isValidEdge: EdgeValidator) {
        super();
        Object.defineProperties(this, {
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
            selectedNodes: {
                enumerable: false,
                get: () => filterSet(this._selected, DrawableNode)
            },
            selectedEdges: {
                enumerable: false,
                get: () => filterSet(this._selected, DrawableEdge)
            },
            unselectedItems: {
                enumerable: false,
                get: () => this._unselected
            },
            origin: {
                enumerable: true,
                get: () => this._origin,
                set: (value: point) => {
                    let old = this.origin;
                    if (old.x !== value.x || old.y !== value.y) {
                        this._origin.x = value.x;
                        this._origin.y = value.y;
                        this.onPropertyChanged("origin", old);
                    }
                }
            },
            scale: {
                enumerable: true,
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
     * _nodes
     *
     *   The set of nodes.
     */
    private _nodes: Set<DrawableNode>;

    /**
     * _edges
     *
     *   The set of edges.
     */
    private _edges: Set<DrawableEdge>;

    /**
     * _selected
     *
     *   The set of selected elements.
     */
    private _selected: Set<DrawableElement>;

    /**
     * _unselected
     *
     *   The set of unselected elements.
     */
    private _unselected: Set<DrawableElement>;

    /**
     * _origin
     *
     *   The origin point of the graph.
     */
    private _origin: { x: number, y: number };

    /**
     * _scale
     *
     *   The zoom scale of the graph.
     */
    private _scale: number;


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * nodes
     *
     *   Gets the iterable collection of drawable nodes that are part of the
     *   graph.
     */
    readonly nodes: Iterable<DrawableNode>;

    /**
     * edges
     *
     *   Gets the iterable collection of drawable edges that are part of the
     *   graph.
     */
    readonly edges: Iterable<DrawableEdge>;

    /**
     * selectedItems
     *
     *   Gets a collection of selected drawable elements.
     */
    readonly selectedItems: Iterable<DrawableElement>;

    /**
     * selectedItemCount
     *
     *   Gets the number of selected items.
     */
    readonly selectedItemCount: number;

    /**
     * selectedNodes
     *
     *   Gets a collection of selected drawable nodes.
     */
    readonly selectedNodes: Iterable<DrawableNode>;

    /**
     * selectedEdges
     *
     *   Gets a collection of selected drawable edges.
     */
    readonly selectedEdges: Iterable<DrawableEdge>;

    /**
     * unselectedItems
     *
     *   Gets the iterable collection of unselected drawable elements.
     */
    readonly unselectedItems: Iterable<DrawableElement>;

    /**
     * origin
     *
     *   Gets or sets he displacement of the origin point of the graph editor
     *   canvas.
     *
     * <p>
     *   Raises the `change` event.
     * </p>
     */
    origin: point;

    /**
     * scale
     *
     *   Gets or sets the zoom scale of the graph editor canvas.
     *
     * <p>
     *   Raises the `change` event.
     * </p>
     */
    scale: number;


    // Creation methods ////////////////////////////////////////////////////////


    /**
     * createNode
     *
     *   Creates a drawable node.
     *
     * <p>
     *   If `like` is specified, a `DrawableNode` with a matching type of `like`
     *   is created.
     * </p>
     *
     * <p>
     *   Raises the `creating` and `created` events.
     * </p>
     */
    createNode(like?: DrawableNode): DrawableNode | null {
        return this.createItem(this._nodes, new DrawableNode(this, like), like);
    }

    /**
     * createEdge
     *
     *   Creates a drawable edge with a source and destination node.
     *
     * <p>
     *   If `like` is specified, a `DrawableEdge` with a matching type of `like`
     *   is created.
     * </p>
     *
     * <p>
     *   The `isValidEdge` method must be called to check if creating the edge
     *   is valid.
     * </p>
     *
     * <p>
     *   Raises the `creating` and `created` events.
     * </p>
     */
    createEdge(
        src: DrawableNode,
        dst: DrawableNode,
        like?: DrawableEdge
    ): DrawableEdge | null {
        return this.createItem(
            this._edges,
            new DrawableEdge(this, src, dst, like),
            like
        );
    }


    /**
     * moveEdge
     *
     *   Moves a drawable edge to a new pair of source and destination nodes.
     *
     * <p>
     *   The `isValidEdge` method must be called to check if moving the edge is
     *   valid.
     * </p>
     *
     * <p>
     *   Raises the `moved` event.
     * </p>
     */
    moveEdge(
        src: DrawableNode,
        dst: DrawableNode,
        edge: DrawableEdge
    ): DrawableEdge {
        this.deselect(edge);
        this._edges.delete(edge);
        this._unselected.delete(edge);
        edge.source.removeEdge(edge);
        edge.destination.removeEdge(edge);
        const replacement = new DrawableEdge(this, src, dst, edge);
        this._edges.add(replacement);
        this._unselected.add(replacement);
        this.dispatchEvent(
            new TypedCustomEvent(
                "moved",
                new MoveEdgeEventDetail(this, edge, replacement)
            )
        );
        return replacement;
    }

    /**
     * recreateItems
     *
     *   Recreates previously deleted items from the graph.
     *
     * <p>
     *   Raises the `created` event.
     * </p>
     */
    recreateItems(...items: DrawableElement[]) {
        items.forEach(d => {
            console.assert(d.graph === this, "graph mismatch recreating item");
            if (d instanceof DrawableEdge) {
                this._edges.add(d);
                d.source.addEdge(d);
                d.destination.addEdge(d);
            }
            else if (d instanceof DrawableNode)
                this._nodes.add(d);
            this._unselected.add(d);
        });
        if (items.length > 0) {
            this.dispatchEvent(
                new TypedCustomEvent(
                    "created",
                    new DrawableEventDetail(this, items)
                )
            );
        }
    }

    /**
     * createItem
     *
     *   Creates a drawable element.
     */
    private createItem<D extends DrawableElement>(
        items: Set<D>,
        item: D,
        like?: D
    ) {
        if (!this.dispatchEvent(
            new TypedCustomEvent(
                "creating",
                new DrawableEventDetail(this, [item], like)
            )
        ))
            return null;
        items.add(item);
        this._unselected.add(item);
        this.dispatchEvent(
            new TypedCustomEvent(
                "created",
                new DrawableEventDetail(this, [item], like)
            )
        );
        return item;
    }


    // Deletion methods ////////////////////////////////////////////////////////


    /**
     * delete
     *
     *   Deletes one or more elements from the graph.
     *
     * <p>
     *   Raises the `deleted` event.
     * </p>
     */
    delete(...items: DrawableElement[]): boolean {
        const deletedNodes: DrawableNode[] = [];
        const deletedEdges: DrawableEdge[] = [];
        const deleteEdge = (d: DrawableEdge) => {
            if (this._edges.delete(d)) {
                d.source.removeEdge(d);
                d.destination.removeEdge(d);
                deletedEdges.push(d);
            }
        };

        this.deselect(...items);
        items.forEach(d => {
            if (d instanceof DrawableEdge) {
                deleteEdge(d);
                this._unselected.delete(d);
            }
            else if (d instanceof DrawableNode) {
                const edges = [...d.edges];
                edges.forEach(e => deleteEdge(e));
                this._nodes.delete(d);
                this._unselected.delete(d);
                deletedNodes.push(d);
            }
        });

        const deleted = [...deletedNodes, ...deletedEdges];
        if (deleted.length > 0) {
            this.dispatchEvent(
                new TypedCustomEvent(
                    "deleted",
                    new DrawableEventDetail(this, deleted)
                )
            );
            return true;
        }
        return false;
    }


    // Selection methods ///////////////////////////////////////////////////////


    /**
     * setSelected
     *
     *   Sets the collection of selected items.
     */
    setSelected<D extends DrawableElement>(...items: D[]) {
        move(
            this._selected,
            this._unselected,
            [...this._selected],
            v => v.isSelected = false
        );
        this.move(this._unselected, this._selected, ...items);
    }

    /**
     * select
     *
     *   Adds items to the selection.
     *
     * <p>
     *   Raises the `select` event.
     * </p>
     */
    select<D extends DrawableElement>(...items: D[]) {
        this.move(this._unselected, this._selected, ...items);
    }

    /**
     * deselect
     *
     *   Removes items from the selection.
     *
     * <p>
     *   Raises the `select` event.
     * </p>
     */
    deselect<D extends DrawableElement>(...items: D[]) {
        this.move(this._selected, this._unselected, ...items);
    }

    /**
     * clearSelection
     *
     *   Clears the selection.
     *
     * <p>
     *   Raises the `select` event.
     * </p>
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
        move(src, dst, items, v => v.isSelected = (dst === this._selected));
        if (oldSelection.length !== this._selected.size) {
            this.dispatchEvent(
                new TypedCustomEvent(
                    "select",
                    new PropertyChangedEventDetail<Iterable<DrawableElement>>(
                        this,
                        "selectedItems",
                        oldSelection,
                        [...this._selected]
                    )
                )
            );
        }
    }

}
