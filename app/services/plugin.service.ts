import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Type, ObjectType, CoreModel, Plugin, SerialJSO, loadPluginDir, Program, CoreValue } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { LocalFileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

type StubContext = { global: { "plugin-stub": { "Program": any } } };

// Similar to Promise.all. However, this will always resolve and ignore rejected promises.
function somePromises<T>(promises: Iterable<Promise<T>>): Promise<T[]> {
    let result: Promise<T[]> = Promise.resolve([]);

    for (const promise of promises) {
        result = result.then((arr) => {
            return promise.then((ele) => {
                arr.push(ele);
                return arr;
            }).catch((_) => {
                return arr;
            });
        });
    }

    return result;
}

@Injectable()
export class PluginService {
    readonly plugins: Promise<Plugin[]>;
    private programs = new Map<Plugin, Promise<StubContext>>();
    private getResults: Script;
    private addGraph: Script;

    constructor( @Inject(LocalFileService) private fileService: LocalFileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
        this.plugins = this.fileService.getAppLocations()
            .then((appLocations) => appLocations.pluginDirectory.getSubDirectories())
            .then((pluginDirectories) => {
                const pluginProms = pluginDirectories.map((pluginDir) => loadPluginDir(pluginDir, this.fileService));
                return somePromises(pluginProms);
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
