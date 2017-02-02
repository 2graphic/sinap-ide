import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import * as Type from "../types/types";
import * as Core from '../models/core';
import { Object as SinapObject } from "../models/object";
import { Program, InterpreterError, Graph, ProgramInput, ProgramOutput } from "../models/plugin";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { FileService } from "../services/files.service";

// TODO:
// this file has a bunch of calls to 
// `instanceof` that could probably be encoded in the 
// type system


export class PluginPropertyData implements Core.PluginData {
    backer: any = {};
    object: SinapObject;
    constructor(public kind: string, t: Type.ClassType) {
        this.object = new SinapObject(t, this.backer);
    }
}

type Definitions = { all: Map<string, Type.Type>, nodes: Map<string, Type.ClassType>, edges: Map<string, Type.ClassType>, graphs: Map<string, Type.ClassType> };

class Validator {
    plugin: ConcretePlugin;
    nodes = new Map<string, Type.ClassType>();
    edges = new Map<string, [Type.ClassType, Type.ClassType]>();

    constructor(definitions: Definitions) {
        this.nodes = definitions.nodes;

        for (const [edgeType, values] of definitions.edges.entries()) {
            const [st, dt] = [values.typeOf("source"), values.typeOf("destination")];
            if (!((st instanceof Type.ClassType) && (dt instanceof Type.ClassType))) {
                throw "Validator.constructor: inconsistancy error";
            }
            this.edges.set(edgeType, [st, dt]);
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

    validator: Validator;

    constructor(private definitions: Definitions, public script: Script) {
        this.validator = new Validator(definitions);
    }

    graphPluginData(kind: string) {
        const type = this.definitions.graphs.get(kind);
        if (!type) {
            throw "type not found";
        }
        return new PluginPropertyData(kind, type);
    }
    nodePluginData(kind: string) {
        const type = this.definitions.nodes.get(kind);
        if (!type) {
            throw "type not found";
        }
        return new PluginPropertyData(kind, type);
    }
    edgePluginData(kind: string) {
        const type = this.definitions.edges.get(kind);
        if (!type) {
            throw "type not found";
        }
        return new PluginPropertyData(kind, type);
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

        let context = this.addToContext(this.getContext(graph.plugin.script), "__graph", new Graph(graph));

        return this.interpretCode
            .runInContext(context)
            .then<Program>((program) => {
                return {
                    run: (input: ProgramInput): Promise<ProgramOutput> =>
                        this.runInputCode
                            .runInContext(this.addToContext(context, "__input", input)),
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
                let script = this.fileService.readFile("./build/plugins/dfa-interpreter.js") // TODO: Put real file in here.
                    .then((code) => this.sandboxService.compileScript(code));
                return Promise.all([defintions, script])
                    .then(([def, scr]) => new ConcretePlugin(def, scr));

            case "machine-learning.sinap.graph-kind":
                throw "ML NOT IMPLEMENTED YET";
            // break;
            default:
                throw "Unsupported Filetype";
        }
    }

    public loadPluginTypeDefinitions(src: string): Definitions {

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

        return { all: scope.definitions, nodes: new Map(nodes), edges: new Map(edges), graphs: new Map(graphs) };
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

        return script.runInContext(context).then((_) => context);
    }

    private addToContext(ctx: Promise<Context>, key: string, value: any) {
        return ctx.then((context) => {
            context.sinap[key] = value;
            return context;
        })
    }
}