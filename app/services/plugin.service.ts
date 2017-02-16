import { Injectable, Inject } from '@angular/core';
import { Type, ObjectType, CoreModel, loadPlugin, Plugin } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { LocalFileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

@Injectable()
export class PluginService {
    private plugins = new Map<string, Plugin>();
    private programs = new Map<Plugin, Promise<Context>>();
    private getResults: Script;
    private addGraph: Script;
    // TODO: load from somewhere
    private pluginKinds = new Map([[MagicConstants.DFA_PLUGIN_KIND, "./plugins/dfa-interpreter.ts"]])

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
            throw "Plugin not installed";
        }
        plugin = loadPlugin(fileName);
        this.plugins.set(kind, plugin);
        return plugin;
    }

    public runProgram(plugin: Plugin, m: CoreModel, data: any) {
        let contextPromise = this.programs.get(plugin);
        if (contextPromise === undefined) {
            const script = this.sandboxService.compileScript(plugin.results.js);
            contextPromise = this.getProgram(script);
            this.programs.set(plugin, contextPromise);
        }

        const addGraph = this.sandboxService.compileScript(`
            sinap.graph = ${JSON.stringify(m.serialize())};
            sinap.result = undefined;
            sinap.error = undefined;
        `);

        contextPromise = contextPromise.then((context) => {
            return addGraph.runInContext(context).then((_) => {
                return context;
            });
        })

        return contextPromise.then<{ result: any, states: any[] }>((context) => {
            return this.sandboxService.compileScript(`
            try{
                sinap.results = global['plugin-stub'].run(global['plugin-stub'].deserialize(sinap.graph), ${JSON.stringify(data)});
            } catch (err) {
                sinap.error = err.toString();
            }`).runInContext(context).then(_ => {
                    if (context.sinap.error) {
                        throw context.sinap.error;
                    }
                    return context.sinap.results as { result: any, states: any[] };
                });
        });
    }

    private getProgram(script: Script): Promise<Context> {
        let context: Context = this.sandboxService.createContext({
            sinap: {
                error: undefined,
                results: undefined,
                graph: undefined,
            },
        });

        return script.runInContext(context).then((_) => context);
    }
}
