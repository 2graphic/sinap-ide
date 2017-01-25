import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import * as Type from "../models/types";
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
                return [["stride", new Type.StructType(new Map([["y", Type.Number], ["x", Type.Number]]))],
                ["output depth", Type.Number]];
            case "Max Pooling":
                return [["size", new Type.StructType(new Map([["y", Type.Number], ["x", Type.Number]]))]];
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
    private interpreters: Map<string, Context> = new Map<string, Context>();
    private interpretCode: Script;
    private runInputCode: Script;

    constructor(@Inject(FileService) private fileService: FileService,
        @Inject(SandboxService) private sandboxService: SandboxService )
    {
        this.interpretCode = sandboxService.compileScript('sinap.__program = module.interpret(sinap.__graph)');
        // TODO: Make sure that there is nothing weird about the output returned from the plugin
        // (such as an infinite loop for toString). Maybe make sure that it is JSON only?
        this.runInputCode = sandboxService.compileScript('sinap.__program.then((program) => program.run(sinap.__input))');
    }

    public getInterpreter(withGraph: Core.Graph): Promise<Program> {
        let kind = withGraph.plugin.kind;
        let context = this.interpreters.get(kind);
        let graph = new Graph(withGraph);
        var result: Promise<Program>;

        let processContext = (context: any): Promise<Program> => {
            context.sinap.__graph = graph;
            console.log(context);
            return this.interpretCode.runInContext(context);
        };

        if (context) {
            result = processContext(context);
        } else {
            result = this.loadPlugin(kind, "./build/plugins/dfa-interpreter.js") // TODO: Put real file in here.
            .then((cont) => {
                context = cont;
                this.interpreters.set(kind, context);
                return processContext(context);
            });
        }

        return result.then((program) => {
            return {
                run: (input: ProgramInput): Promise<ProgramOutput> => {
                    (context as any).sinap.__input = input;
                    return this.runInputCode.runInContext(context as Context);
                }
            };
        });
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

    private loadPlugin(kind: string, interpreterFile: string): Promise<Context> {
        return this.fileService.readFile(interpreterFile)
        .then((text) => {
            let context = this.sandboxService.createContext({
                sinap: {
                    __program: null,
                    __graph: null,
                    __input: null
                },

                interpret: null
            });
            let script = this.sandboxService.compileScript(text);
            return script.runInContext(context)
            .then((_) => {
                return context;
            })
            .catch((err) => {
                console.log(err);
            });
        });
    }
}
