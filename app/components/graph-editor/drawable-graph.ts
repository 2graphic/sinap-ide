/**
 * @file `drawable-graph.ts`
 *   Created on January 9, 2017
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 */


import { GRID_SPACING, SCALE_MIN, SCALE_MAX } from "./defaults";
import { filterSet, move } from "./generic-functions";
import { point } from "./editor-canvas";
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


/**
 * `EdgeValidator`
 *
 *   Determines whether or not an edge is valid for a given source and
 *   destination node.
 *
 *   If `dst` is not specified, the validator should check if an edge can be
 *   created from the source node.
 *
 *   If `like` is specified, a drawable edge with a matching type of `like`
 *   should be checked against the given source and destination nodes.
 */
export type EdgeValidator = (
    src: DrawableNode,
    dst?: DrawableNode,
    like?: DrawableEdge
) => boolean;


// Classes /////////////////////////////////////////////////////////////////////


/**
 * `DrawableGraph`
 *
 *   Represents a collection of nodes and edges that are drawn on the
 *   `GraphEditorComponent`.
 *
 *   Emits `change`, `creating`, `created`, `moved`, `deleted`, and `select`
 *   events.
 *
 * @extends Drawable
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
                    const old = this.origin;
                    if (value.x !== old.x || value.y !== old.y) {
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
                    value = Math.min(SCALE_MAX, value);
                    value = Math.max(SCALE_MIN, value);
                    const old = this._scale;
                    if (value !== old) {
                        this._scale = value;
                        this.onPropertyChanged("scale", old);
                    }
                }
            }
        });
        Object.seal(this);
    }


    // Private fields //////////////////////////////////////////////////////////


    private _nodes: Set<DrawableNode>;
    private _edges: Set<DrawableEdge>;
    private _selected: Set<DrawableElement>;
    private _unselected: Set<DrawableElement>;
    private _origin: { x: number, y: number };
    private _scale: number;


    // Public fields ///////////////////////////////////////////////////////////


    /**
     * `nodes`
     *
     *   Gets the iterable `DrawableNode` collection that is part of the graph.
     */
    readonly nodes: Iterable<DrawableNode>;

    /**
     * `edges`
     *
     *   Gets the iterable `DrawableEdge` collection that is part of the graph.
     */
    readonly edges: Iterable<DrawableEdge>;

    /**
     * `selectedItems`
     *
     *   Gets the iterable `DrawableElement` collection that is selected.
     */
    readonly selectedItems: Iterable<DrawableElement>;

    /**
     * `selectedItemCount`
     *
     *   Gets the number of `selectedItems`.
     */
    readonly selectedItemCount: number;

    /**
     * `selectedNodes`
     *
     *   Gets the iterable `DrawableNode` collection that is selected.
     */
    readonly selectedNodes: Iterable<DrawableNode>;

    /**
     * `selectedEdges`
     *
     *   Gets the iterable `DrawableEdge` collection that is selected.
     */
    readonly selectedEdges: Iterable<DrawableEdge>;

    /**
     * `unselectedItems`
     *
     *   Gets the iterable `DrawableElement` collection that is unselected.
     */
    readonly unselectedItems: Iterable<DrawableElement>;

    /**
     * `origin`
     *
     *   Gets or sets he displacement of the origin point of the
     *   `GraphEditorComponent`
     *
     * @emits DrawableGraph#change
     */
    origin: point;

    /**
     * `scale`
     *
     *   Gets or sets the zoom scale of the `GraphEditorComponent`.
     *
     * @emits DrawableGraph#change
     */
    scale: number;


    // Creation methods ////////////////////////////////////////////////////////


    /**
     * `createNode`
     *
     *   Creates a `DrawableNode` and adds it to the graph.
     *
     *   If `like` is specified, a `DrawableNode` with matching properties is
     *   created.
     *
     * @param like
     *   The node to be copied.
     *
     * @returns
     *   The created node if successfull; otherwise, null. Creating a node can
     *   be cancelled if any of the event listeners call `preventDefault` during
     *   the `creating` event phase.
     *
     * @emits DrawableGraph#creating
     * @emits DrawableGraph#created
     */
    createNode(like?: DrawableNode): DrawableNode | null {
        return this.createItem(this._nodes, new DrawableNode(this, like), like);
    }

    /**
     * `createEdge`
     *
     *   Creates a `DrawableEdge` with a source and destination node.
     *
     *   If `like` is specified, a `DrawableEdge` with matching properties is
     *   created.
     *
     *   The `isValidEdge` method must be called to check if creating the edge
     *   is valid.
     *
     * @param src
     *   The source node. It is assumed that the node has been created by this
     *   graph.
     *
     * @param dst
     *   The destination node. It is assumed that the node has been created by
     *   this graph.
     *
     * @param like
     *   The edge to be copied.
     *
     * @returns
     *   The created edge if successfull; otherwise, null. Creating an edge can
     *   be cancelled if any of the event listeners call `preventDefault` during
     *   the `creating` event phase.
     *
     * @emits DrawableGraph#creating
     * @emits DrawableGraph#created
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
     * `cloneElements`
     * 
     * @param items
     */
    cloneElements(...items: DrawableElement[]) {
        const creating = new Map<DrawableElement, DrawableElement>();
        const details: [DrawableElement, DrawableElement][]
            = [];

        // TODO:
        // Make sure that this still works if items in the clipboard have been
        // previously deleted.

        for (const n of items.filter(
            v => v instanceof DrawableNode
        ) as DrawableNode[]) {
            const nn = new DrawableNode(this, n);
            creating.set(n, nn);
            details.push([nn, n]);
            nn.position = {
                x: n.position.x + GRID_SPACING,
                y: n.position.y + GRID_SPACING
            };
        }

        for (const e of items.filter(
            v => v instanceof DrawableEdge
        ) as DrawableEdge[]) {
            let src = creating.get(e.source) as DrawableNode;
            let dst = creating.get(e.destination) as DrawableNode;
            if (!src)
                src = e.source;
            if (!dst)
                dst = e.destination;
            const ee = new DrawableEdge(this, src, dst, e);
            creating.set(e, ee);
            details.push([ee, e]);
        }

        if (!this.dispatchEvent(
            new TypedCustomEvent(
                "creating",
                new DrawableEventDetail(this, details)
            )
        ))
            return null;
        details.map(v => this._unselected.add(v[0]));
        this.dispatchEvent(
            new TypedCustomEvent(
                "created",
                new DrawableEventDetail(this, details)
            )
        );
        return details.map(v => v[0]);
    }

    /**
     * `moveEdge`
     *
     *   Moves a `DrawableEdge` to a new pair of source and destination nodes.
     *
     *   The original edge is deleted, and a new edge is created in its place.
     *
     *   The `isValidEdge` method must be called to check if moving the edge is
     *   valid.
     *
     * @param src
     *   The source node. It is assumed that the node has been created by this
     *   graph.
     *
     * @param dst
     *   The destination node. It is assumed that the node has been created by
     *   this graph.
     *
     * @param like
     *   The edge to be moved.
     *
     * @returns
     *   The moved edge.
     *
     * @emits DrawableGraph#moved
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
     * `recreateItems`
     *
     *   Recreates previously deleted items from the graph.
     *
     *   The console will be bombarded with assertion messages for each item
     *   that was not created with this graph.
     *
     * @param items
     *   The list of items to be recreated.
     *
     * @emits DrawableGraph#created
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
                    new DrawableEventDetail(this, items.map(
                        v => [v, undefined] as [DrawableElement, undefined]
                    ))
                )
            );
        }
    }

    /**
     * `createItem`
     *
     *   Creates a `DrawableElement`.
     *
     * @private
     */
    private createItem<D extends DrawableElement>(
        items: Set<D>,
        item: D,
        like?: D
    ) {
        if (!this.dispatchEvent(
            new TypedCustomEvent(
                "creating",
                new DrawableEventDetail(this, [[item, like]])
            )
        ))
            return null;
        items.add(item);
        this._unselected.add(item);
        this.dispatchEvent(
            new TypedCustomEvent(
                "created",
                new DrawableEventDetail(this, [[item, like]])
            )
        );
        return item;
    }


    // Deletion methods ////////////////////////////////////////////////////////


    /**
     * `delete`
     *
     *   Deletes one or more elements from the graph.
     *
     * @param items
     *   The list of items to be deleted.
     *
     * @returns
     *   True if anything was deleted; otherwise, false.
     *
     * @emits DrawableGraph#deleted
     */
    delete(...items: DrawableElement[]): boolean {
        const deletedEdges: DrawableEdge[] = [];
        const deletedNodes: DrawableNode[] = [];
        const toDeselect: DrawableElement[] = [];
        const deleteEdge = (d: DrawableEdge) => {
            if (this._edges.delete(d)) {
                d.source.removeEdge(d);
                d.destination.removeEdge(d);
                deletedEdges.push(d);
                toDeselect.push(d);
            }
        };

        items.forEach(d => {
            if (d instanceof DrawableEdge)
                deleteEdge(d);
            else if (d instanceof DrawableNode) {
                const edges = [...d.edges];
                edges.forEach(e => deleteEdge(e));
                this._nodes.delete(d);
                deletedNodes.push(d);
                toDeselect.push(d);
            }
        });

        const deleted = [...deletedNodes, ...deletedEdges];
        if (deleted.length > 0) {
            this.deselect(...toDeselect);
            toDeselect.forEach(v => this._unselected.delete(v));
            this.dispatchEvent(
                new TypedCustomEvent(
                    "deleted",
                    new DrawableEventDetail(this, deleted.map(
                        v => [v, undefined] as [DrawableElement, undefined]
                    ))
                )
            );
            return true;
        }
        return false;
    }

    /**
     * `deleteSelected`
     *
     *   Wrapper around `delete(...this.selectedItems)`.
     */
    deleteSelected() {
        return this.delete(...this._selected);
    }


    // Selection methods ///////////////////////////////////////////////////////


    /**
     * `setSelected`
     *
     *   Sets the collection of `selectedItems`.
     *
     * @param items
     *   The list of items to be set as the selection.
     *
     * @emits DrawableGraph#select
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
     * `select`
     *
     *   Adds items to the selection.
     *
     * @param items
     *   The list of items to be added to the selection.
     *
     * @emits DrawableGraph#select
     */
    select<D extends DrawableElement>(...items: D[]) {
        this.move(this._unselected, this._selected, ...items);
    }

    /**
     * `deselect`
     *
     *   Removes items from the selection.
     *
     * @param items
     *   The list of items to be removed from the selection.
     *
     * @emits DrawableGraph#select
     */
    deselect<D extends DrawableElement>(...items: D[]) {
        this.move(this._selected, this._unselected, ...items);
    }

    /**
     * `clearSelection`
     *
     *   Clears the selection.
     *
     * @emits DrawableGraph#select
     */
    clearSelection() {
        this.move(this._selected, this._unselected, ...this._selected);
    }

    /**
     * `selectAll`
     *
     *   Selects all graph elements.
     *
     * @emits DrawableGraph#select
     */
    selectAll() {
        this.move(this._unselected, this._selected, ...this._unselected);
    }

    /**
     * `move`
     *
     *   Moves items from one set to the other.
     *
     * @private
     */
    private move<D extends DrawableElement>(
        src: Set<D>,
        dst: Set<D>,
        ...items: D[]
    ) {
        const oldSelection = [...this._selected];
        move(src, dst, items, v => v.isSelected = (dst === this._selected));
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
