import { Injectable } from '@angular/core';
import { DFAInterpreter } from './dfa-interpreter';

// TODO, reconsider this
import { Graph } from './graph'

@Injectable()
export class PluginService {
    constructor() {}

    public getInterpreter(forType:String, withGraph: Graph):Interpreter {
        switch (forType) {
            case "dfa":
                return new DFAInterpreter(withGraph);
            default:
                throw new Error("Unsupported Filetype");
        }
    }
}

export interface Interpreter {
    run(input: String):Boolean;
    check() : string;
}