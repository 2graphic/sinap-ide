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

import { CoreModel, CoreElement, CoreElementKind, Plugin, validateEdge, ObjectType, isObjectType, WrappedScriptObjectType, PluginTypeEnvironment, valueWrap, CoreValue, makeValue, Type, CorePrimitiveValue, CoreUnionValue, CoreObjectValue } from "sinap-core";
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
//  */
// export class BridgingProxy {
//     proxy: { [a: string]: any };

//     constructor(public core: CoreElement, public drawable: Drawable, public graph: GraphController) {
//         this.proxy = new Proxy(core.data, {
//             set: (data, k, v) => this.set(k, v),
//             get: (data, k) => this.get(k),
//         });
//     }

//     set(k: PropertyKey, v: any, updateDrawable = true) {
//         let drawableValue = v;
//         let coreValue = v;

//         // If v is a drawable element or a core element,
//         // then when it gets set in the various proxied data
//         // structures, set it differently.

//         if (v instanceof BridgingProxy) {
//             drawableValue = v.drawable;
//             coreValue = v.core;
//         } else if (v instanceof CoreElement) {
//             drawableValue = drawableFromAny(v, this.graph.bridges);
//         } else if (v instanceof Drawable) {
//             coreValue = coreFromAny(v, this.graph.bridges);
//         }

//         if (updateDrawable && Object.keys(this.drawable).indexOf(k.toString()) !== -1) {
//             (this.drawable as any)[k] = drawableValue;
//         }

//         const oldValue = this.core.data[k];
//         this.core.data[k] = coreValue;

//         this.graph.changed.emit(new UndoableChange(this, k, oldValue, coreValue));

//         return true;
//     }

//     get(k: PropertyKey) {
//         const coreValue = this.core.data[k];
//         // if this is something that should be proxied
//         const proxiedValue = this.graph.bridges.getB(coreValue);
//         // return the proxy. That is, any changes made to the returned
//         // object should propagate to both backers
//         return proxiedValue !== undefined ? proxiedValue : coreValue;
//     }
// }

// function drawableFromAny(a: any, bridges: DoubleMap<Drawable, CoreElement, BridgingProxy>) {
//     if (a instanceof CoreElement) {
//         const bridge = bridges.getB(a);
//         if (bridge === undefined) {
//             throw "trying to reference a core element that doesn't have an analogous drawable";
//         }
//         a = bridge.drawable;
//     }
//     return a;
// }

// function coreFromAny(a: any, bridges: DoubleMap<Drawable, CoreElement, BridgingProxy>) {
//     if (a instanceof Drawable) {
//         const bridge = bridges.getA(a);
//         if (bridge === undefined) {
//             throw "trying to reference a drawable element that doesn't have an analogous core";
//         }
//         a = bridge.core;
//     }
//     return a;
// }

export type UndoableEvent = UndoableChange | UndoableAddOrDelete;
export type CreatedOrDeletedEvent = ["created" | "deleted", BridgingProxy];
export class UndoableAddOrDelete {
    constructor(public events: CreatedOrDeletedEvent[]) { }
}

export declare class BridgingProxy {
}

// TODO: changes can also be adds or deletes
export class UndoableChange {
    constructor(public target: BridgingProxy,
        public key: PropertyKey,
        public oldValue: any,
        public newValue: any) { }
}

export class Bridge {
    constructor(public core: CoreElement, public drawable: Drawable) { };
}

export class GraphController {
    drawable: DrawableGraph;
    activeNodeType: string;
    activeEdgeType: string;
    public changed = new EventEmitter<UndoableEvent>();

    private _selectedElements: Set<Bridge>;
    private get selectedElements() {
        return this._selectedElements;
    }

    public bridges = new DoubleMap<CoreElement, Drawable, Bridge>();

