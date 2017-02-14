import * as sinap from "sinap";

export class DFANode {
	/** Accept State */
	isAcceptState: boolean;
	isStartState: boolean;
	children: DFAEdge[];
}

export class DFAEdge {
	/** Symbol */
	label: string;
	destination: DFANode;
}

export class DFAGraph {
    nodes: DFANode[];
    edges: DFAEdge[];
}

export type Nodes = DFANode
export type Edges = DFAEdge
export type Graph = DFAGraph


/**
 * This function compiles a DFA.
 */
export function compile(graph: DFAGraph): sinap.Program {
    let alphabet = new Set<string>();
    let acceptStates = [];
    var startState: DFANode | null = null;

    for (let edge of graph.edges) {
        let sym: string = edge.label;
        // if (!sym)
        //     throw "Sym is null.";
        if (sym.length != 1) {
            throw "Symbols must be one character";
        }
        alphabet.add(sym);
    }

    for (let node of graph.nodes) {
        if (node.isStartState) {
            if (startState != null) {
                throw "Too many start states.";
            }
            startState = node;
        }
        if (node.isAcceptState) {
            acceptStates.push(node);
        }
        let symbols = node.children.map((edge: DFAEdge) => edge.label);
        let uniqueSymbols = new Set(symbols);
        if (symbols.length !== uniqueSymbols.size) {
            throw "This interpreter does not handle NFAs. Non-unique edge label detected.";
        }
    }

    if (startState == null) {
        throw "No start state.";
    } else if (acceptStates.length == 0) {
        throw "No accept states.";
    }

    let alphabetString = [...alphabet.values()];
    alphabetString.sort();
    let compilationMessage = "Alphabet: " + alphabetString.join(" ");
    let messages: [string] = ["DFA", compilationMessage];

    return new Program(messages, startState);
}

export class Program implements sinap.Program {
    constructor(readonly compilationMessages: [string], private startState: DFANode) {
    }

    // TODO: Implement debugging.

    run(input: string): boolean {
        let current: DFANode = this.startState;
        for (const symbol of input) {
            // TODO: Maybe build a state table for each node for efficiency.
            const destinations = current.children
                .filter(edge => edge.label === symbol)
                .map(edge => edge.destination);
            if (destinations.length == 1) {
                current = destinations[0];
            } else if (destinations.length == 0) {
                return false;
            } else {
                // TODO: Add support for NFA.
                throw "This is a DFA!";
            }
        }
        return current.isAcceptState;
    }
}