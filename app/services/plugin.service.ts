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

function arrayEquals<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
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

    public getPluginByKind(kind: string[]): Promise<Plugin> {
        return this.plugins.then((plugins) => {
            const matches = plugins.filter((plugin) => arrayEquals(kind, plugin.pluginKind));
            const pluginName = JSON.stringify(kind);
            if (matches.length === 0) {
                return Promise.reject(`Could not find a plugin with kind ${pluginName}`);
            } else if (matches.length > 1) {
                return Promise.reject(`Found multiple plugins matching kind ${pluginName}`);
            } else {
                return Promise.resolve<Plugin>(matches[0]);
            }
        });
    }

    public get pluginKinds(): Promise<string[][]> {
        return this.plugins.then((plugins) => {
            const result: string[][] = [];
            for (const plugin of plugins) {
                result.push(plugin.pluginKind);
            }
            return result;
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
