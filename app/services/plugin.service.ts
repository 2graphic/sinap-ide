import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Type, ObjectType, CoreModel, Plugin, SerialJSO, loadPluginDir, Program, CoreValue } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { LocalFileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

type StubContext = { global: { "plugin-stub": { "Program": any } } };

@Injectable()
export class PluginService {
    private plugins = new Map<string, Plugin>();
    private programs = new Map<Plugin, Promise<StubContext>>();
    private getResults: Script;
    private addGraph: Script;
    // TODO: load from somewhere
    private pluginKinds = new Map([[MagicConstants.DFA_PLUGIN_KIND, "./plugins/dfa"]]);

    constructor( @Inject(LocalFileService) private fileService: LocalFileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
    }

    public getPlugin(kind: string): Promise<Plugin> {
        let plugin = this.plugins.get(kind);
        if (plugin) {
            return Promise.resolve(plugin);
        }
        const directoryName = this.pluginKinds.get(kind);
        if (!directoryName) {
            throw new Error("No plugin installed that can open: " + kind);
        }

        return this.fileService.directoryByName(directoryName).then((directory) => {
            return loadPluginDir(directory, this.fileService).then((plugin) => {
                this.plugins.set(kind, plugin);
                return plugin;
            });
        });
    }

    public getProgram(plugin: Plugin, m: CoreModel): Promise<Program> {
        return this.getProgramContext(plugin).then((context) => {
            const programStub = new context.global['plugin-stub'].Program(m.serialize());
            return new Program(programStub, plugin);
        });
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
