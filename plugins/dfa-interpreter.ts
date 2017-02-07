/**
 * Types which can be used for program input.
 */
export type ProgramInput = string;
/**
 * Types which can be used for program output.
 */
export type ProgramOutput = string | boolean;
/**
 * Represents a function which converts graphs into programs or else returns an error that has toString.
 */
export type Interpreter = (graph: Graph) => Program;

/**
 * This interface is to be used for debugging support and is expected to maintain mutable state.
 */
export interface RunningProgram {
    /**
     * These are the properties that will be displayed to the user. TODO: Allow for this to be more flexible if there are large numbers of properties available.
     */
    debugProperties: [string];

    /**
     * Gets the result of the computation after the program completes. Behavior is undefined if called when isComplete is false.
     */
    result: ProgramOutput | null;

    /**
     * Performs one unit of work in the forward direction. Advanced debugging support should be provided elsewhere (such as step over or continue).
     */
    step(): void;

    /**
     * Performs one unit of work backwards. This method is optional since backwards debugging may be non-trivial for some plugins.
     */
    stepBack?(): void;

    /**
     * Retrieves the value of a property enumerated in debugProperties.
     */
    getDebugValue(property: string): ProgramOutput;
}

/**
 * This represents a compiled program given an input computation graph. It should be immutable, though the RunningProgram returned by initDebugging may be mutable itself.
 * If desired, a simple run method or initDebugging method can be provided and then fillInProgram will fill out the rest of the required fields/methods.
 */
export interface Program {
    /**
     * Any messages associated with graph compilation.
     */
    compilationMessages: string[];

    /**
     * Runs the input according to the graph this program was derived from.
     */
    run(input: ProgramInput): ProgramOutput; // This should be filled in by fillInProgram if not present.

    /**
     * Creates a new debugging instance. While the returned instance may itself be mutable, this object should have no change in state. This method is optional.
     */
    initDebugging?(input: ProgramInput): RunningProgram; // This is completely optional and must be checked.
}

interface PropertyObject {
    [propName: string]: any;
}

interface Element extends PropertyObject {
    label: string;
}

interface Node extends Element {
    parents: Edge[];
    children: Edge[];
}

// TODO: Consider capitalization here after typechecker is built.
interface Edge extends Element {
    source: Node;
    destination: Node;
}

function transferProperties(source: any, destination: PropertyObject) {
    const propSet = source.pluginProperties;
    for (const propName in propSet) {
        destination[propName] = propSet[propName];
    }
}

/**
 * This class is the graph presented to the user. For convenience of reading this data structure, there are duplicate
 * and cyclical references. The constructor guarantees that these are consistent, but any changes after construction
 * should be done in a consistent fashion. TODO: Make mutator methods for plugins to utilize once mutation of the graph
 * during interpretation is added.
 */
class Graph implements PropertyObject {
    nodes: Node[];
    edges: Edge[];
    public constructor(serialGraph: any) {
        serialGraph = serialGraph.graph;
        transferProperties(serialGraph, this);

        this.nodes = serialGraph.nodes.map((oldNode: any) => {
            const result: Node = {
                label: oldNode.drawableProperties.Label,
                parents: [],
                children: []
            };
            transferProperties(oldNode, result);
            return result;
        });

        // This seems like duplicate code but I'm not sure how to clean it up and combine it with the code above.
        this.edges = serialGraph.edges.map((oldEdge: any) => {
            const source = this.nodes[oldEdge.source];
            const destination = this.nodes[oldEdge.destination];

            const result: Edge = {
                label: oldEdge.pluginProperties.Symbol,
                source: source,
                destination: destination
            };

            transferProperties(oldEdge, result);

            source.children.push(result);
            destination.parents.push(result);
            return result;
        });
    }
}

/**
 * This function compiles a DFA.
 */
export function interpret(serialGraph: any): Program {
    let graph = new Graph(serialGraph);
    let alphabet = new Set<string>();
    let acceptStates = [];
    var startState: Node | null = null;

    for (let edge of graph.edges) {
        let sym: string = edge.label;
        // if (!sym)
        //     throw "Sym is null.";
        if (sym.length != 1) {
            throw "Symbols must be one character";
        }
        alphabet.add(sym);
    }

    for (let node of graph.nodes) {
        if (node['Start State']) {
            if (startState != null) {
                throw "Too many start states.";
            }
            startState = node;
        }
        if (node['Accept State']) {
            acceptStates.push(node);
        }
        let symbols = node.children.map((edge: Edge) => edge.label);
        let uniqueSymbols = new Set(symbols);
        if (symbols.length !== uniqueSymbols.size) {
            throw "This interpreter does not handle NFAs. Non-unique edge label detected.";
        }
    }

    if (startState == null) {
        throw "No start state.";
    } else if (acceptStates.length == 0) {
        throw "No accept states.";
    }

    let alphabetString = [...alphabet.values()];
    alphabetString.sort();
    let compilationMessage = "Alphabet: " + alphabetString.join(" ");
    let messages: [string] = ["DFA", compilationMessage];

    return new DFAProgram(messages, startState);
}

export class DFAProgram implements Program {
    constructor(readonly compilationMessages: [string], private startState: Node) {
    }

    // TODO: Implement debugging.

    run(input: string): boolean {
        let current: Node = this.startState;
        for (const symbol of input) {
            // TODO: Maybe build a state table for each node for efficiency.
            const destinations = current.children
                .filter(edge => edge.label === symbol)
                .map(edge => edge.destination);
            if (destinations.length == 1) {
                current = destinations[0];
            } else if (destinations.length == 0) {
                return false;
            } else {
                // TODO: Add support for NFA.
                throw "This is a DFA!";
            }
        }
        return current['Accept State'];
    }
}
