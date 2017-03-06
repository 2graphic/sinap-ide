// File: graph-controller.ts
// Created by: Sheyne Anderson
// Date created: January 22, 2017
//
//

import { EventEmitter } from "@angular/core";
import {
    DrawableElement,
    Drawable,
    DrawableGraph,
    DrawableEdge,
    DrawableNode,
    EdgeValidator,
    CreatedOrDeletedEventArgs,
    PropertyChangedEventArgs,
    CreatedOrDeletedEvent as DrawableCreatedOrDeletedEvent
} from "../components/graph-editor/graph-editor.component";

import { CoreModel, CoreElement, CoreElementKind, Plugin, validateEdge, ObjectType, WrappedScriptObjectType } from "sinap-core";
import { DoubleMap } from "./double-map";

/**
 * Contains a reference to a `CoreElement` and a `Drawable`.
 *
 * Calls to get/set will update both. It also contains a
 * `proxy` field. Reads and writes to this will intelligently update
 * the core element and the drawable. For any of these uses, if
 * the backer object (core/drawable) references another core or drawable
 * this will return a `BridgingProxy` in its place. Sets will intelligently
 * sync the backends even if the set `v` is a `BridgingProxy`
 */
export class BridgingProxy {
    proxy: { [a: string]: any };

    constructor(public core: CoreElement, public drawable: Drawable, public graph: GraphController) {
        this.proxy = new Proxy(core.data, {
            set: (data, k, v) => this.set(k, v),
            get: (data, k) => this.get(k),
        });
    }

    set(k: PropertyKey, v: any, updateDrawable = true) {
        let drawableValue = v;
        let coreValue = v;

        // If v is a drawable element or a core element,
        // then when it gets set in the various proxied data
        // structures, set it differently.

        if (v instanceof BridgingProxy) {
            drawableValue = v.drawable;
            coreValue = v.core;
        } else if (v instanceof CoreElement) {
            drawableValue = drawableFromAny(v, this.graph.bridges);
        } else if (v instanceof Drawable) {
            coreValue = coreFromAny(v, this.graph.bridges);
        }

        if (updateDrawable && Object.keys(this.drawable).indexOf(k.toString()) !== -1) {
            (this.drawable as any)[k] = drawableValue;
        }

        const oldValue = this.core.data[k];
        this.core.data[k] = coreValue;

        this.graph.changed.emit(new UndoableChange(this, k, oldValue, coreValue));

        return true;
    }

    get(k: PropertyKey) {
        const coreValue = this.core.data[k];
        // if this is something that should be proxied
        const proxiedValue = this.graph.bridges.getB(coreValue);
        // return the proxy. That is, any changes made to the returned
        // object should propagate to both backers
        return proxiedValue !== undefined ? proxiedValue : coreValue;
    }
}

function drawableFromAny(a: any, bridges: DoubleMap<Drawable, CoreElement, BridgingProxy>) {
    if (a instanceof CoreElement) {
        const bridge = bridges.getB(a);
        if (bridge === undefined) {
            throw "trying to reference a core element that doesn't have an analogous drawable";
        }
        a = bridge.drawable;
    }
    return a;
}

function coreFromAny(a: any, bridges: DoubleMap<Drawable, CoreElement, BridgingProxy>) {
    if (a instanceof Drawable) {
        const bridge = bridges.getA(a);
        if (bridge === undefined) {
            throw "trying to reference a drawable element that doesn't have an analogous core";
        }
        a = bridge.core;
    }
    return a;
}

export type UndoableEvent = UndoableChange | UndoableAddOrDelete;
export type CreatedOrDeletedEvent = ["created" | "deleted", BridgingProxy];
export class UndoableAddOrDelete {
    constructor(public events: CreatedOrDeletedEvent[]) { }
}

// TODO: changes can also be adds or deletes
export class UndoableChange {
    constructor(public target: BridgingProxy,
        public key: PropertyKey,
        public oldValue: any,
        public newValue: any) { }
}

export class GraphController {
    drawable: DrawableGraph;
    activeNodeType: string;
    activeEdgeType: string;
    public changed = new EventEmitter<UndoableEvent>();

    private selectedElements: Set<BridgingProxy>;

    public bridges = new DoubleMap<Drawable, CoreElement, BridgingProxy>();

