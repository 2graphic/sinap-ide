import { Injectable, Inject } from '@angular/core';

// TODO, reconsider this
import { Graph as GUIGraph} from "../models/graph"
import { PluginManagement } from "../components/tools-panel/tools-panel.component"
import { SinapType, SinapBoolean, SinapStructType, SinapColor, SinapNumber, SinapString } from "../models/types"
import { PropertiedEntity } from "../components/properties-panel/properties-panel.component"
import { Program, InterpreterGraph, Interpreter, ProgramInput, ProgramOutput } from "../models/plugin"
import { FileService } from "./files.service"
import { SandboxService, Script, Context } from "./sandbox.service"

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
        return [["Label", SinapString, (th) => (th as any)["Label"] = th.propertyValues["Symbol"]]];
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
                        contentString = "Shape: " + th.propertyValues["shape"];
                        break;
                    case "Output":
                    case "Fully Connected":
                        break;
                    case "Conv2D":
                        contentString = "Stride: (" + th.propertyValues["stride"].x + ", " + th.propertyValues["stride"].y + ")\nOutput Depth: " + th.propertyValues["output depth"];
                        break;
                    case "Max Pooling":
                        contentString = "Size: (" + th.propertyValues["size"].x + ", " + th.propertyValues["size"].y + ")";
                        break;
                    case "Reshape":
                        contentString = "Shape: " + th.propertyValues["shape"];
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
    private interpreters: Map<string, Context> = new Map<string, Context>();
    private interpretCode: Script;
    private runInputCode: Script;

    constructor(@Inject(FileService) private fileService: FileService, 
        @Inject(SandboxService) private sandboxService: SandboxService ) 
    {
        this.interpretCode = sandboxService.compileScript('sinap.__program = module.interpret(sinap.__graph)');
        // TODO: Make sure that there is nothing weird about the output returned from the plugin
        // (such as an infinite loop for toString). Maybe make sure that it is JSON only?
        this.runInputCode = sandboxService.compileScript('sinap.__program(sinap.__input)');
    }

    public getInterpreter(withGraph: GUIGraph): Promise<Program> {
        let kind = withGraph.pluginManager.kind;
        let context = this.interpreters.get(kind);
        let graph = new InterpreterGraph(withGraph);
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

    public getManager(kind: string) {
        if (kind == "machine-learning.sinap.graph-kind") {
            return new MachineLearningPluginManager(kind);
        } else if (kind == "dfa.sinap.graph-kind") {
            return new DFAPluginManager(kind);
        }

        throw new Error("Plugin Manager " + kind + " is not available.")
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
