import { Injectable } from '@angular/core';
import { DFAInterpreter } from '../interpreters/dfa-interpreter';

// TODO, reconsider this
import { Graph } from '../models/core'
import { PluginManagement } from "../components/tools-panel/tools-panel.component"
import { SinapType, SinapBoolean, SinapStructType, SinapColor, SinapNumber, SinapString } from "../models/types"
import { PropertiedEntity } from "../components/properties-panel/properties-panel.component"

export class PluginManager implements PluginManagement {

    public activeNodeType: string = "Input";
    public nodeTypes = ["Input", "Fully Connected", "Conv2D", "Max Pooling", "Reshape", "Output"];

    // machine-learning.sinap.graph-kind
    // dfa.sinap.graph-kind
    constructor(public kind: string) { }

    getNodeProperties(): Array<[string, SinapType]> {
        return [];
    }

    getEdgeProperties(): Array<[string, SinapType]> {
        return [];
    }

    getNodeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [];
    }

    getEdgeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [];
    }

    getEntityName(entityKind: string): string {
        return "Generic Entity";
    }
}

class DFAPluginManager extends PluginManager {
    getNodeProperties(): Array<[string, SinapType]> {
        return [["Accept State", SinapBoolean],
        ["Start State", SinapBoolean]];
    }

    getEdgeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [["Label", SinapString, (th) => (th as any)["Label"] = th.pluginProperties.get("Symbol")]];
    }

    getEdgeProperties(): Array<[string, SinapType]> {
        return [["Symbol", SinapString]];
    }

    getEntityName(entityKind: string): string {
        switch (entityKind) {
            case "Node":
                return "State";
            default:
                return "Graph";
        }
    }
}

class MachineLearningPluginManager extends PluginManager {
    getNodeProperties(): Array<[string, SinapType]> {
        switch (this.activeNodeType) {
            case "Input":
                return [["shape", SinapString]];
            case "Fully Connected":
                return [];
            case "Conv2D":
                return [["stride", new SinapStructType(new Map([["y", SinapNumber], ["x", SinapNumber]]))],
                ["output depth", SinapNumber]];
            case "Max Pooling":
                return [["size", new SinapStructType(new Map([["y", SinapNumber], ["x", SinapNumber]]))]];
            case "Reshape":
                return [["shape", SinapString]];
            case "Output":
                return [];
            default:
                return [["beta", SinapBoolean]];
        }
    }

    getEntityName(entityKind: string): string {
        switch (entityKind) {
            case "Node":
                return this.activeNodeType;
            default:
                return "Graph";
        }
    }

    getNodeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [["Label", SinapString,
            (th: PropertiedEntity) => {
                let contentString = "";
                switch (th.entityName) {
                    case "Input":
                        contentString = "Shape: " + th.pluginProperties.get("shape");
                        break;
                    case "Output":
                    case "Fully Connected":
                        break;
                    case "Conv2D":
                        contentString = "Stride: (" + th.pluginProperties.get("stride").x + ", " + th.pluginProperties.get("stride").y + ")\nOutput Depth: " + th.pluginProperties.get("output depth");
                        break;
                    case "Max Pooling":
                        contentString = "Size: (" + th.pluginProperties.get("size").x + ", " + th.pluginProperties.get("size").y + ")";
                        break;
                    case "Reshape":
                        contentString = "Shape: " + th.pluginProperties.get("shape");
                        break;
                    default:
                        break;
                }

                return (th as any)["Label"] = th.entityName + "\n" + contentString;
            }]];
    }
}

@Injectable()
export class PluginService {
    constructor() { }

    public getInterpreter(withGraph: Graph): Interpreter {
        // TODO: add back
        // switch (withGraph.pluginManager.kind) {
        //     case "dfa.sinap.graph-kind":
        return new DFAInterpreter(withGraph);
        //     default:
        //         throw new Error("Unsupported Filetype");
        // }
    }

    public getManager(kind: string) {
        if (kind == "machine-learning.sinap.graph-kind") {
            return new MachineLearningPluginManager(kind);
        } else if (kind == "dfa.sinap.graph-kind") {
            return new DFAPluginManager(kind);
        }

        throw new Error("Plugin Manager " + kind + " is not available.")
    }
}


export class Error {
    constructor(public message: string) { }
}
export class InterpeterError extends Error {
}

export interface Interpreter {
    run(input: String): boolean;
    message(): string;
    check(): InterpeterError | null;
}