    validateEdgeHandler = (src: DrawableNode, dst?: DrawableNode, like?: DrawableEdge) => {
        const source = this.bridges.getA(src);
        const destination = dst ? this.bridges.getA(dst) : dst;

        if (source === undefined || (dst !== undefined && destination === undefined)) {
            throw "backer out of sync";
        }

        const sourceType = this.plugin.typeEnvironment.getElementType(source.core.kind, source.core.type.name);
        const destinationType = destination !== undefined ? (this.plugin.typeEnvironment.getElementType(destination.core.kind, destination.core.type.name)) : undefined;

        let edge: WrappedScriptObjectType;
        if (like !== undefined) {
            const e = this.bridges.getA(like);
            if (e === undefined) {
                throw "backer out of sync";
            }
            edge = this.plugin.typeEnvironment.getElementType(e.core.kind, e.core.type.name);
        } else {
            edge = this.plugin.typeEnvironment.getElementType(CoreElementKind.Edge, this.activeEdgeType);
        }

        return validateEdge(edge, sourceType, destinationType);
    }

    constructor(public core: CoreModel, public plugin: Plugin) {
        this.activeEdgeType = this.plugin.elementTypes(CoreElementKind.Edge).next().value;
        this.activeNodeType = this.plugin.elementTypes(CoreElementKind.Node).next().value;

        this.drawable = new DrawableGraph(this.validateEdgeHandler);
        let coreGraph: CoreElement | null = null;
        const coreEdges: CoreElement[] = [];

        // each core element we iterate over needs to have a drawable equivalent made for it
        for (const element of this.core.elements) {
            // placeholder for the new drawable (if we make one)
            let drawable: Drawable | null = null;
            switch (element.kind) {
                case CoreElementKind.Edge:
                    // do edges last, they reference nodes
                    coreEdges.push(element);
                    break;
                case CoreElementKind.Node:
                    drawable = this.drawable.createNode();
                    if (drawable === null) {
                        throw "node creation canceled while loading from core";
                    }
                    this.copyProperties(element, drawable);
                    break;
                case CoreElementKind.Graph:
                    drawable = this.drawable;
                    // we want to keep track of the graph element
                    if (coreGraph !== null) {
                        throw "More than one graph found";
                    }
                    coreGraph = element;
                    this.copyProperties(element, drawable);
                    break;
            }
            if (drawable !== null) {
                this.addDrawable(drawable, element);
            }
        }
        // if we weren't given a graph object, make one
        if (coreGraph === null) {
            this.addDrawable(this.drawable, undefined);
        }

        // now make the drawable edges
        for (const edge of coreEdges) {
            // nulls will get copied in by copyCoreToDrawable
            const source = this.bridges.getB(edge.data['source']) !.drawable as DrawableNode;
            const destination = this.bridges.getB(edge.data['destination']) !.drawable as DrawableNode;

            const drawableEdge = this.drawable.createEdge(source, destination);
            if (drawableEdge === null) {
                throw "edge creation canceled while loading from core";
            }

            this.copyProperties(edge, drawableEdge);
            this.addDrawable(drawableEdge, edge);
        }

        // finally set up all the listeners after we copy all the elements
        this.drawable.addCreatedOrDeletedElementListener((n: CreatedOrDeletedEventArgs) => this.addOrDeleteDrawables(n.events));
        this.drawable.addPropertyChangedListener((a: PropertyChangedEventArgs<any>) => this.onPropertyChanged(a));
        this.drawable.addSelectionChangedListener((a: PropertyChangedEventArgs<Iterable<DrawableElement>>) => {
            this.setSelectedElements(a.curr);
        });
        // side effect of selecting the graph
        this.setSelectedElements(undefined);
    }

    private addOrDeleteDrawables(events: DrawableCreatedOrDeletedEvent[]) {
        const mapped = events.map(([a, e]): CreatedOrDeletedEvent => {
            return [a, (a === "created" ? this.addDrawable(e) : this.removeDrawable(e))];
        });

        this.changed.emit(new UndoableAddOrDelete(mapped));
    }
    private addDrawable(drawable: Drawable, core?: CoreElement) {
        // if a core element to pair with this
        // drawable doesn't exist, make one
        if (!core) {
            core = this.makeCoreFromDrawable(drawable);
        }
        const bridge = new BridgingProxy(core, drawable, this);
        this.bridges.set(drawable, core, bridge);

        return bridge;
    }

