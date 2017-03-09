export class DFANode {
    /** Start State */
    isStartState: boolean;
    /** Accept State */
    isAcceptState: boolean;
    children: DFAEdge[];
    label: string;
}

export class DFAEdge {
    /** Symbol */
    label: string;
    destination: DFANode;
}

export class DFAGraph {
    nodes: DFANode[];
    // startState: DFANode;
}

export type Nodes = DFANode;
export type Edges = DFAEdge;
export type Graph = DFAGraph;

export class State {
    constructor(public active: DFANode,
        public inputLeft: string,
        public message: string) {

    }
}

function isEmpty(label?: string) {
    if (label !== undefined) {
        if (label !== "") {
            return false;
        }
    }

    return true;
}

export function start(input: DFAGraph, data: string): State | boolean {
    let start: DFANode | null = null;
    const accepts = new Set<DFANode>();

    for (const node of input.nodes) {
        if (node.isStartState) {
            if (!start) {
                start = node;
            } else {
                throw new Error("Only one start state allowed");
            }
        }

        if (node.isAcceptState) {
            accepts.add(node);
        }

        if (node.children) {
            let transitions = new Set<string>();
                for (const edge of node.children) {
                    if (isEmpty(edge.label)) {
                        throw new Error("Lambda transition from " + node.label + " to " + edge.destination.label + " is not allowed");
                    }
                    if (edge.label.length > 1) {
                        throw new Error("Edge " + edge.label + " must be one symbol");
                    }
                    if (transitions.has(edge.label)) {
                        throw new Error("Nondeterministic edge " + edge.label + (isEmpty(node.label) ? "" : (" from node: " + node.label)));
                    }
                    transitions.add(edge.label);
                }
        }
    }

    if (!start) {
        throw new Error("Must have one start state");
    }

    return new State(start, data, "starting");
}

export function step(current: State): State | boolean {
    if (current.inputLeft.length === 0) {
        return current.active.isAcceptState === true;
    }
    const destinations = current.active.children
        .filter(edge => edge.label === current.inputLeft[0])
        .map(edge => edge.destination);

    if (destinations.length === 1) {
        return new State(destinations[0], current.inputLeft.substr(1),
            `transitioning from ${current.active.label} to ${destinations[0].label}`);
    } else if (destinations.length === 0) {
        return false;
    } else {
        throw "This is a DFA!";
    }
}