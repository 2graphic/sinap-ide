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
    inputIndex: number;
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

interface InputType {"a": boolean; "b": boolean; };

export class State {
    message: string;

    constructor(public toVisit: Nodes[], public output: Object, public active: Nodes, public value: boolean, public input: InputType) {
        this.message = toVisit.map((n) => n.label).join();
    }
}

function applyOp(node: BasicGate, op: (a: boolean, b: boolean) => boolean, init: boolean): boolean {
    return easyReduce(node.parents, (parent, current) => op(parent.source.getValue(), current), init);
}

export function start(start: Circuit, input: InputType): string | State {
    const toVisit = getTraversalOrder(start);
    const active = toVisit[0];
    active.setValue(input[active.label]);
    return new State(toVisit.slice(1), {}, active, active.getValue(), input);
}

export function step(state: State): Object | State {
    if (state.toVisit.length === 0) {
        return state.output;
    } else {
        let output = state.output;
        const node: BasicGate = state.toVisit[0];
        let result: boolean;

        if (node instanceof InputGate) {
            node.setValue(state.input[node.label]);
            result = node.getValue();
        } else if (node instanceof AndGate) {
            result = applyOp(node, (a, b) => a && b, true);
        } else if (node instanceof OrGate) {
            result = applyOp(node, (a, b) => a || b, false);
        } else if (node instanceof NotGate) {
            result = !node.parents[0].source.getValue();
        } else if (node instanceof OutputGate) {
            result = node.parents[0].source.getValue();
            output[node.label] = result;
        } else {
            throw new Error(`Unknown type of node: ${Object.getPrototypeOf(node)}`);
        }

        node.setValue(result);
        return new State(state.toVisit.slice(1), output, node, node.getValue(), state.input);
    }
}
