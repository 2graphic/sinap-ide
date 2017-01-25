import { Injectable } from '@angular/core';
import { dfaInterpreter } from '../interpreters/dfa-interpreter';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import * as Type from "../types/types";
import * as Core from '../models/core'
import { Program, InterpreterError, InterpreterGraph } from "../models/plugin"

class ConcretePropertyList implements PropertyList {
    constructor(public properties: [string, Type.Type][], private backerObject: any) {

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
    constructor(public type: string, types: [string, Type.Type][]) {
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
            ["Start State", Type.Boolean],
            ["Accept State", Type.Boolean],
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

    private nodePluginDataHelper(type: string): [string, Type.Type][] {
        switch (type) {
            case "Input":
                return [["shape", Type.String]];
            case "Fully Connected":
                return [];
            case "Conv2D":
                return [["stride", Type.Point],
                ["output depth", Type.Number]];
            case "Max Pooling":
                return [["size", Type.Point]];
            case "Reshape":
                return [["shape", Type.String]];
            case "Output":
                return [];
            default:
                return [["beta", Type.Boolean]];
        }
    }

    edgePluginData(type: string) {
        return new PluginPropertyData("Edge", []);
    };

    // getNodeComputedProperties(): Array<[string, Type.Type, (entity: PropertiedEntity) => void]> {
    //     return [["Label", Type.String,
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

    // TODO: eventually this will be private
    public loadPluginTypeDefinitions(src: string)
        : { all: Map<string, Type.Type>, nodes: Type.Type[], edges: Type.Type[], graphs: Type.Type[] } {

        const scope = Type.parseScope(src);
        scope.validate();

        const nodes: Type.Type[] = [];
        const edges: Type.Type[] = [];
        const graphs: Type.Type[] = [];

        for (const value of scope.definitions.values()) {
            if (value.subtype(Type.Node)) {
                nodes.push(value);
            }
            if (value.subtype(Type.Edge)) {
                edges.push(value);
            }
            if (value.subtype(Type.Graph)) {
                graphs.push(value);
            }
        }

        if (nodes.length < 1) {
            nodes.push(Type.Node);
        }

        if (edges.length < 1) {
            edges.push(Type.Edge);
        }

        if (graphs.length < 1) {
            graphs.push(Type.Graph);
        }

        return { all: scope.definitions, nodes: nodes, edges: edges, graphs: graphs };
    }


    public getInterpreter(withGraph: Core.Graph): Program | InterpreterError {
        switch (withGraph.plugin.kind) {
            case "dfa.sinap.graph-kind":
                return dfaInterpreter(new InterpreterGraph(withGraph));
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
