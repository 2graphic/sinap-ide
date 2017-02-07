import { Injectable } from '@angular/core';
import { Program } from "../models/plugin"


import { remote } from 'electron';
const vm = remote.require('vm');

interface ScriptLike {
    runInContext(context: Context): any;
}

// TODO: I'm half tempted to make either this generic or ScriptLike just use any.
export class Script implements ScriptLike {
    constructor(private nodeScript: ScriptLike) {
    }

    // TODO: Make this run in a separate thread/process for performance.
    // Even if Promise<any> messes with type inference, trying to hack around it just obfuscates code.
    runInContext(context: Context): Promise<any> {
        // It is generally bad form to accept a promise as input unless you can do work before you need that promise.
        return new Promise((resolve, reject) => {
            try {
                resolve(this.nodeScript.runInContext(context));
            } catch (err) {
                reject(err);
            }
        });
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