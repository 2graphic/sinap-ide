import { Injectable } from '@angular/core';

import { remote } from 'electron';
const vm = remote.require('vm');

export class Script {
    constructor(private nodeScript: any) {
    }

    // TODO: Make this run in a separate thread/process for performance.
    runInContext(context: Context): Promise<any> {
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