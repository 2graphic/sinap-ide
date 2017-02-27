import { Injectable, Inject } from '@angular/core';
import { Type, ObjectType, CoreModel, loadPlugin, Plugin, SerialJSO } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { LocalFileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

declare class IProgram {
    constructor(graph: SerialJSO);
    run(a: any): any;
}

declare class IOutput {
    states?: any;
    result?: any;
    error?: any;
}

export declare class Output {
    states: any;
    result: any;
};

export interface Program {
    validate(): string[];
    run(a: any): Output;
}

class WrappedProgram implements Program {
    constructor(private program: IProgram) { };

    validate(): string[] {
        try {
            this.run("");
            return [];
        } catch (e) {
            return [e];
        }
    }

    run(a: any): Output {
        const output = this.program.run(a) as IOutput;

        if (output.error) {
            throw output.error;
        }

        return output as Output;
    }
}

type StubContext = { global: { "plugin-stub": { "Program": typeof IProgram } } };

@Injectable()
export class PluginService {
    private plugins = new Map<string, Plugin>();
    private programs = new Map<Plugin, Promise<StubContext>>();
    private getResults: Script;
    private addGraph: Script;
    // TODO: load from somewhere
    private pluginKinds = new Map([[MagicConstants.DFA_PLUGIN_KIND, "./plugins/dfa-interpreter.ts"]]);

    constructor( @Inject(LocalFileService) private fileService: LocalFileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
    }

    public getPlugin(kind: string) {
        let plugin = this.plugins.get(kind);
        if (plugin) {
            return plugin;
        }
        const fileName = this.pluginKinds.get(kind);
        if (!fileName) {
            throw new Error("No plugin installed that can open: " + kind);
        }
        plugin = loadPlugin(fileName);
        this.plugins.set(kind, plugin);
        return plugin;
    }

    public getProgram(plugin: Plugin, m: CoreModel): Promise<Program> {
        return this.getProgramContext(plugin).then(
            context => new WrappedProgram(new context.global['plugin-stub'].Program(m.serialize())));
    }

    private getProgramContext(plugin: Plugin) {
        let contextPromise = this.programs.get(plugin);
        if (contextPromise === undefined) {
            const script = this.sandboxService.compileScript(plugin.results.js);
            contextPromise = this.makeProgramContext(script);
            this.programs.set(plugin, contextPromise);
        }
        return contextPromise;
    }

    private makeProgramContext(script: Script): Promise<StubContext> {
        let context: Context = this.sandboxService.createContext({
            global: { "plugin-stub": { "Program": null } }
        });
        return script.runInContext(context).then((_) => context);
    }
}
