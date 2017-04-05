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
    DrawableEvent,
    MoveEdgeEvent,
    PropertyChangedEvent,
    PropertyChangedEventDetail,
    SelectionChangedEvent
} from "../components/graph-editor/graph-editor.component";

import { Model, Plugin, ElementValue } from "sinap-core";
import { Value } from "sinap-types";
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

// TODO: changes can also be adds or deletes
export class UndoableEvent {
    constructor(public undo: () => void) { }
}

export class Bridge {
    constructor(public core: ElementValue, public drawable: Drawable) { };
}

class OutOfSyncError extends Error {
    constructor() {
        super("Nodes/edges list out of sync");
    }
}

export class GraphController {
    drawable: DrawableGraph;
    activeNodeType: string;
    activeEdgeType: string;
    public changed = new EventEmitter<UndoableEvent>();
    public selectionChanged = new EventEmitter<Set<Bridge>>();

    public selectedElements: Set<Bridge>;

    public bridges = new DoubleMap<ElementValue, Drawable, Bridge>();

    validateEdgeHandler = (src: DrawableNode, dst?: DrawableNode, like?: DrawableEdge) => {
        const sourceBridge = this.bridges.getB(src);
        if (!sourceBridge) {
            throw new OutOfSyncError();
        }
        const source = sourceBridge.core;

        let destination: ElementValue | undefined = undefined;
        if (dst !== undefined) {
            const destinationBridge = this.bridges.getB(dst);
            if (!destinationBridge) {
                throw new OutOfSyncError();
            }

            destination = destinationBridge.core;
        }

        // TODO: ...

        return true;
    }

    constructor(public core: Model, public plugin: Plugin) {
        this.activeEdgeType = plugin.edgesType.types.values().next().value.name;
        this.activeNodeType = plugin.nodesType.types.values().next().value.name;

        this.drawable = new DrawableGraph(this.validateEdgeHandler);
        this.addDrawable(this.drawable);
        // let coreGraph: CoreElement | null = null;
        // const coreEdges: CoreElement[] = [];

        // // each core element we iterate over needs to have a drawable equivalent made for it
        // for (const [_, element] of this.core.elements) {
        //     // placeholder for the new drawable (if we make one)
        //     let drawable: Drawable | null = null;
        //     switch (element.kind) {
        //         case CoreElementKind.Edge:
        //             // do edges last, they reference nodes
        //             coreEdges.push(element);
        //             break;
        //         case CoreElementKind.Node:
        //             drawable = this.drawable.createNode();
        //             if (drawable === null) {
        //                 throw "node creation canceled while loading from core";
        //             }
        //             this.copyPropertiesToDrawable(element, drawable);
        //             break;
        //         case CoreElementKind.Graph:
        //             drawable = this.drawable;
        //             // we want to keep track of the graph element
        //             if (coreGraph !== null) {
        //                 throw "More than one graph found";
        //             }
        //             coreGraph = element;
        //             this.copyPropertiesToDrawable(element, drawable);
        //             break;
        //     }
        //     if (drawable !== null) {
        //         this.addDrawable(drawable, element);
        //     }
        // }
        // // if we weren't given a graph object, make one
        // if (coreGraph === null) {
        //     this.addDrawable(this.drawable);
        // }

        // // now make the drawable edges
        // for (const edge of coreEdges) {
        //     const source = this.bridges.getA(edge.get('source') as any)!.drawable as DrawableNode;
        //     const destination = this.bridges.getA(edge.get('destination') as any)!.drawable as DrawableNode;

        //     const drawableEdge = this.drawable.createEdge(source, destination);
        //     if (drawableEdge === null) {
        //         throw "edge creation canceled while loading from core";
        //     }

        //     this.copyPropertiesToDrawable(edge, drawableEdge);
        //     this.addDrawable(drawableEdge, edge);
        // }

        // finally set up all the listeners after we copy all the elements
        this.drawable.addEventListener("created", (evt: DrawableEvent<DrawableElement>) => {
            const bridges = evt.detail.drawables.map(d => this.addDrawable(d));
            this.changed.emit(new UndoableEvent(() => {
                // TODO
            }));
        });
        this.drawable.addEventListener("deleted", (evt: DrawableEvent<DrawableElement>) => {
            const bridges = evt.detail.drawables.map(d => this.removeDrawable(d));
            this.changed.emit(new UndoableEvent(() => {
                // TODO
            }));
        });
        this.drawable.addEventListener("moved", (evt: MoveEdgeEvent) => {
            const original = this.removeDrawable(evt.detail.original);
            const replacement = this.addDrawable(evt.detail.replacement);
            this.changed.emit(new UndoableEvent(() => {
                // TODO
            }));
        });
        this.drawable.addEventListener("change", (evt: PropertyChangedEvent<any>) => this.onPropertyChanged(evt.detail));
        this.drawable.addEventListener("select", (evt: SelectionChangedEvent) => this.setSelectedElements(evt.detail.curr));

        // side effect of selecting the graph
        this.setSelectedElements(undefined);
    }

