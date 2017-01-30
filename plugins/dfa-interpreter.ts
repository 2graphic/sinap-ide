declare var Interpreter: any, InterpreterGraph: any, Program: any, ProgramInput: any, ProgramOutput: any, RunningProgram: any;
//import { Graph, Node, Edge } from "../app/models/plugin";

/* global interpret */

function isAccepted(node: any): boolean {
    return node['AcceptState'];
}

/**
 * This function compiles a DFA.
 */
export function interpret(graph: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let alphabet = new Set<string>();
        let acceptStates = [];
        var startState: Node | null = null;

        for (let edge of graph.edges) {
            let sym: string = edge.Label;
            if (sym.length != 1) {
                return reject("Symbols must be one character");
            }
            alphabet.add(sym);
        }

        for (let node of graph.nodes) {
            if (node["StartState"]) {
                if (startState != null) {
                    return reject("Too many start states.");
                }
                startState = node;
            }
            if (isAccepted(node)) {
                acceptStates.push(node);
            }
            let symbols = node.Children.map((edge: any) => edge.Label);
            let uniqueSymbols = new Set(symbols);
            if (symbols.length !== uniqueSymbols.size) {
                return reject("This interpreter does not handle NFAs. Non-unique edge label detected.");
            }
        }

        if (startState == null) {
            return reject("No start state.");
        } else if (acceptStates.length == 0) {
            return reject("No accept states.");
        }

        let alphabetString = [...alphabet.values()];
        alphabetString.sort();
        let compilationMessage = "Alphabet: " + alphabetString.join(" ");
        let messages: [string] = ["DFA", compilationMessage];
        return resolve(new DFAProgram(messages, startState));
    });
}

class DFAProgram {
    constructor(readonly compilationMessages: [string], private startState: Node) {
    }

    // TODO: Implement debugging.

    run(input: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let current: any = this.startState;
            for (const symbol of input) {
                // TODO: Maybe build a state table for each node for efficiency.
                let destinations = current.Children
                    .filter((edge: any) => edge.Label === input)
                    .map((edge: any) => edge.Destination);
                if (destinations.length == 1) {
                    current = destinations[0];
                    break;
                } else if (destinations.length == 0) {
                    return resolve(false);
                } else {
                    // TODO: Add support for NFA.
                    return reject("This is a DFA!");
                }
            }

            return resolve(true);
        });
    }
}
