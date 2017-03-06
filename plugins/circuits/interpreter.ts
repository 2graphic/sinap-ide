export type Nodes = AndGate | OrGate | NotGate | InputGate | OutputGate;
export type Edges = Wire;
export type Graph = Circuit;

export class BasicGate {
    children: Wire[];
    parents: Wire[];
    label: string;
    protected value: boolean;
    getValue(): boolean {
        return this.value;
    }
    setValue(value: boolean) {
        this.value = value;
    }
}

export class InputGate extends BasicGate {
    public value: boolean;
}

export class OutputGate extends BasicGate {
}

export class AndGate extends BasicGate {
}

export class OrGate extends BasicGate {
}

export class NotGate extends BasicGate {
}

export class Wire {
    source: Nodes;
    destination: Nodes;
}

export class Circuit {
    nodes: Nodes[];
}

function getTraversalOrder(circuit: Circuit): BasicGate[] {
    const visited = new Set<BasicGate>();
    const result: BasicGate[] = [];

    function helper(toVisit: BasicGate) {
        if (!visited.has(toVisit)) {
            visited.add(toVisit);
            for (const parent of toVisit.parents) {
                helper(parent.source);
            }
            result.push(toVisit);
        }
    }

    for (const node of circuit.nodes) {
        helper(node);
    }

    return result;
}

function easyReduce<T, R>(arr: T[], func: (current: T, result: R) => R, initial: R) {
    let result = initial;
    for (const ele of arr) {
        result = func(ele, result);
    }
    return result;
}

export class State {
    constructor(public toVisit: Nodes[], public output: string, public active: Nodes, public value: boolean) {
    }
}

function applyOp(node: BasicGate, op: (a: boolean, b: boolean) => boolean, init: boolean): boolean {
    return easyReduce(node.parents, (parent, current) => op(parent.source.getValue(), current), init);
}

export function start(input: Circuit, other: string): string | State {
    const toVisit = getTraversalOrder(input);
    return new State(toVisit.slice(1), "", toVisit[0], false);
}

export function step(state: State): State | string {
    if (state.toVisit.length === 0) {
        return state.output;
    } else {
        let output = state.output;
        const node: BasicGate = state.toVisit[0];
        let result: boolean;

        if (node instanceof InputGate) {
            result = node.value;
        } else if (node instanceof AndGate) {
            result = applyOp(node, (a, b) => a && b, true);
        } else if (node instanceof OrGate) {
            result = applyOp(node, (a, b) => a || b, false);
        } else if (node instanceof NotGate) {
            result = !node.parents[0].source.getValue();
        } else if (node instanceof OutputGate) {
            result = node.parents[0].source.getValue();
            output += `${node.label}:${result} `;
        } else {
            throw new Error(`Unknown type of node: ${Object.getPrototypeOf(node)}`);
        }

        node.setValue(result);
        return new State(state.toVisit.slice(1), output, node, node.getValue());
    }
}
