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

type VariableMap = Map<string, Type.TypedVariable[]>;

class Validator {
    plugin: ConcretePlugin;
    nodes = new Map<string, Type.ClassType>();
    edges = new Map<string, [Type.ClassType, Type.ClassType]>();

    constructor(definitions: { all: Map<string, Type.Type>, nodes: VariableMap, edges: VariableMap, graphs: VariableMap }) {
        for (const node of definitions.nodes.keys()) {
            const val = definitions.all.get(node);
            if (!val || !(val instanceof Type.ClassType)) {
                // if this happened then something is super corrupt
                throw "this is basically impossible";
            }
            this.nodes.set(node, val);
        }
        for (const [edgeType, values] of definitions.edges.entries()) {
            const vm = new Map(values);
            this.edges.set(edgeType, [vm.get("Source"), vm.get("Destination")] as [Type.ClassType, Type.ClassType]);
        }
    }

    isValidEdge(t: string, src: string, dst: string): boolean {
        const edgets = this.edges.get(t);
        const srct = this.nodes.get(src);
        const dstt = this.nodes.get(dst);
        if (!edgets || !srct || !dstt) {
            throw "validator state error";
        }
        const [srce, dste] = edgets;
        return srct.subtype(srce) && dstt.subtype(dste);
    }
}

class ConcretePlugin implements Core.Plugin {
    kind = "dfa.sinap.graph-kind";

    get nodeTypes() {
        return this.definitions.nodes.keys();
    }
    get edgeTypes() {
        return this.definitions.nodes.keys();
    }

    nodeTypesRaw: Map<string, [string, Type.Type]>;
    edgeTypesRaw: Map<string, [string, Type.Type]>;
    graphTypesRaw: Map<string, [string, Type.Type]>;
    validator: Validator;

    constructor(private definitions: { all: Map<string, Type.Type>, nodes: VariableMap, edges: VariableMap, graphs: VariableMap },
        public context: Context) {
        this.validator = new Validator(definitions);
    }

    graphPluginData(type: string) {
        const types = this.definitions.graphs.get(type);
        if (!types) {
            throw "type not found";
        }
        return new PluginPropertyData(type, types);
    }
    nodePluginData(type: string) {
        const types = this.definitions.nodes.get(type);
        if (!types) {
            throw "type not found";
        }
        return new PluginPropertyData(type, types);
    }
    edgePluginData(type: string) {
        const types = this.definitions.edges.get(type);
        if (!types) {
            throw "type not found";
        }
        return new PluginPropertyData(type, types);
    };
}

@Injectable()
export class PluginService {
    private plugins = new Map<string, Promise<ConcretePlugin>>();
    private interpretCode: Script;
    private runInputCode: Script;

    constructor( @Inject(FileService) private fileService: FileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
        this.interpretCode = sandboxService.compileScript('sinap.__program = module.interpret(sinap.__graph)');
        // TODO: Make sure that there is nothing weird about the output returned from the plugin
        // (such as an infinite loop for toString). Maybe make sure that it is JSON only?
        this.runInputCode = sandboxService.compileScript('sinap.__program.then((program) => program.run(sinap.__input))');
    }

    public getInterpreter(graph: Core.Graph): Promise<Program> {
        if (!(graph.plugin instanceof ConcretePlugin)) {
            throw "Error: only get interpreters for graphs created with PluginService";
        }
        let context = graph.plugin.context;

        const g = new Graph(graph);

        console.log("expensive about to run");
        context.sinap.__graph = g;
        console.log("expensive ran");

        return this.interpretCode
            .runInContext(context)
            .then<Program>((program) => {
                return {
                    run: (input: ProgramInput): Promise<ProgramOutput> => {
                        context.sinap.__input = input;
                        return this.runInputCode.runInContext(context).then((res) => {
                            // TODO: insert check for correctness of output here. 
                            // cast for now
                            return res as ProgramOutput;
                        });
                    },
                    compilationMessages: [""]
                };
            });
    }

    public getPlugin(kind: string): Promise<ConcretePlugin> {
        const loadedPlugin = this.plugins.get(kind);
        if (loadedPlugin) {
            return loadedPlugin;
        }
        const plugin = this.makePlugin(kind);
        this.plugins.set(kind, plugin);
        return plugin;
    }

    public makePlugin(kind: string): Promise<ConcretePlugin> {
        switch (kind) {
            case "dfa.sinap.graph-kind":
                let defintions = this.fileService.readFile("./dfa-definition.sinapdef")
                    .then((s) => {
                        return this.loadPluginTypeDefinitions(s);
                    });
                let context = this.loadPlugin(kind, "./build/plugins/dfa-interpreter.js"); // TODO: Put real file in here.
                return Promise.all([defintions, context])
                    .then(([def, ctx]) => new ConcretePlugin(def, ctx));

            case "machine-learning.sinap.graph-kind":
                throw "ML NOT IMPLEMENTED YET";
            // break;
            default:
                throw "Unsupported Filetype";
        }
    }

    public loadPluginTypeDefinitions(src: string)
        : { all: Map<string, Type.Type>, nodes: VariableMap, edges: VariableMap, graphs: VariableMap } {

        const scope = Type.parseScope(src);
        scope.validate();

        const nodes: [string, Type.ClassType][] = [];
        const edges: [string, Type.ClassType][] = [];
        const graphs: [string, Type.ClassType][] = [];

        for (const [name, value] of scope.definitions.entries()) {
            if (value.subtype(Type.Node)) {
                nodes.push([name, value as Type.ClassType]);
            }
            if (value.subtype(Type.Edge)) {
                edges.push([name, value as Type.ClassType]);
            }
            if (value.subtype(Type.Graph)) {
                graphs.push([name, value as Type.ClassType]);
            }
        }

        if (nodes.length < 1) {
            nodes.push(["Default", Type.Node]);
        }

        if (edges.length < 1) {
            edges.push(["Default", Type.Edge]);
        }

        if (graphs.length < 1) {
            graphs.push(["Default", Type.Graph]);
        }

        const d = (n: [string, Type.ClassType][]) =>
            new Map(n.map(([n, t]) => [n, t.allFields()] as [string, [string, Type.Type][]]));

        return { all: scope.definitions, nodes: d(nodes), edges: d(edges), graphs: d(graphs) };
    }

    private loadPlugin(kind: string, interpreterFile: string): Promise<Context> {
        return this.fileService.readFile(interpreterFile)
            .then((text) => {
                let context: Context = this.sandboxService.createContext({
                    sinap: {
                        __program: null,
                        __graph: null,
                        __input: null
                    },

                    interpret: null
                });
                return this.sandboxService
                    .compileScript(text)
                    .runInContext(context)
                    .then<Context>((_) => {
                        return context;
                    });
            });
    }
}
