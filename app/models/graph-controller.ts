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
import { Model, Plugin, ElementValue, ElementType } from "sinap-core";
import { Value, Type } from "sinap-types";
import { DoubleMap } from "./double-map";
import { getPath } from "../util";
import { Bridge } from "./bridge";
export { Bridge, ComputedPropertyContext } from "./bridge";


export class UndoableEvent {
    private once = false;
    constructor(public readonly reloadProgram: boolean, private _undo: () => UndoableEvent) { }

    public undo() {
        if (this.once) {
            throw new Error("Can only undo once!");
        }

        this.once = true;
        return this._undo();
    }

    public copy() {
        return new UndoableEvent(this.reloadProgram, this._undo);
    }
}

class OutOfSyncError extends Error {
    constructor() {
        super("Nodes/edges list out of sync");
    }
}



export class GraphController {
    drawable: DrawableGraph;
    activeNodeType: ElementType;
    activeEdgeType: ElementType;
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

    constructor(public core: Model, public readonly plugin: Plugin) {
        this.activeEdgeType = plugin.types.edges.types.values().next().value;
        this.activeNodeType = plugin.types.nodes.types.values().next().value;

        this.drawable = new DrawableGraph(this.validateEdgeHandler);
        this.addDrawable(this.drawable); // Will copy over properties from the core graph to the drawable graph



        /* Create drawable versions of nodes and edges in the give graph */
        core.nodes.forEach((node) => {
            const drawableNode = this.drawable.createNode();
            if (!drawableNode) {
                throw new Error("Node creation failed while loading graph.");
            }
            this.addDrawable(drawableNode, node);
        });

        core.edges.forEach((edge) => {
            // TODO: Avoid all this casting?
            const sourceBridge = this.bridges.getA((edge.get("source") as Value.Union).value as ElementValue);
            const destinationBridge = this.bridges.getA((edge.get("destination") as Value.Union).value as ElementValue);
            if (!sourceBridge || !destinationBridge) {
                throw new OutOfSyncError();
            }

            const drawableEdge = this.drawable.createEdge(sourceBridge.drawable as DrawableNode, destinationBridge.drawable as DrawableNode);
            if (!drawableEdge) {
                throw new Error("Edge creation failed while loading graph.");
            }

            this.addDrawable(drawableEdge, edge);
        });
        /* ************************************************************* */



        /* finally set up all the listeners after we copy all the elements */
        const createdListener = (evt: DrawableEvent<DrawableElement>) => {
            const bridges = evt.detail.drawables.map(d => this.addDrawable(d[0], undefined, d[1]));
            this.changed.emit(new UndoableEvent(true, () => sync(() => deleteBridges(bridges))));
        };

        const deleteBridges = (bridges: Bridge[]): UndoableEvent => {
            const edges = bridges.filter((b) => b.drawable instanceof DrawableEdge);
            const nodes = bridges.filter((b) => b.drawable instanceof DrawableNode);

            const deleted = [...edges, ...nodes].map((e) => {
                this.drawable.delete(e.drawable as DrawableElement);
                return this.removeDrawable(e.drawable);
            });

            return new UndoableEvent(true, () => sync(() => addBridges(deleted)));
        };

        const addBridges = (bridges: Bridge[]): UndoableEvent => {
            const edges = bridges.filter((b) => b.drawable instanceof DrawableEdge);
            const nodes = bridges.filter((b) => b.drawable instanceof DrawableNode);

            const undeleted = [...nodes, ...edges].map((b) => {
                this.undelete(b);
                return b;
            });

            return new UndoableEvent(true, () => sync(() => deleteBridges(undeleted)));
        };

        const deletedListener = (evt: DrawableEvent<DrawableElement>) => {
            const bridges = evt.detail.drawables.map(d => this.removeDrawable(d[0]));
            this.changed.emit(new UndoableEvent(true, () => sync(() => addBridges(bridges))));
        };

        const movedListener = (evt: MoveEdgeEvent) => {
            const f = (): UndoableEvent => {
                const replacement = this.addDrawable(evt.detail.replacement, undefined, evt.detail.original);
                const original = this.removeDrawable(evt.detail.original);

                const undo: UndoableEvent = new UndoableEvent(true, () => sync(() => {
                    this.undelete(original);
                    this.drawable.delete(replacement.drawable as DrawableElement);
                    this.removeDrawable(replacement.drawable);

                    return new UndoableEvent(true, () => sync(() => {
                        this.undelete(replacement);
                        this.drawable.delete(original.drawable as DrawableElement);
                        this.removeDrawable(original.drawable);
                        return undo.copy();
                    }));
                }));

                return undo;
            };
            this.changed.emit(f());
        };

        const sync = (f: () => UndoableEvent) => {
            this.drawable.removeEventListener("created", createdListener);
            this.drawable.removeEventListener("deleted", deletedListener);
            this.drawable.removeEventListener("moved", movedListener);
            let r = f();
            this.drawable.addEventListener("created", createdListener);
            this.drawable.addEventListener("deleted", deletedListener);
            this.drawable.addEventListener("moved", movedListener);

            return r;
        };

        this.drawable.addEventListener("created", createdListener);
        this.drawable.addEventListener("deleted", deletedListener);
        this.drawable.addEventListener("moved", movedListener);

        this.drawable.addEventListener("select", (evt: SelectionChangedEvent) => this.setSelectedElements(evt.detail.curr));
        /* ************************************************************* */


        // side effect of selecting the graph
        this.setSelectedElements(undefined);
    }

