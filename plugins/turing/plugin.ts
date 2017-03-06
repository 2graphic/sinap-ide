export class Nodes {
    /** Start State */
    isStartState: boolean;
    /** Accept State */
    isAcceptState: boolean;
    children: Edges[];
}

export class Edges {
    read: string;
    write: string;
    move: "Right" | "Left";
    destination: Nodes;
}

export class Graph {
    nodes: Nodes[];
    blank: string;
}



export class Tape {
    data: string[];
    head: number;
    constructor(src: Iterable<string>, private blank: string) {
        this.data = [...src];
        this.head = 0;
    }

    atHead() {
        return this.data[this.head];
    }

    update(nv: string, dir: "Right" |  "Left") {
        this.data[this.head] = nv;
        this.head += dir === 'Left' ? -1 : 1;
        if (this.head === this.data.length) {
            this.data.push(this.blank);
        }
        if (this.head === -1) {
            this.data.unshift(this.blank);
            this.head = 0;
        }
    }

    copy() {
        const t = new Tape(this.data, this.blank);
        t.head = this.head;
        return t;
    }
}

export class State {
    get active() {
        return this.states[0][1];
    }
    constructor(public states: [Tape, Nodes][]) {
    }
}

export function start(input: Graph, data: string): State | boolean {
    const startStates = input.nodes.filter(n => n.isStartState);
    if (startStates.length === 0) {
        throw new Error("no start state");
    }

    return new State(startStates.map(n => [new Tape(data, input.blank), n] as [Tape, Nodes]));
}

export function step(current: State): State | boolean {
    if (current.states.length === 0) {
        return false;
    }

    const nextState = new State([]);

    for (const [tapeOriginal, node] of current.states) {
        if (node.isAcceptState) {
            return true;
        }

        const edges = node.children.filter(e => e.read === tapeOriginal.atHead());

        for (const edge of edges) {
            const tape = tapeOriginal.copy();
            tape.update(edge.write, edge.move);
            nextState.states.push([tape, edge.destination]);
        }
    }

    return nextState;
}