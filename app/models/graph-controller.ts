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

export class UndoableEvent {
    constructor(public undo: () => void) { }
}

export class Bridge {
    private isSyncing = false;

    constructor(private graph: GraphController, public core: ElementValue, public drawable: Drawable) {
        const computedPropertyContext = new ComputedPropertyContext(core);
        core.context = computedPropertyContext;

        // Copy computed properties for the first time.
        const copyComputedProperties = () => {
            [...computedPropertyContext.properties.entries()].forEach(([key, [name, value]]) => {
                this.graph.copyPropertyToDrawable(value, drawable, key);
            });
        };
        copyComputedProperties();

        core.environment.listen((_, value, other) => {
            this.sync(() => {
                // console.log(core, _, value, other);

                computedPropertyContext.update();
                copyComputedProperties();

                [...core.type.members.entries()].map(([k, _]): [string, Value.Value] => [k, core.get(k)]).filter(([_, v]) => {
                    if (v === value) {
                        return true;
                    } else if (v instanceof Value.Record) {
                        for (const k of Object.keys(v.value)) {
                            if (v.value[k] === value) {
                                return true;
                            }
                        }
                    } else if (v instanceof Value.Union && v.value === value) {
                        return true;
                    }

                    return false;
                }).forEach(([k, _]) => {
                    this.graph.copyPropertyToDrawable(core.get(k), drawable, k);
                });
            });
        }, () => true, core);

        drawable.addEventListener("change", (evt: PropertyChangedEvent<any>) => {
            this.sync(() => {
                const result = this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                if (result) {
                    this.graph.changed.emit(new UndoableEvent(() => {
                        // TODO
                    }));
                }
            });
        });
    };

    private sync(f: () => void) {
        if (this.isSyncing) return;
        this.isSyncing = true;
        f();
        this.isSyncing = false;
    }
}

class OutOfSyncError extends Error {
    constructor() {
        super("Nodes/edges list out of sync");
    }
}

export class ComputedPropertyContext {
    public readonly properties = new Map<string, [string, Value.Value]>();
    public onUpdate?: (() => void) = undefined;

    constructor(public readonly value: ElementValue) {
        this.update();
    };

    update() {
        [...this.value.type.pluginType.methods.entries()].filter(([_, method]) => method.isGetter).forEach(([key, _]) => {
            let v = this.value.call(key);
            if (v) {
                this.properties.set(key, [this.value.type.prettyName(key), v]);
            }
        });

        if (this.onUpdate) {
            this.onUpdate();
        }
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
        this.drawable.addEventListener("created", (evt: DrawableEvent<DrawableElement>) => {
            const bridges = evt.detail.drawables.map(d => this.addDrawable(d[0]));
            this.changed.emit(new UndoableEvent(() => {
                // TODO
            }));
        });
        this.drawable.addEventListener("deleted", (evt: DrawableEvent<DrawableElement>) => {
            const bridges = evt.detail.drawables.map(d => this.removeDrawable(d[0]));
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

        this.drawable.addEventListener("select", (evt: SelectionChangedEvent) => this.setSelectedElements(evt.detail.curr));
        /* ************************************************************* */


        // side effect of selecting the graph
        this.setSelectedElements(undefined);
    }

    private addDrawable(drawable: Drawable, _core?: ElementValue) {
        let core: ElementValue;
        if (!_core) {
            core = this.makeCoreFromDrawable(drawable);
        } else {
            core = _core;
            this.copyPropertiesToDrawable(core, drawable);
        }
        const bridge = new Bridge(this, core, drawable);
        this.bridges.set(core, drawable, bridge);

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

    public applyUndoableEvent(event: UndoableEvent) {
        // TODO:
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

        if (((value instanceof Value.Literal) || (value instanceof Value.Primitive)) && key === "image") {
            if (value.value && value.value !== "") {
                const path = getPath(this.plugin.pluginInfo.interpreterInfo.directory + "/" + value.value);
                (drawable as any)[key] = path;
            }
        } else if (value instanceof Value.Primitive) {
            // TODO: Typesafe way to do this?
            (drawable as any)[key] = value.value;
        }

        if (value instanceof Value.Union) {
            if (value.value instanceof Value.Literal || value.value instanceof Value.Primitive) {
                (drawable as any)[key] = value.value.value;
            }
        }

        if (value instanceof Value.Record && key === "position") {
            (drawable as DrawableNode).position = {
                x: (value.value.x as Value.Primitive).value as number,
                y: (value.value.y as Value.Primitive).value as number
            };
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