    private makeCoreFromDrawable(drawable: Drawable) {
        const kind = drawable instanceof DrawableEdge ?
            CoreElementKind.Edge : (drawable instanceof DrawableNode ?
                CoreElementKind.Node : CoreElementKind.Graph);

        let type = undefined;
        if (kind === CoreElementKind.Node) {
            type = this.activeNodeType;
        } else if (kind === CoreElementKind.Edge) {
            type = this.activeEdgeType;
        }

        const core = this.core.addElement(kind, type);
        this.copyProperties(drawable, core);

        return core;
    }

    private removeDrawable(drawable: Drawable) {
        const bridge = this.toBridges(drawable);
        this.core.removeElement(bridge.core);
        this.bridges.delete(bridge.drawable, bridge.core);

        return bridge;
    }

    public applyUndoableEvent(event: UndoableEvent) {
        if (event instanceof UndoableAddOrDelete) {
            const toUndo = event.events
                .map((e) => [e[0], e[1].drawable] as DrawableCreatedOrDeletedEvent);

            const undoResults = this.drawable.undo(toUndo);

            const mapped = undoResults.map(([createdOrDeleted, drawable]): CreatedOrDeletedEvent =>
                [createdOrDeleted, (() => {
                    if (createdOrDeleted === "created") {
                        const found = event.events.find(([_, bridge]) => bridge.drawable === drawable);

                        if (found) {
                            // Reinsert the core element and bridge
                            const [_, bridge] = found;

                            this.core.elements.push(bridge.core);
                            this.bridges.set(bridge.drawable, bridge.core, bridge);
                            return bridge;
                        } else {
                            return this.addDrawable(drawable);
                        }
                    } else {
                        return this.removeDrawable(drawable);
                    }
                })()]);
            this.changed.emit(new UndoableAddOrDelete(mapped));
        } else if (event instanceof UndoableChange) {
            event.target.set(event.key, event.oldValue, true);
        } else {
            throw "Unrecognized event";
        }
    }

    private onPropertyChanged(a: PropertyChangedEventArgs<any>) {
        const bridge = this.bridges.getA(a.source);
        if (bridge !== undefined) {
            // TODO: maybe do an interface check to see if this matches
            // do we want the list of nodes/edges to show up in the properties panel?
            // probably not
            // maybe this filtering should occur downstream?
            if (Object.keys(bridge.drawable).indexOf(a.key) !== -1) {
                bridge.set(a.key, a.curr, false);
            }
        } else {
            throw "Nodes/edges list out of sync";
        }
    }

    copyProperties<S extends CoreElement | Drawable, D extends CoreElement | Drawable>(src: S, dst: D) {
        if (src instanceof CoreElement && dst instanceof Drawable) {
            for (const key in dst) {
                let keyD = key;
                // TODO: deal with this better
                if (key === "source") { continue; }
                if (key === "destination") { continue; }
                (dst as any)[key] = drawableFromAny(src.data[keyD], this.bridges);
            }
        }
        else if (src instanceof Drawable && dst instanceof CoreElement) {
            for (const key in src) {
                let keyD = key;
                // TODO: deal with this better
                // if (key === "sourceNode") { keyD = "source" }
                // if (key === "destinationNode") { keyD = "destination" }
                dst.data[keyD] = coreFromAny((src as any)[key], this.bridges);
            }
        }
    }

    setSelectedElements(se: Iterable<Drawable | BridgingProxy | CoreElement> | undefined) {
        if (se === undefined) {
            se = [];
        }

        const values = [...se];
        if (values.length === 0) {
            const br = this.bridges.getA(this.drawable);
            if (br === undefined) {
                throw "no graph element";
            }
            this.selectedElements = new Set([br]);
        } else {
            this.selectedElements = new Set(values.map((e) => this.toBridges(e)));
        }
    }

    toBridges(e: Drawable | BridgingProxy | CoreElement): BridgingProxy {
        let val: BridgingProxy | undefined;
        if (e instanceof Drawable) {
            val = this.bridges.getA(e);
        } else if (e instanceof CoreElement) {
            val = this.bridges.getB(e);
        } else if (e instanceof BridgingProxy) {
            val = e;
        }
        if (val === undefined) {
            throw "element not found";
        }
        return val;
    }
}