export class NFANode {
    isStartState: boolean;
    /** Accept State */
    isAcceptState: boolean;
    children: NFAEdge[];
    label: string;
}

export class NFAEdge {
    /** Symbol */
    label: string;
    destination: NFANode;
}

export class NFAGraph {
    nodes: NFANode[];
    // startState: NFANode;
}

export type Nodes = NFANode;
export type Edges = NFAEdge;
export type Graph = NFAGraph;

export class State {
    constructor(public active: NFANode[],
        public inputLeft: string) {

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

export function start(input: NFAGraph, data: string): State | boolean {
    let start: NFANode | null = null;
    const accepts = new Set<NFANode>();

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
                if (edge.label.length > 1) {
                    throw new Error("Edge " + edge.label + " must be one symbol");
                }
                transitions.add(edge.label);
            }
        }
    }

    if (!start) {
        throw new Error("Must have one start state");
    }
    if (accepts.size === 0) {
        throw new Error("Must have at least one accept state");
    }

    return new State([start], data);
}

export function step(current: State): State | boolean {
    if (current.inputLeft.length === 0) {
        return current.active.reduce((a, b) => b.isAcceptState === true || a, false);
    }
    const destinations = current.active.reduce((dests, a) => dests.concat(a.children), [] as NFAEdge[])
        .filter(edge => edge.label === current.inputLeft[0])
        .map(edge => edge.destination);

    if (destinations.length === 0) {
        return false;
    } else {
        return new State(destinations, current.inputLeft.substr(1));
    }
}