import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Type, ObjectType, CoreModel, Plugin, SerialJSO, loadPluginDir, Program, CoreValue } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { LocalFileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";


/**
 * The format of the program we get from core,
 * eventually we'll get this from core.
 */
// declare class IProgram {
//     constructor(graph: SerialJSO);
//     run(a: any): any;
// }

// declare type IOutput = { states: any, result: any, error?: any }

// /**
//  * Preferably each dynamically typed value from a plugin would come as a
//  * [Type, any] pair, which could then be wrapped up with an EventEmitter here.
//  */
// export class Value {
//     private _value: any;
//     public changed = new EventEmitter<any>();

//     constructor(public readonly type: string, value: any) {
//         this._value = value;
//     };

//     set value(v: any) {
//         this._value = v;
//         this.changed.emit(v);
//     }

//     get value() {
//         return this._value;
//     }
// }

export class Output {
    constructor(public readonly states: CoreValue[], public readonly result: CoreValue) { };
};

export function isOutput(o: any): o is Output {
    return o && o.states && o.result;
}

// export interface Program {
//     validate(): string[];
//     run(a: any): Output;
// }

// class WrappedProgram implements Program {
//     constructor(private program: IProgram) { };

//     validate(): string[] {
//         try {
//             this.run("");
//             return [];
//         } catch (e) {
//             return [e]
//         }
//     }

//     run(a: any): Output {
//         const output = this.program.run(a) as IOutput;

//         if (output.error) {
//             throw output.error;
//         }

//         let states = output.states.map((state: any) => {
//             return new Value("object", {
//                 active: new Value("node", state.active),
//                 inputLeft: new Value("string", state.inputLeft),
//                 message: new Value("string", state.message),
//             });
//         });

//         return new Output(states, new Value("boolean", output.result));
//     }
// }




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
