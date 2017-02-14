// File: main-graph.ts
// Created by: Sheyne Anderson
// Date created: January 22, 2017
//
//

import {
    DrawableElement,
    Drawable,
    DrawableGraph,
    DrawableEdge,
    DrawableNode,
    EdgeValidator,
    DrawableEdgeEventArgs,
    DrawableNodeEventArgs,
    PropertyChangedEventArgs
} from "../components/graph-editor/graph-editor.component";

import { CoreElement, CoreElementKind, Plugin, validateEdge, ObjectType } from "sinap-core";
import { DoubleMap } from "./double-map";

/**
 * Contains a reference to a `CoreElement` and a `Drawable`.
 * 
 * Calls to get/set will update both. It also conatins a 
 * `proxy` field. Reads and writes to this will intelligently update 
 * the core element and the drawable. For any of these uses, if 
 * the backer object (core/drawable) references another core or drawable
 * this will return a `BridgingProxy` in its place. Sets will intellegently
 * sync the backends even if the set `v` is a `BridgingProxy`
 */
class BridgingProxy {
    proxy: { [a: string]: any };

    constructor(public core: CoreElement, public drawable: Drawable, private bridges: DoubleMap<Drawable, CoreElement, BridgingProxy>) {
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
            drawableValue = drawableFromAny(v, this.bridges);
        } else if (v instanceof Drawable) {
            coreValue = coreFromAny(v, this.bridges);
        }

        if (updateDrawable) {
            (this.drawable as any)[k] = drawableValue;
        }
        this.core.data[k] = coreValue;
        return true;
    }

    get(k: PropertyKey) {
        const coreValue = this.core.data[k];
        // if this is something that should be proxied
        const proxiedValue = this.bridges.getB(coreValue);
        // return the proxy. That is, any changes made to the returned 
        // object should propogate to both backers
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

export class MainGraph {
    drawable: DrawableGraph;
    activeNodeType: string;
    activeEdgeType: string;
    public bridges = new DoubleMap<Drawable, CoreElement, BridgingProxy>();

    constructor(coresIter: Iterable<CoreElement>, private plugin: Plugin) {
        this.activeEdgeType = this.plugin.elementTypes(CoreElementKind.Edge).next().value;
        this.activeNodeType = this.plugin.elementTypes(CoreElementKind.Node).next().value;

        this.drawable = new DrawableGraph((src: DrawableNode,
            dst?: DrawableNode,
            like?: DrawableEdge) => {
            const source = this.bridges.getA(src);
            const destination = dst !== undefined ? this.bridges.getA(dst) : null;

            let edge: ObjectType;
            if (like !== undefined) {
                const e = this.bridges.getA(like);
                if (e === undefined) {
                    throw "backer out of sync";
                }
                edge = e.core.type;
            } else {
                edge = this.plugin.typeEnvironment.getElementType(CoreElementKind.Edge, this.activeEdgeType);
            }

            if (source === undefined || destination === undefined) {
                throw "backer out of sync"
            }

            return validateEdge(edge, source.core.type, destination !== null ? destination.core.type : undefined);
        });
        let coreGraph: CoreElement | null = null;
        const coreEdges: CoreElement[] = [];

        // each core element we iterate over needs to have a drawable equivilant made for it
        for (const element of coresIter) {
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
                    this.copyCoreToDrawable(element, drawable);
                    break;
                case CoreElementKind.Graph:
                    drawable = this.drawable;
                    // we want to keep track of the graph element
                    if (coreGraph !== null) {
                        throw "More than one graph found";
                    }
                    coreGraph = element;
                    this.copyCoreToDrawable(element, drawable);
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
            const drawableEdge = this.drawable.createEdge(null as any, null as any);
            if (drawableEdge === null) {
                throw "edge creation canceled while loading from core";
            }

            this.copyCoreToDrawable(edge, drawableEdge);
            this.addDrawable(drawableEdge, edge);
        }

        // finally set up all the listeners after we copy all the elements
        this.drawable.addCreatingNodeListener((n: DrawableNodeEventArgs) => this.onCreatingNode(n));
        this.drawable.addCreatedNodeListener((n: DrawableNodeEventArgs) => this.onCreatedNode(n));
        this.drawable.addCreatingEdgeListener((e: DrawableEdgeEventArgs) => this.onCreatingEdge(e));
        this.drawable.addCreatedEdgeListener((e: DrawableEdgeEventArgs) => this.onCreatedEdge(e));
        this.drawable.addPropertyChangedListener((a: PropertyChangedEventArgs<any>) => this.onPropertyChanged(a));
    }

    addDrawable(drawable: Drawable, core?: CoreElement) {
        // if a core element to pair with this 
        // drawable doesn't exist, make one
        if (!core) {
            // this could probably be wrapped up in a function if 
            // it was useful elsewhere
            const kind = drawable instanceof DrawableEdge ?
                CoreElementKind.Edge : (drawable instanceof DrawableNode ?
                    CoreElementKind.Node : CoreElementKind.Graph);

            let type = undefined;
            if (kind === CoreElementKind.Node) {
                type = this.activeNodeType;
            } else if (kind === CoreElementKind.Edge) {
                type = this.activeEdgeType;
            }

            core = this.plugin.makeElement(kind, type);
            this.copyDrawableToCore(drawable, core);
        }
        this.bridges.set(drawable, core, new BridgingProxy(core, drawable, this.bridges));
    }

    onCreatedNode(n: DrawableNodeEventArgs) {
        this.addDrawable(n.drawable, undefined);
    }
    onCreatedEdge(e: DrawableEdgeEventArgs) {
        this.addDrawable(e.drawable, undefined);
    }
    onPropertyChanged(a: PropertyChangedEventArgs<any>) {
        const bridge = this.bridges.getA(a.source)
        // TODO: this check can be removed, it checks an invariant
        if (bridge !== undefined) {
            bridge.set(a.key, a.curr, false);
        } else {
            throw "Nodes/edges list out of sync";
        }
    }

    onCreatingNode(n: DrawableNodeEventArgs) {

    }
    onCreatingEdge(e: DrawableEdgeEventArgs) {

    }

    copyCoreToDrawable(core: CoreElement, drawable: Drawable) {
        // TODO: use Object.getOwnPropertyNames(drawable)
        let keys;
        if (drawable instanceof DrawableEdge) {
            keys = ['source', 'destination'];
        } else if (drawable instanceof DrawableNode) {
            keys = ['label'];
        } else {
            keys = [] as string[];
        }

        for (const key of keys) {
            (drawable as any)[key] = drawableFromAny(core.data[key], this.bridges);
        }
    }

    copyDrawableToCore(drawable: Drawable, core: CoreElement) {
        // TODO: use Object.getOwnPropertyNames(drawable)
        let keys;
        if (drawable instanceof DrawableEdge) {
            keys = ['source', 'destination'];
        } else if (drawable instanceof DrawableNode) {
            keys = ['label'];
        } else {
            keys = [] as string[];
        }

        for (const key of keys) {
            core.data[key] = coreFromAny((drawable as any)[key], this.bridges);
        }
    }
}