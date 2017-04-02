export class Node {
    /** Start State */
    isStartState: boolean;
    /** Accept State */
    isAcceptState: boolean;
    children: Edge[];

    label: string;
}

export class Edge {
    onInput: string;
    onStack: string;
    writeStack: string;
    destination: Node;
}

export class Graph {
    nodes: Node[];
    emptyStack: string;
}

export type Nodes = Node;
export type Edges = Edge;

export class State {
    public active: Node[];
    public stacks: string = "";

    constructor(public activeStates: GeneralSet<ActiveState>,
        public inputLeft: string,
        public message: string) {
        this.active = [...activeStates.values()].map((s) => s.node);
        [...activeStates.values()].forEach((s) => {
            this.stacks += s.node.label + ": " + s.stack + "\n";
        });
    }
}

export class ActiveState {
    constructor(public node: Node, public stack: string) { };

    equals(other: ActiveState) {
        return this.node === other.node && this.stack === other.stack;
    };
}

export function start(input: Graph, data: string): State | boolean {
    const startStates = input.nodes.filter(n => n.isStartState);
    if (startStates.length === 0) {
        throw new Error("no start state");
    }
    if (!input.emptyStack || input.emptyStack.length === 0) {
        throw new Error("provide a symbol for empty stacks");
    }

    return new State(new GeneralSet(startStates.map((n) => new ActiveState(n, input.emptyStack))), data, "Starting...");
}

export function step(current: State): State | boolean {
    if (current.inputLeft === "") {
        return current.active.filter((n) => n.isAcceptState).length > 0;
    }

    let nextSymbol = current.inputLeft.charAt(0);
    let remainingInput = current.inputLeft.substring(1);

    const f = (activeStates: GeneralSet<ActiveState>, nextSymbol: string) => {
        const r = new GeneralSet<ActiveState>([]);

        [...activeStates.values()].forEach((s) => {
            let topOfStack = s.stack.charAt(0);

            s.node.children.forEach((e) => {
                if ((nextSymbol === e.onInput || (e.onInput === "" || e.onInput === undefined) && nextSymbol === "") && topOfStack === e.onStack) {
                    r.add(new ActiveState(e.destination, (e.writeStack ? e.writeStack : "") + s.stack.substring(1)));
                }
            });
        });

        return r;
    };

    // Make sure we follow any change of lambdas
    const nextStates = f(current.activeStates, nextSymbol);
    while (true) { // This can't be an infinite loop because the set of possible states is bounded
        const previousSize = nextStates.size;
        [...f(nextStates, "").values()].forEach((s) => nextStates.add(s));
        if (previousSize === nextStates.size) {
            break;
        }
    }


    if (nextStates.size === 0) {
        return false;
    }


    return new State(nextStates, remainingInput, nextStates.size + " active. Input: " + remainingInput);
}

interface Comparable<T> {
    equals(other: T): boolean;
}

class GeneralSet<T extends Comparable<T>> {
    private set: Set<T>;

    constructor(initial: T[]) {
        this.set = new Set();
        this[Symbol.iterator] = this.values;

        if (initial) {
            initial.forEach((i) => this.add(i));
        }
    }

    add(item: T) {
        if (![...this.set.values()].find((i) => item.equals(i))) {
            this.set.add(item);
        }
    }

    values() {
        return this.set.values();
    }

    get size() {
        return this.set.size;
    }
}