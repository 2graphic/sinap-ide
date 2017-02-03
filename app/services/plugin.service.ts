import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import { Type, MetaType, ClassMetaType, parseScope } from "sinap-core";
import * as Core from '../models/core';
import { Object as SinapObject } from "../models/object";
import { Program, InterpreterError, Graph, ProgramInput, ProgramOutput } from "../models/plugin";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { FileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

// TODO:
// this file has a bunch of calls to 
// `instanceof` that could probably be encoded in the 
// type system


export class PluginPropertyData implements Core.PluginData {
    backer: any = {};
    object: SinapObject;
    constructor(public kind: string, t: ClassMetaType) {
        this.object = new SinapObject(t, this.backer);
    }
}

type Definitions = {
    all: Map<string, MetaType>,
    nodes: Map<string, ClassMetaType>,
    edges: Map<string, ClassMetaType>,
    graphs: Map<string, ClassMetaType>,
};

class Validator {
    plugin: ConcretePlugin;
    nodes = new Map<string, ClassMetaType>();
    edges = new Map<string, [ClassMetaType, ClassMetaType]>();

    constructor(definitions: Definitions) {
        this.nodes = definitions.nodes;

        for (const [edgeType, values] of definitions.edges.entries()) {
            const [st, dt] = [values.typeOf("source"), values.typeOf("destination")];
            if (!((st instanceof ClassMetaType) && (dt instanceof ClassMetaType))) {
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
    kind = MagicConstants.DFA_PLUGIN_KIND;

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
    // TODO: load from somewhere
    private pluginKinds = new Map([[MagicConstants.DFA_PLUGIN_KIND, { definitions: "./dfa-definition.sinapdef", interpreter: "./build/plugins/dfa-interpreter.js" }]])

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
        const val = this.pluginKinds.get(kind);

        if (!val) {
            throw "Unsupported Filetype";
        }

        const {definitions, interpreter} = val;

        let defintions = this.fileService.readFile(definitions)
            .then((s) => {
                return this.loadPluginTypeDefinitions(s);
            });
        let script = this.fileService.readFile(interpreter)
            .then((code) => this.sandboxService.compileScript(code));
        return Promise.all([defintions, script])
            .then(([def, scr]) => new ConcretePlugin(def, scr));
    }

    public loadPluginTypeDefinitions(src: string): Definitions {
        const scope = parseScope(src);
        scope.validate();

        const nodes: [string, ClassMetaType][] = [];
        const edges: [string, ClassMetaType][] = [];
        const graphs: [string, ClassMetaType][] = [];

        for (const [name, value] of scope.definitions.entries()) {
            if (value.subtype(Type.Node)) {
                nodes.push([name, value as ClassMetaType]);
            }
            if (value.subtype(Type.Edge)) {
                edges.push([name, value as ClassMetaType]);
            }
            if (value.subtype(Type.Graph)) {
                graphs.push([name, value as ClassMetaType]);
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