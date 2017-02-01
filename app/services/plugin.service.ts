import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import * as Type from "../types/types";
import * as Core from '../models/core'
import { Program, InterpreterError, Graph, ProgramInput, ProgramOutput } from "../models/plugin"
import { Context, SandboxService, Script } from "../services/sandbox.service"
import { FileService } from "../services/files.service"

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

class ConcretePlugin implements Core.Plugin {
    kind = "dfa.sinap.graph-kind";
    script: Promise<Script>;

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
    private interpretCode: Script;
    private runInputCode: Script;
    private plugins: Map<string, ConcretePlugin> = new Map<string, ConcretePlugin>();

    constructor( @Inject(FileService) private fileService: FileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
        this.interpretCode = sandboxService.compileScript('sinap.__program = module.interpret(sinap.__graph)');
        // TODO: Make sure that there is nothing weird about the output returned from the plugin
        // (such as an infinite loop for toString). Maybe make sure that it is JSON only?
        this.runInputCode = sandboxService.compileScript('sinap.__program.then((program) => program.run(sinap.__input))');
    }

    public getInterpreter(graph: Core.Graph): Promise<Program> {
        // TODO: consider: this could really just be a cast and 
        // graph.plugin.context
        let context: Promise<Context> = this.getPlugin(graph.plugin.kind).script.then((script) => this.getContext(script));
        return context.then((context: Context): Promise<Program> => {
            context.sinap.__graph = new Graph(graph);
            return this.interpretCode
                .runInContext(context)
                .then((program) => {
                    return {
                        run: (input: ProgramInput): Promise<ProgramOutput> => {
                            context.sinap.__input = input;
                            // Cast is necessary. 
                            // I prefer forcing it to be explicit (and thus not any)
                            return this.runInputCode.runInContext(context) as Promise<ProgramOutput>;
                        },
                        compilationMessages: [""]
                    };
                });
        });
    }

    public getPlugin(kind: string): ConcretePlugin {
        // TODO: Figure out how to cache this without bad performance.
        const result = this.plugins.get(kind);
        if (result) {
            return result;
        } else {
            const newPlugin = this.makePlugin(kind);
            this.plugins.set(kind, newPlugin);
            return newPlugin;
        }
    }

    private makePlugin(kind: string): ConcretePlugin {
        switch (kind) {
            case "dfa.sinap.graph-kind":
                const plugin = new ConcretePlugin();
                plugin.script = this.fileService.readFile("./build/plugins/dfa-interpreter.js")// TODO: Put real file in here.
                    .then((code: string) => this.sandboxService.compileScript(code));
                return plugin;
            case "machine-learning.sinap.graph-kind":
                throw "ML NOT IMPLEMENTED YET";
            // break;
            default:
                throw "Unsupported Filetype";
        }
    }

    private getContext(script: Script): Promise<Context> {
        let context: Context = this.sandboxService.createContext({
            sinap: {
                __program: null,
                __graph: null,
                __input: null
            },

            interpret: null
        });

        return new Promise<Context>((resolve, reject) => {
            return script.runInContext(context).then((_) => resolve(context));
        });
    }
}