    validateEdgeHandler = (src: DrawableNode, dst?: DrawableNode, like?: DrawableEdge) => {
        const sourceBridge = this.bridges.getB(src);
        if (!sourceBridge) {
            throw new Error("Out of sync.");
        }
        const source = sourceBridge.core;

        let destination: CoreElement | undefined = undefined;
        if (dst !== undefined) {
            const destinationBridge = this.bridges.getB(dst);
            if (!destinationBridge) {
                throw new Error("Out of sync.");
            }

            destination = destinationBridge.core;
        }

        // TODO: @Sheyne why does this fail?
        const sourceType = this.plugin.typeEnvironment.getElementType(source.kind, source.type.name);
        const destinationType = destination !== undefined ? (this.plugin.typeEnvironment.getElementType(destination.kind, destination.type.name)) : undefined;

        let edge: WrappedScriptObjectType<PluginTypeEnvironment>;
        if (like !== undefined) {
            const e = this.bridges.getB(like);
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

        this.drawable = new DrawableGraph(() => true);
        let coreGraph: CoreElement | null = null;
        const coreEdges: CoreElement[] = [];

        // each core element we iterate over needs to have a drawable equivalent made for it
        for (const [_, element] of this.core.elements) {
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
                    this.copyPropertiesToDrawable(element, drawable);
                    break;
                case CoreElementKind.Graph:
                    drawable = this.drawable;
                    // we want to keep track of the graph element
                    if (coreGraph !== null) {
                        throw "More than one graph found";
                    }
                    coreGraph = element;
                    this.copyPropertiesToDrawable(element, drawable);
                    break;
            }
            if (drawable !== null) {
                this.addDrawable(drawable, element);
            }
        }
        // if we weren't given a graph object, make one
        if (coreGraph === null) {
            this.addDrawable(this.drawable);
        }

        // now make the drawable edges
        for (const edge of coreEdges) {
            const source = this.bridges.getA(edge.get('source') as any) !.drawable as DrawableNode;
            const destination = this.bridges.getA(edge.get('destination') as any) !.drawable as DrawableNode;

            const drawableEdge = this.drawable.createEdge(source, destination);
            if (drawableEdge === null) {
                throw "edge creation canceled while loading from core";
            }

            this.copyPropertiesToDrawable(edge, drawableEdge);
            this.addDrawable(drawableEdge, edge);
        }

        // finally set up all the listeners after we copy all the elements
        this.drawable.addCreatedOrDeletedElementListener((n: CreatedOrDeletedEventArgs) => this.addOrDeleteDrawables(n.events));
        this.drawable.addSelectionChangedListener((a: PropertyChangedEventArgs<Iterable<DrawableElement>>) => {
            this.setSelectedElements(a.curr);
        });
        // side effect of selecting the graph
        this.setSelectedElements(undefined);
    }

    private addOrDeleteDrawables(events: DrawableCreatedOrDeletedEvent[]) {
        const mapped = events.forEach(([a, e]) => (a === "created" ? this.addDrawable(e) : this.removeDrawable(e)));

        // this.changed.emit(new UndoableAddOrDelete(mapped));
    }

    private addDrawable(drawable: Drawable, core?: CoreElement) {
        if (!core) {
            core = this.makeCoreFromDrawable(drawable);
        }
        const bridge = new Bridge(core, drawable);
        this.bridges.set(core, drawable, bridge);

        drawable.addPropertyChangedListener((a: PropertyChangedEventArgs<any>) => this.onPropertyChanged(a));

        return bridge;
    }

    private removeDrawable(drawable: Drawable) {
        const bridge = this.bridges.getB(drawable);
        if (bridge) {
            this.core.removeElement(bridge.core);
            this.bridges.delete(bridge.core, bridge.drawable);
        }

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
        this.copyPropertiesToCore(drawable, core);

        return core;
    }