    private undelete(bridge: Bridge) {
        if (bridge.drawable instanceof DrawableElement) {
            this.drawable.recreateItems(bridge.drawable);
        }


        // TODO: Sheyne, if you loved me you'd fix this before 1.0
        const f = (v: Value.Value) => {
            v.dependencyChildren.forEach(f);
            this.core.environment.add(v);
        };
        f(bridge.core);



        if (bridge.drawable instanceof DrawableNode) {
            this.core.nodes.add(bridge.core);
        }
        if (bridge.drawable instanceof DrawableEdge) {
            this.core.edges.add(bridge.core);
        }

        bridge.undeleted();
        this.bridges.set(bridge.core, bridge.drawable, bridge);
    }

    private addDrawable(drawable: Drawable, _core?: ElementValue, like?: DrawableElement) {
        let core: ElementValue;
        if (!_core) {
            core = this.makeCoreFromDrawable(drawable);
        } else {
            core = _core;
            this.copyPropertiesToDrawable(core, drawable);
        }

        if (like) {
            const likeBridge = this.bridges.getB(like);
            if (likeBridge) {
                if (Type.isSubtype(likeBridge.core.type, core.type)) {
                    likeBridge.core.type.members.forEach((t, k) => {
                        const likeValue = likeBridge.core.get(k);
                        const coreValue = core.get(k);

                        // TODO: Handle more than primitive and union values.
                        if (likeValue instanceof Value.Primitive && coreValue instanceof Value.Primitive) {
                            coreValue.value = likeValue.value;
                        } else
                            if (likeValue instanceof Value.Union && coreValue instanceof Value.Union) {
                                if (likeValue.value instanceof Value.Primitive && coreValue.value instanceof Value.Primitive) {
                                    coreValue.value.value = likeValue.value.value;
                                } else if (likeValue.value instanceof Value.Literal && coreValue.value instanceof Value.Literal) {
                                    coreValue.value = likeValue.value;
                                }
                            }
                    });
                } else {
                    throw new Error("Trying to create a core element like a core element with a different type.");
                }
            } else {
                console.log("TODO: What happens when the node you're creating a copy of is deleted?");
                // throw new OutOfSyncError();
            }
        }

        const bridge = new Bridge(this, core, drawable);
        this.bridges.set(core, drawable, bridge);

        return bridge;
    }

    private removeDrawable(drawable: Drawable) {
        const bridge = this.bridges.getB(drawable);
        if (bridge) {
            bridge.deleted();
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
            core = this.core.makeNode(this.activeNodeType);
        } else if (drawable instanceof DrawableEdge) {
            const srcB = this.bridges.getB(drawable.source);
            const dstB = this.bridges.getB(drawable.destination);
            if (!srcB || !dstB) {
                throw new Error("Model missing source or destination for edge.");
            }

            core = this.core.makeEdge(this.activeEdgeType, srcB.core, dstB.core);
        } else if (drawable instanceof DrawableGraph) {
            core = this.core.graph;
        } else {
            throw new Error("Unable to create core representation of unknown Drawable type.");
        }

        this.copyPropertiesToCore(drawable, core);
        return core;
    }



