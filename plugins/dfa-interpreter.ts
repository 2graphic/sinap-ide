export class DFANode {
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

export type Nodes = DFANode
export type Edges = DFAEdge
export type Graph = DFAGraph

export class State {
    constructor(public active: DFANode,
        public inputLeft: string,
        public message: string) {

    }
}

export function start(input: DFAGraph, data: string): State | boolean {
    for (const node of input.nodes){
        if (node.isStartState){
            return new State(node, data, "starting");
        }
    }
    throw "no start state";
}

export function step(current: State): State | boolean {
    if (current.inputLeft.length === 0) {
        return current.active.isAcceptState;
    }
    const destinations = current.active.children
        .filter(edge => edge.label === current.inputLeft[0])
        .map(edge => edge.destination);

    if (destinations.length == 1) {
        return new State(destinations[0], current.inputLeft.substr(1),
            `transitioning from ${current.active.label} to ${destinations[0].label}`);
    } else if (destinations.length == 0) {
        return false;
    } else {
        throw "This is a DFA!";
    }
}