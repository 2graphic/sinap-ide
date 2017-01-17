import { Injectable } from '@angular/core';
import { DFAInterpreter } from '../interpreters/dfa-interpreter';

import { SinapType, SinapBoolean, SinapStructType, SinapColor, SinapNumber, SinapString } from "../models/types"
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";
import * as Type from "../models/types";
import * as Core from '../models/core'

class ConcretePropertyList implements PropertyList {
    constructor(public properties: [string, Type.SinapType][], private backerObject: any) {

    }
    get(property: string) {
        return this.backerObject[property];
    }
    set(property: string, value: any) {
        this.backerObject[property] = value;
    }
}


class PluginPropertyData implements Core.PluginData {
    backer: any = {};
    propertyList: PropertyList;
    constructor(public type: string, types: [string, Type.SinapType][]) {
        this.propertyList = new ConcretePropertyList(types, this.backer);
    }
}

class DFAPlugin implements Core.Plugin {
    kind = "dfa.sinap.graph-kind";
    validator = {
        isValidEdge(t: string, src: string, dst: string) {
            return true;
        }
    }

    nodeTypes = ["DFA Node"];
    edgeTypes = ["DFA Edge"];

    graphPluginData() {
        return new PluginPropertyData("Graph", []);
    }
    nodePluginData(type: string) {
        return new PluginPropertyData(type, [
            ["Start State", SinapBoolean],
            ["Accept State", SinapBoolean],
        ]);
    }
    edgePluginData(type: string) {
        return new PluginPropertyData(type, []);
    };
}




class MLPlugin implements Core.Plugin {
    kind = "machine-learning.sinap.graph-kind";
    nodeTypes = ["Input", "Fully Connected", "Conv2D", "Max Pooling", "Reshape", "Output"];
    edgeTypes = ["Connection"];

    validator = {
        isValidEdge(t: string, src: string, dst: string) {
            return true;
        }
    }

    graphPluginData() {
        return new PluginPropertyData("Graph", []);
    }

    nodePluginData(type: string) {
        return new PluginPropertyData(type, this.nodePluginDataHelper(type));
    }

    private nodePluginDataHelper(type: string) : [string, SinapType][] {
        switch (type) {
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

    edgePluginData(type: string) {
        return new PluginPropertyData("Edge", []);
    };

    // getNodeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
    //     return [["Label", SinapString,
    //         (th: PropertiedEntity) => {
    //             let contentString = "";
    //             switch (th.entityName) {
    //                 case "Input":
    //                     contentString = "Shape: " + th.pluginProperties.get("shape");
    //                     break;
    //                 case "Output":
    //                 case "Fully Connected":
    //                     break;
    //                 case "Conv2D":
    //                     contentString = "Stride: (" + th.pluginProperties.get("stride").x + ", " + th.pluginProperties.get("stride").y + ")\nOutput Depth: " + th.pluginProperties.get("output depth");
    //                     break;
    //                 case "Max Pooling":
    //                     contentString = "Size: (" + th.pluginProperties.get("size").x + ", " + th.pluginProperties.get("size").y + ")";
    //                     break;
    //                 case "Reshape":
    //                     contentString = "Shape: " + th.pluginProperties.get("shape");
    //                     break;
    //                 default:
    //                     break;
    //             }

    //             return (th as any)["Label"] = th.entityName + "\n" + contentString;
    //         }]];
    // }
}

@Injectable()
export class PluginService {
    constructor() { }

    public getInterpreter(withGraph: Core.Graph): Interpreter {
        switch (withGraph.plugin.kind) {
            case "dfa.sinap.graph-kind":
                return new DFAInterpreter(withGraph);
            default:
                throw new Error("Unsupported Filetype");
        }
    }

    public getPlugin(kind: string) {
        switch (kind) {
            case "dfa.sinap.graph-kind":
                return new DFAPlugin();
            case "machine-learning.sinap.graph-kind":
                return new MLPlugin();
            default:
                throw new Error("Unsupported Filetype");
        }
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