    public applyUndoableEvent(event: UndoableEvent) {
        // if (event instanceof UndoableAddOrDelete) {
        //     const toUndo = event.events
        //         .map((e) => [e[0], e[1].drawable] as DrawableCreatedOrDeletedEvent);

        //     const undoResults = this.drawable.undo(toUndo);

        //     const mapped = undoResults.map(([createdOrDeleted, drawable]): CreatedOrDeletedEvent =>
        //         [createdOrDeleted, (() => {
        //             if (createdOrDeleted === "created") {
        //                 const found = event.events.find(([_, bridge]) => bridge.drawable === drawable);

        //                 if (found) {
        //                     // Reinsert the core element and bridge
        //                     const [_, bridge] = found;

        //                     this.core.elements.set(bridge.core.uuid, bridge.core);
        //                     this.bridges.set(bridge.drawable, bridge.core, bridge);
        //                     return bridge;
        //                 } else {
        //                     return this.addDrawable(drawable);
        //                 }
        //             } else {
        //                 return this.removeDrawable(drawable);
        //             }
        //         })()]);
        //     this.changed.emit(new UndoableAddOrDelete(mapped));
        // } else if (event instanceof UndoableChange) {
        //     event.target.set(event.key, event.oldValue, true);
        // } else {
        //     throw "Unrecognized event";
        // }
    }

    private onPropertyChanged(a: PropertyChangedEventArgs<any>) {
        const bridge = this.bridges.getB(a.source);
        if (bridge !== undefined) {
            // TODO: only copy changed property
            this.copyPropertiesToCore(bridge.drawable, bridge.core);
        } else {
            throw "Nodes/edges list out of sync";
        }
    }

    private getData = (v: CoreValue<PluginTypeEnvironment>) => {
        if (v instanceof CorePrimitiveValue || v instanceof CoreUnionValue) {
            return v.data;
        } else if (v instanceof CoreObjectValue) {
            let raw = {} as any;
            for (const [key, _] of v.type.members) {
                raw[key] = this.getData(v.get(key));
            }
            return raw;
        } else {
            throw new Error();
        }
    }

    copyPropertiesToDrawable(core: CoreElement, drawable: Drawable) {
        for (const key in drawable) {
            try {
                const value = core.get(key) as CoreValue<PluginTypeEnvironment>;
                const data = this.getData(value);
                (drawable as any)[key] = data;
            } catch (e) {
                console.log("Not copying " + key);
            }
        }
    }

    copyPropertiesToCore(drawable: Drawable, core: CoreElement) {
        for (const key in drawable) {
            if (key == "source" || key == "destination") {
                const bridge = this.bridges.getB((drawable as any)[key]);
                if (!bridge) {
                    throw new Error("Edge is referencing a nonexistent node");
                }

                core.set(key, bridge.core);
                continue;
            }

            const kind = CoreElementKind[core.kind];
            const drawableType = core.type.env.lookupSinapType("Drawable" + kind);
            if (!isObjectType(drawableType)) {
                throw new Error("Expected ObjectType");
            }

            let type = drawableType.members.get(key) as Type<PluginTypeEnvironment> | undefined;

            if (type === undefined) {
                console.log("Not copying " + key);
                continue;
            }

            if (type.isAssignableTo(core.type.env.lookupSinapType("WrappedString"))) {
                type = type.env.getStringType();
            }

            const typeEnvironment = this.plugin.typeEnvironment;
            const value = makeValue(type, (drawable as any)[key], false);

            core.set(key, value);
        }
    }

    setSelectedElements(se: Iterable<Drawable> | undefined) {
        if (se === undefined) {
            se = [];
        }

        const values = [...se];
        if (values.length === 0) {
            const br = this.bridges.getB(this.drawable);
            if (br === undefined) {
                throw "no graph element";
            }
            this._selectedElements = new Set([br]);
        } else {
            this._selectedElements = new Set(values.map((d) => {
                const bridge = this.bridges.getB(d);
                if (bridge) {
                    return bridge;
                } else {
                    throw new Error("Out of sync.");
                }
            }));
        }
    }
}