import { Interpreter, InterpreterGraph, Program, InterpreterError, ProgramInput, ProgramOutput, RunningProgram } from '../services/plugin.service';
import { Graph } from '../models/graph'


function coerceBoolean(s: any) {
    return !!s && s != "false" && s != "0" && s != "f" && s != "no";
}

/**
 * This function compiles a DFA.
 */
export function dfaInterpreter(igraph: InterpreterGraph): Program | InterpreterError {
    let graph = igraph.graph;
    let nodes = [...graph.nodes];
    let alphabet = new Set<string>();
    let transitions = new Map<number, Map<string, number>>();
    let accept_states = new Set<number>();

    var start_state: number | null = null;

    for (let edge of graph.edges) {
        let sym: string = edge.label;
        if (sym.length != 1) {
            return new InterpreterError("Symbols must be one character");
        }

        alphabet.add(sym);

        let src = nodes.indexOf(edge.propertyValues["Source"]);
        let dst = nodes.indexOf(edge.propertyValues["Destination"]);

        if (src == -1 || dst == -1) {
            return new InterpreterError("Unknown node referenced");
        }

        let map2 = transitions.get(src);
        if (!map2) {
            map2 = new Map<string, number>();
            transitions.set(src, map2);
        }
        map2.set(sym, dst);
    }

    accept_states = new Set<number>();

    for (let n of nodes) {
        if (coerceBoolean(n.propertyValues["Start State"])) {
            if (start_state != null) {
                return new InterpreterError("Too many start states.");
            }
            start_state = nodes.indexOf(n);
        }
        if (coerceBoolean(n.propertyValues["Accept State"])) {
            accept_states.add(nodes.indexOf(n));
        }
    }

    if (start_state == null) {
        return new InterpreterError("No start state.");
    } else if (accept_states.size == 0) {
        return new InterpreterError("No accept states.");
    }

    let alphabetString = [...alphabet.values()];
    alphabetString.sort();
    let compilationMessage = "Alphabet: " + alphabetString.join(" ");
    let messages: [string] = ["DFA", compilationMessage];
    return new DFAProgram(messages, transitions, start_state, accept_states);
}

export class DFAProgram implements Program {
    constructor(readonly compilationMessages: [string],
        private transitions: Map<number, Map<string, number>>,
        private start_state: number,
        private accept_states: Set<number>) {
    }

    // TODO: Implement debugging.

    run(input: ProgramInput): ProgramOutput {
        return this.interpret(this.transitions, this.start_state, this.accept_states, input);
    }

    interpret<Sym, Sta>(transitions: Map<Sta, Map<Sym, Sta>>,
        start_state: Sta,
        accept_states: Set<Sta>,
        input: Iterable<Sym>) {
        let state = start_state;
        for (const symbol of input) {
            let destinations = transitions.get(state);
            if (!destinations) {
                return false;
            }
            let state_maybe = destinations.get(symbol);
            if (!state_maybe) {
                return false;
            }
            state = state_maybe;
        }
        return accept_states.has(state);
    }
}
