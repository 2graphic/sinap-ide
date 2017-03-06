export type Nodes = AndGate | OrGate | NotGate | InputGate | OutputGate;
export type Edges = Wire;
export type Graph = Circuit;

export class BasicGate {
    children: Wire[];
    parents: Wire[];
}

export class InputGate extends BasicGate {
    value: boolean;
}

export class OutputGate extends BasicGate {
    label: string;
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

export class State {
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

export function start(input: Circuit, other: string): string | State {
    const toVisit = getTraversalOrder(input);
    const values = new Map<BasicGate, boolean>();
    let result = "";

    function applyOp(node: BasicGate, op: (a: boolean, b: boolean) => boolean, init: boolean): boolean {
        return easyReduce(node.parents, (parent, current) => op(values.get(parent.source), current), init);
    }

    for (const node of toVisit) {
        if (node instanceof InputGate) {
            values.set(node, node.value);
        } else if (node instanceof AndGate) {
            values.set(node, applyOp(node, (a, b) => a && b, true));
        } else if (node instanceof OrGate) {
            values.set(node, applyOp(node, (a, b) => a || b, false));
        } else if (node instanceof NotGate) {
            values.set(node, !values.get(node.parents[0].source));
        } else if (node instanceof OutputGate) {
            const output = values.get(node.parents[0].source) ? true : false;
            result += `${node.label}:${output} `;
        } else {
            throw new Error(`Unknown type of node: ${Object.getPrototypeOf(node)}`);
        }
    }

    return result;
}

export function step(state: State): State | boolean {
    return true;
}
