import { Interpreter, Graph } from './plugin.service';

export class DFAInterpreter implements Interpreter {
    private _graph: Graph;

    constructor(graph: Graph) {
        this._graph = graph;
    }

    public run(input: String):Boolean {
        return eval(String(input));
    }
}