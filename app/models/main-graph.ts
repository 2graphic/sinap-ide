// File: main-graph.ts
// Created by: Sheyne Anderson
// Date created: January 22, 2017
//
//

import { DrawableElement, DrawableGraph, DrawableEdge, DrawableNode, EdgeValidator, DrawableEdgeEventArgs, DrawableNodeEventArgs, PropertyChangedEventArgs } from "../components/graph-editor/graph-editor.component"

export class Type {

}

export enum CoreElementKind { Node, Edge, Graph };

export class CoreElement {
    data: { [a: string]: any };

    constructor(readonly type: Type, readonly kind: CoreElementKind) {
        this.data = {};
    }
}

/**
 * Keep two dictionaries in sync, different efficient maps to the same data
 */
class DoubleMap<A, B, C> {
    private first: Map<A, C>;
    private second: Map<B, C>;

    constructor() {
        this.first = new Map();
        this.second = new Map();
    }

    /**
     * Map `a` and `b` to `c`
     */
    set(a: A, b: B, c: C) {
        this.first.set(a, c);
        this.second.set(b, c);
    }

    /**
     * Get the `C` value that goes with `a`
     */
    getA(a: A) {
        return this.first.get(a);
    }

    /**
     * Get the `C` value that goes with `b`
     */
    getB(b: B) {
        return this.second.get(b);
    }

    values() {
        return this.first.values();
    }

    entries() {
        return this.first.values();
    }
}

class BridgingProxy {
    proxy: { [a: string]: any };

    constructor(public core: CoreElement, public drawable: DrawableElement | DrawableGraph, private bridges: DoubleMap<DrawableElement | DrawableGraph, CoreElement, BridgingProxy>) {
        this.proxy = new Proxy(core.data, {
            set: (data, k, v) => this.set(k, v),
        });
    }

    set(k: PropertyKey, v: any, updateDrawable = true) {
        let drawableValue = v;
        let coreValue = v;

        // If v is a drawable element or a core element,
        // then when it gets set in the various proxied data
        // structures, set it differently. 

        if (v instanceof CoreElement) {
            // if v is a core element then 
            // when assigning the drawable elements below, 
            // use v by looking up in the bridge          
            const bridge = this.bridges.getB(v);
            if (bridge !== undefined) {
                drawableValue = bridge.drawable;
            }
        } else {
            // if we mapped a drawable element (note the "A" in `getA`)
            // to something, then v is a drawable element and we want to 
            // use the core value it maps to when setting the core element
            const bridge = this.bridges.getA(v);
            if (bridge !== undefined) {
                coreValue = bridge.core;
            }
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
        return proxiedValue !== undefined ? proxiedValue.proxy : coreValue;
    }
}

function copyCoreToDrawable(core: CoreElement, drawable: DrawableElement, exclusionKeys = new Set<string>()) {
    for (const key of Object.getOwnPropertyNames(drawable)) {
        if (!exclusionKeys.has(key)) {
            (drawable as any)[key] = core.data[key];
        }
    }
}

function copyDrawableToCore(drawable: DrawableElement | DrawableGraph, core: CoreElement, exclusionKeys = new Set<string>()) {
    for (const key of Object.getOwnPropertyNames(drawable)) {
        if (!exclusionKeys.has(key)) {
            core.data[key] = (drawable as any)[key];
        }
    }
}

export class MainGraph {
    drawable: DrawableGraph;
    public bridges = new DoubleMap<DrawableElement | DrawableGraph, CoreElement, BridgingProxy>();

    constructor(coresIter: Iterable<CoreElement>) {
        this.drawable = new DrawableGraph(() => true);

        const coreEdges: CoreElement[] = [];
        for (const element of coresIter) {
            let drawable: DrawableElement | DrawableGraph | null = null;
            switch (element.kind) {
                case CoreElementKind.Edge:
                    coreEdges.push(element);
                    break;
                case CoreElementKind.Node:
                    drawable = this.drawable.createNode();
                    if (drawable === null) {
                        throw "node creation canceled while loading from core";
                    }
                    copyCoreToDrawable(element, drawable);
                    break;
                case CoreElementKind.Graph:
                    // TODO: copy core to drawable
                    drawable = this.drawable;
                    break;
            }
            if (drawable !== null) {
                this.addDrawable(drawable, element);
            }
        }
        const srcDstSet = new Set(['source', 'destination']);
        for (const edge of coreEdges) {
            const src = this.bridges.getB(edge.data['source']);
            const dst = this.bridges.getB(edge.data['destination']);
            if (src === undefined || dst === undefined) {
                throw "Incosisitant graph given";
            }
            // cast is safe, we've only called `createNode` so far. 
            const drawableEdge = this.drawable.createEdge(src.drawable as DrawableNode, dst.drawable as DrawableNode);
            if (drawableEdge === null) {
                throw "edge creation canceled while loading from core";
            }

            copyCoreToDrawable(edge, drawableEdge, srcDstSet);

            this.addDrawable(drawableEdge, edge);
        }

        this.drawable.addCreatingNodeListener((n: DrawableNodeEventArgs) => this.onCreatingNode(n));
        this.drawable.addCreatedNodeListener((n: DrawableNodeEventArgs) => this.onCreatedNode(n));
        this.drawable.addCreatingEdgeListener((e: DrawableEdgeEventArgs) => this.onCreatingEdge(e));
        this.drawable.addCreatedEdgeListener((e: DrawableEdgeEventArgs) => this.onCreatedEdge(e));
        this.drawable.addPropertyChangedListener((a: PropertyChangedEventArgs<any>) => this.onPropertyChanged(a));
    }

    addDrawable(drawable: DrawableElement | DrawableGraph, core?: CoreElement) {
        if (!core) {
            const kind = drawable instanceof DrawableEdge ?
                CoreElementKind.Edge : (drawable instanceof DrawableNode ?
                    CoreElementKind.Node : CoreElementKind.Graph);
            // TODO: populate type
            core = new CoreElement(null as any, kind);
            copyDrawableToCore(drawable, core);
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
}