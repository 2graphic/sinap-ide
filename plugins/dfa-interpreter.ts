declare var Interpreter: any, InterpreterGraph: any, Program: any, ProgramInput: any, ProgramOutput: any, RunningProgram: any, Graph: any;

/* global interpret */

function coerceBoolean(s: any) {
    return !!s && s != "false" && s != "0" && s != "f" && s != "no";
}

/**
 * This function compiles a DFA.
 */
export function interpret(igraph: any): Promise<any> {
    return new Promise((resolve, reject) => {
    let graph = igraph.graph;
    let nodes = [...graph._nodes];
    let alphabet = new Set<string>();
    let transitions = new Map<number, Map<string, number>>();
    let accept_states = new Set<number>();

    var start_state: number | null = null;

    for (let edge of graph._edges) {
        let sym: string = edge.propertyValues['Label'];
        if (sym.length != 1) {
            reject("Symbols must be one character");
            return;
        }

        alphabet.add(sym);

        let src = nodes.indexOf(edge.drawableProperties.get("Source"));
        let dst = nodes.indexOf(edge.drawableProperties.get("Destination"));

        if (src == -1 || dst == -1) {
            return reject("Unknown node referenced");
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
        if (coerceBoolean(n.pluginProperties.get("Start State"))) {
            if (start_state != null) {
                reject("Too many start states.");
            }
            start_state = nodes.indexOf(n);
        }
        if (coerceBoolean(n.pluginProperties.get("Accept State"))) {
            accept_states.add(nodes.indexOf(n));
        }
    }

    if (start_state == null) {
        reject("No start state.");
        return;
    } else if (accept_states.size == 0) {
        reject("No accept states.");
        return;
    }

    let alphabetString = [...alphabet.values()];
    alphabetString.sort();
    let compilationMessage = "Alphabet: " + alphabetString.join(" ");
    let messages: [string] = ["DFA", compilationMessage];
    return new DFAProgram(messages, transitions, start_state, accept_states);
    });
}

class DFAProgram {
    constructor(readonly compilationMessages: [string],
        private transitions: Map<number, Map<string, number>>,
        private start_state: number,
        private accept_states: Set<number>) {
    }

    // TODO: Implement debugging.

    run(input: any): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(this.interpret(this.transitions, this.start_state, this.accept_states, input));
        });
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
