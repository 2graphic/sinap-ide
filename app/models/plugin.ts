import * as Core from '../models/core'
import * as Type from '../models/types'

/**
 * Indicates an error during compilation of a graph. This is a class instead of an interface so that it can be discovered through instanceof.
 */
export class InterpreterError {
    constructor(readonly message: string) {
    }
}

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
export type Interpreter = (graph: Graph) => Promise<Program>;

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
    result: [any, Type.Type] | null;
    /**
     * Performs one unit of work in the forward direction. Advanced debugging support should be provided elsewhere (such as step over or continue).
     */
    step(): Promise<{ active: Element[], }>;
    /**
     * Performs one unit of work backwards. This method is optional since backwards debugging may be non-trivial for some plugins.
     */
    stepBack?(): Promise<void>;
    /**
     * Retrieves the value of a property enumerated in debugProperties.
     */
    getDebugValue(property: string): [any, Type.Type];
}

/**
 * This represents a compiled program given an input computation graph. It should be immutable, though the RunningProgram returned by initDebugging may be mutable itself.
 * If desired, a simple run method or initDebugging method can be provided and then fillInProgram will fill out the rest of the required fields/methods.
 */
export interface Program {
    /**
     * Any messages associated with graph compilation.
     */
    compilationMessages: [string];
    /**
     * Runs the input according to the graph this program was derived from.
     */
    run(input: ProgramInput): Promise<ProgramOutput>; // This should be filled in by fillInProgram if not present.
    /**
     * Creates a new debugging instance. While the returned instance may itself be mutable, this object should have no change in state. This method is optional.
     */
    initDebugging?(input: ProgramInput): Promise<RunningProgram>; // This is completely optional and must be checked.
}

/**
 * This function attempts to fill in certain methods with reasonable defaults for a Program object. Specifically, it will use the initDebugging method to provide a run
 * method and will also provide a default compilation message. If all of these are already provided, the original Program is returned.
 */
function fillInProgram(program: any): Promise<Program> {
    return new Promise((resolve, reject) => {
        let error = "Program must have either a run method or debugging support.";

        if (!program.run && !program.initDebugging) {
            return error;
        }

        if (!program.run) {
            program.run = (input: ProgramInput) => {
                if (program.initDebugging) {
                    let debug = program.initDebugging(input);
                    while (!debug.isComplete) {
                        debug.step();
                    }
                    return debug.getResult();
                } else {
                    return error;
                }
            }
        }

        if (!program.compilationMessages) {
            program.compilationMessages = ["Compiled graph successfully."];
        }
        return program;
    });
}

export interface Node {
    Label: string;
    Parents: Edge[];
    Children: Edge[];
    [propName: string]: any;
}

// TODO: Consider capitalization here after typechecker is built.
export interface Edge {
    Label: string;
    Source: Node;
    Destination: Node;
    [propName: string]: any;
}

/**
 * This class is the graph presented to the user. For convenience of reading this data structure, there are duplicate
 * and cyclical references. The constructor guarantees that these are consistent, but any changes after construction
 * should be done in a consistent fashion. TODO: Make mutator methods for plugins to utilize once mutation of the graph
 * during interpretation is added.
 */
export class Graph {
    nodes: Node[];
    edges: Edge[];
    public constructor(readonly graph: Core.Graph) {
        const nodes = new Map<Core.Node, Node>();
        for (const guiNode of graph.nodes) {
            let result: any = {
                Label: guiNode.label,
                Parents: [],
                Children: []
            };
            for (const [key, _] of guiNode.pluginProperties.properties) {
                const value = guiNode.pluginProperties.get(key);
                result[key] = value;
            }
            nodes.set(guiNode, result);
        }
        const getNode = (edge: Core.Edge, isSource: boolean): Node => {
            const guiNode = isSource ? edge.source : edge.destination;
            return nodes.get(guiNode) as Node;
        }

        const edges: Edge[] = graph.edges.map((guiEdge) => {
            let source = getNode(guiEdge, true);
            let dest = getNode(guiEdge, false);

            const result: any = {
                Label: guiEdge.label,
                Source: source,
                Destination: dest
            };

            for (const [key, _] of guiEdge.pluginProperties.properties) {
                const value = guiEdge.pluginProperties.get(key);
                result[key] = value;
            }

            source.Children.push(result);
            dest.Parents.push(result);
            return result;
        });

        this.nodes = [...nodes.values()];
        this.edges = edges;
        if (this.nodes.length > 0)
            console.log(this.nodes[0]['Start State']);
    }
}