    copyPropertiesToDrawable(core: ElementValue, drawable: Drawable) {
        Object.keys(drawable).forEach((key) => {
            this.copyPropertyToDrawable(core.get(key), drawable, key);
        });
    }

    copyPropertiesToCore(drawable: Drawable, core: ElementValue) {
        Object.keys(drawable).forEach(this.copyPropertyToCore.bind(this, drawable, core));
    }

    private readonly drawableKeys = new Set(["label", "color", "borderColor", "borderWidth", "lineWidth", "showSourceArrow", "showDestinationArrow", "image", "shape", "borderStyle", "lineStyle", "position"]);

    copyPropertyToDrawable(value: Value.Value | undefined, drawable: Drawable, key: string) {
        if (value === undefined || !this.drawableKeys.has(key)) {
            return;
        }

        if (value instanceof Value.Union && (key === "lineWidth" || key === "borderWidth")) {
            if (value.value instanceof Value.Literal) {
                const lineWidth = value.value.value;
                (drawable as any)[key] = lineWidth === "thin" ? 1 : (lineWidth === "thick" ? 3 : 2); // medium = 2;
            } else if (value.value instanceof Value.Primitive) {
                (drawable as any)[key] = value.value.value;
            }

            return;
        }

        if (((value instanceof Value.Literal) || (value instanceof Value.Primitive)) && key === "image") {
            if (value.value && value.value !== "") {
                const path = getPath(this.plugin.pluginInfo.interpreterInfo.directory + "/" + value.value);
                (drawable as any)[key] = path;
            }
            return;
        }

        if (value instanceof Value.Primitive) {
            (drawable as any)[key] = value.value;
            return;
        }

        if (value instanceof Value.Union) {
            if (value.value instanceof Value.Literal || value.value instanceof Value.Primitive) {
                (drawable as any)[key] = value.value.value;
            }

            return;
        }

        if (value instanceof Value.Record && key === "position") {
            (drawable as DrawableNode).position = {
                x: (value.value.x as Value.Primitive).value as number,
                y: (value.value.y as Value.Primitive).value as number
            };

            return;
        }
    }

    copyPropertyToCore(drawable: Drawable, core: ElementValue, key: string): boolean {
        if (key === "source" || key === "destination") {
            if (!(drawable instanceof DrawableEdge)) {
                return false;
            }

            const bridge = this.bridges.getB((drawable as any)[key]);
            if (!bridge) {
                throw new Error("Edge is referencing a nonexistent node");
            }

            (core.get(key) as Value.Union).value = bridge.core;
            return true;
        }

        if (!this.drawableKeys.has(key)) {
            return false;
        }

        let value = core.get(key);

        if (value instanceof Value.Union && (key === "lineWidth" || key === "borderWidth")) {
            // TODO: maybe try to match this up.
            value.value = value.environment.make(new Type.Literal("medium"));
            return true;
        }

        if (value instanceof Value.Primitive) {
            value.value = (drawable as any)[key];
            return true;
        }

        if (value instanceof Value.Union) {
            // TODO: I'm assuming that all types of a union are literal
            value.value = value.environment.make(new Type.Literal((drawable as any)[key]));
            return true;
        }

        if (value instanceof Value.Record && key === "position") {
            (value.value.x as Value.Primitive).value = (drawable as any)[key].x;
            (value.value.y as Value.Primitive).value = (drawable as any)[key].y;
            return true;
        }

        return false;
    }

    public selectElements(...items: ElementValue[]) {
        const toSelect = items.map((i) => this.core.environment.values.get(i.uuid) as ElementValue | undefined)
            .filter((n) => n && this.bridges.getA(n))
            .map((n) => this.bridges.getA(n!)!.drawable)
            .filter((n) => (n instanceof DrawableElement)) as DrawableElement[];
        this.drawable.setSelected(...toSelect);
    }

    private setSelectedElements(se: Iterable<Drawable> | undefined) {
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