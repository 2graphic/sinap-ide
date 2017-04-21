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
import { GraphController, UndoableEvent } from "./graph-controller";
import { getPath } from "../util";

export class Bridge {
    private isSyncing = false;

    private coreListener: (a: Value.Value, b: Value.Value, c: any) => void;
    private drawableListener: (evt: PropertyChangedEvent<any>) => void;

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

        this.coreListener = (_: Value.Value, value: Value.Value, other: any) => {
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

                    // TODO: Can only undo primitive changes.
                    if (value instanceof Value.Primitive) {
                        const undo: UndoableEvent = new UndoableEvent(true, () => {
                            this.sync(() => {
                                value.value = other.from;
                                computedPropertyContext.update();
                                copyComputedProperties();
                                this.graph.copyPropertyToDrawable(core.get(k), drawable, k);
                            });
                            return new UndoableEvent(true, () => {
                                this.sync(() => {
                                    value.value = other.to;
                                    computedPropertyContext.update();
                                    copyComputedProperties();
                                    this.graph.copyPropertyToDrawable(core.get(k), drawable, k);
                                });
                                return undo.copy();
                            });
                        });

                        this.graph.changed.emit(undo);
                    }
                });
            });
        };

        this.drawableListener = (evt: PropertyChangedEvent<any>) => {
            const f = () => this.sync(() => {
                const result = this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                if (result) {
                    const previous = evt.detail.prev;
                    const current = JSON.parse(JSON.stringify(evt.detail.curr)); // TODO: this feels pretty bad...
                    const undo: UndoableEvent = new UndoableEvent(false, () => {
                        this.sync(() => {
                            (this.drawable as any)[evt.detail.key] = previous;
                            this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                        });
                        return new UndoableEvent(false, () => {
                            this.sync(() => {
                                (this.drawable as any)[evt.detail.key] = current;
                                this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                            });

                            return undo.copy();
                        });
                    });

                    this.graph.changed.emit(undo);
                }
            });

            f();
        };

        this.undeleted();
    };

    public undeleted() {
        console.log("undeleted");
        this.core.environment.listen(this.coreListener, () => true, this.core);
        this.drawable.addEventListener("change", this.drawableListener);
    }

    public deleted() {
        this.drawable.removeEventListener("change", this.drawableListener);
    }

    public sync(f: () => void) {
        if (this.isSyncing) return;
        this.isSyncing = true;
        f();
        this.isSyncing = false;
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