    private addDrawable(drawable: Drawable, _core?: ElementValue) {
        let core: ElementValue;
        if (!_core) {
            core = this.makeCoreFromDrawable(drawable);
        } else {
            core = _core;
        }
        const bridge = new Bridge(core, drawable);
        this.bridges.set(core, drawable, bridge);

        core.environment.listen((_, value, other) => {
            [...core.type.members.entries()].map(([k, _]): [string, Value.Value] => [k, core.get(k)]).filter(([_, v]) => v === value).forEach(([k, _]) => {
                this.copyPropertyToDrawable(core, drawable, k);
                console.log(core, drawable, k, value, other);
                this.changed.emit(new UndoableEvent(() => {
                    // TODO
                }));
            });
        }, () => true, core);

        // const f = (_: any, nv: any) => {
        //     for (const key in nv) {
        //         if (key === "source" || key === "destination" || key === "position") continue;
        //         drawable.removeEventListener("change", g);
        //         (drawable as any)[key] = nv[key];
        //         setTimeout(() => {
        //             drawable.addEventListener("change", g);
        //         }, 0);
        //     }
        // };

        // const g = (evt: PropertyChangedEvent<any>) => this.onPropertyChanged(evt.detail);
        // deepListen([...core.values][0][1], () => {
        //     setTimeout(() => {
        //         this.changed.emit();
        //     }, 0);
        // });
        // deepListen([...core.values][1][1], f);
        // drawable.addEventListener("change", g);

        return bridge;
    }

    private removeDrawable(drawable: Drawable) {
        const bridge = this.bridges.getB(drawable);
        if (bridge) {
            this.core.delete(bridge.core);
            this.bridges.delete(bridge.core, bridge.drawable);
        } else {
            throw new Error("Trying to delete core element that does not exist.");
        }

        return bridge;
    }


    private makeCoreFromDrawable(drawable: Drawable) {
        let core: ElementValue;

        if (drawable instanceof DrawableNode) {
            core = this.core.makeNode();
        } else if (drawable instanceof DrawableEdge) {
            const srcB = this.bridges.getB(drawable.source);
            const dstB = this.bridges.getB(drawable.destination);
            if (!srcB || !dstB) {
                throw new Error("Modal missing source or destination for edge.");
            }

            core = this.core.makeEdge(undefined, srcB.core, dstB.core);
        } else if (drawable instanceof DrawableGraph) {
            core = this.core.graph;
        } else {
            throw new Error("Unable to create core representation of unknown Drawable type.");
        }

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

    private onPropertyChanged(a: PropertyChangedEventDetail<any>) {
        const bridge = this.bridges.getB(a.source);
        if (bridge !== undefined) {
            this.copyPropertyToCore(bridge.drawable, bridge.core, a.key.toString());
            this.changed.emit(new UndoableEvent(() => {
                // TODO
            }));
        } else {
            throw new OutOfSyncError();
        }
    }

    // private getData = (v: Element) => {
    //     return v.jsonify(() => { return { result: false, value: undefined }; });
    // }

    copyPropertiesToDrawable(core: ElementValue, drawable: Drawable) {
        Object.keys(drawable).forEach(this.copyPropertyToDrawable.bind(this, core, drawable));
    }

    copyPropertiesToCore(drawable: Drawable, core: ElementValue) {
        Object.keys(drawable).forEach(this.copyPropertyToCore.bind(this, drawable, core));
    }

    private readonly primitives = new Set(["label", "color", "borderColor", "borderWidth"]);

    copyPropertyToDrawable(core: ElementValue, drawable: Drawable, key: string) {
        const value = core.get(key);

        if (value instanceof Value.Primitive && this.primitives.has(key)) {
            // TODO: Typesafe way to do this?
            (drawable as any)[key] = value.value;
        }
    }

    copyPropertyToCore(drawable: Drawable, core: ElementValue, key: string) {
        if (key === "source" || key === "destination") {
            const bridge = this.bridges.getB((drawable as any)[key]);
            if (!bridge) {
                throw new Error("Edge is referencing a nonexistent node");
            }

            core.set(key, bridge.core);
            return;
        }

        let value = core.get(key);

        if (value instanceof Value.Primitive && this.primitives.has(key)) {
            value.value = (drawable as any)[key];
        } 

        // if (key === "position") {
        //     const pos = core.get("position") as CoreObjectValue<PluginTypeEnvironment>;
        //     const x = pos.get("x") as CorePrimitiveValue<PluginTypeEnvironment>;
        //     const y = pos.get("y") as CorePrimitiveValue<PluginTypeEnvironment>;

        //     x.data = (drawable as DrawableNode).position.x;
        //     y.data = (drawable as DrawableNode).position.y;

        //     return;
        // }

        // const kind = CoreElementKind[core.kind];
        // const drawableType = core.type.env.lookupSinapType("Drawable" + kind);
        // if (!isObjectType(drawableType)) {
        //     throw new Error("Expected ObjectType");
        // }

        // let type = drawableType.members.get(key.toString()) as Type<PluginTypeEnvironment> | undefined;

        // if (type === undefined) {
        //     // console.log("Not copying " + key);
        //     return;
        // }

        // if (type.isAssignableTo(core.type.env.lookupSinapType("WrappedString"))) {
        //     type = type.env.getStringType();
        // }

        // const typeEnvironment = this.plugin.typeEnvironment;
        // const value = makeValue(type, (drawable as any)[key], false);

        // core.set(key.toString(), value);
    }

    setSelectedElements(se: Iterable<Drawable> | undefined) {
        if (se === undefined) {
            se = [];
        }

        const values = [...se];
        if (values.length === 0) {
            const br = this.bridges.getB(this.drawable);
            if (br === undefined) {
                throw new Error("no graph element");
            }
            this.selectedElements = new Set([br]);
        } else {
            this.selectedElements = new Set(values.map((d) => {
                const bridge = this.bridges.getB(d);
                if (bridge) {
                    return bridge;
                } else {
                    throw new OutOfSyncError();
                }
            }));
        }

        this.selectionChanged.emit(this.selectedElements);
    }
}