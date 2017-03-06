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

    update(nv: string, dir: "Right" | "Left") {
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

    toString() {
        let r = "... " + this.blank + " ";
        let i = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (i === this.head) {
                r += "[" + this.data[i] + "]";
            } else {
                r += " " + this.data[i] + " ";
            }
        }

        r += " " + this.blank + " ...";
        return r;
    }
}

export class State {
    active: Nodes;
    message: string;

    constructor(public states: [Tape, Nodes][]) {
        this.active = states[0][1];
        this.message = states[0][0].toString();
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
    const nextStates: [Tape, Nodes][] = [];

    for (const [tapeOriginal, node] of current.states) {
        if (node.isAcceptState) {
            return true;
        }

        const edges = node.children.filter(e => e.read === tapeOriginal.atHead());

        for (const edge of edges) {
            const tape = tapeOriginal.copy();
            tape.update(edge.write, edge.move);
            nextStates.push([tape, edge.destination]);
        }
    }

    if (nextStates.length === 0) {
        return false;
    }

    return new State(nextStates);
}