import { Interpreter, InterpeterError } from '../services/plugin.service';
import { Graph } from '../models/core'


function coerceBoolean(s: any) {
    return !!s && s != "false" && s != "0" && s != "f" && s != "no";
}

export class DFAInterpreter implements Interpreter {

    transitions = new Map<number, Map<string, number>>();
    start_state: number
    accept_states: Set<number>
    error_message: InterpeterError | null = null;
    alphabet: Set<string> = new Set<string>();

    constructor(graph: Graph) {
        let nodes = [...graph.nodes];

        for (let edge of graph.edges) {
            let sym: string = edge.label;
            if (sym.length != 1) {
                this.error_message = new InterpeterError("Symbols must be one character");
                return
            }

            this.alphabet.add(sym);

            let src = nodes.indexOf(edge.drawableProperties.get("Source"));
            let dst = nodes.indexOf(edge.drawableProperties.get("Destination"));

            if (src == -1 || dst == -1) {
                this.error_message = new InterpeterError("Unknown node referenced");
                return;
            }

            let map2 = this.transitions.get(src);
            if (!map2) {
                map2 = new Map<string, number>();
                this.transitions.set(src, map2);
            }
            map2.set(sym, dst);
        }

        this.accept_states = new Set<number>();

        for (let n of nodes) {
            if (coerceBoolean(n.pluginProperties.get("Start State"))) {
                if (this.start_state != null) {
                    this.error_message = new InterpeterError("Too many start states");
                    return;
                }
                this.start_state = nodes.indexOf(n);
            }
            if (coerceBoolean(n.pluginProperties.get("Accept State"))) {
                this.accept_states.add(nodes.indexOf(n));
            }
        }
    }

    check(): null | InterpeterError {
        if (this.error_message) {
            return this.error_message;
        }
        if (this.start_state == null) {
            return new InterpeterError("No start state");
        }
        if (this.accept_states.size == 0) {
            return new InterpeterError("No accept states");
        }
        return null;
    }

    message(): string {
        let check = this.check();
        if (check) {
            return check.message;
        }
        let a = [...this.alphabet.values()]
        a.sort()

        return "Alphabet: " + a.join(" ");
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


    public run(input: String): boolean {
        return this.interpret(this.transitions, this.start_state, this.accept_states, input);
    }
}