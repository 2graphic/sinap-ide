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

function getTraversalOrder(circuit: Circuit): BasicGate[] {
    const visited = new Set<BasicGate>();
    const result: BasicGate[] = [];

    function helper(toVisit: BasicGate) {
        if (!visited.has(toVisit)) {
            visited.add(toVisit);
            for (const child of toVisit.children) {
                helper(child.destination);
            }
            result.push(toVisit);
        }
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

export function start(input: Circuit, other: string): boolean | string {
    const toVisit = getTraversalOrder(input);
    const values = new Map<BasicGate, boolean>();

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
            return values.get(node.parents[0].source);
        }
    }
}
