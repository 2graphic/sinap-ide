import { Injectable } from '@angular/core';
import { Program } from "../models/plugin"


import { remote } from 'electron';
const vm = remote.require('vm');

// TODO remove
export class NativeResult { };

export class Script {
    constructor(private nodeScript: { runInContext(ctx: Context): NativeResult }) {
    }

    // TODO: Make this run in a separate thread/process for performance.
    // `Promise<any>` appears to be toxic to TypeScript's type inference
    // and type engine in general. This forces an explicit case when you
    // use run in context, but allows type inference to mostly keep 
    // flowing
    runInContext(context: Context | Promise<Context>): Promise<NativeResult> {
        if (!(context instanceof Promise)) {
            context = Promise.resolve(context);
        }

        return context.then((ctx) => this.nodeScript.runInContext(ctx));
    }
}

// This is mainly for enforcement of types to make sure context is created correctly.
export interface Context {
    sinap: any;
}

@Injectable()
export class SandboxService {
    constructor() {
    }

    createContext(sandbox: any | null): Context {
        return vm.createContext(sandbox);
    }

    compileScript(code: string): Script {
        return new Script(new vm.Script(code));
    }
}