import { Injectable } from '@angular/core';
import { dfaInterpreter } from '../interpreters/dfa-interpreter';

// TODO, reconsider this
import { Graph as GUIGraph} from '../models/graph'
import { PluginManagement } from "../components/tools-panel/tools-panel.component"
import { SinapType, SinapBoolean, SinapStructType, SinapColor, SinapNumber, SinapString } from "../models/types"
import { PropertiedEntity } from "../components/properties-panel/properties-panel.component"

export class PluginManager implements PluginManagement {

    public activeNodeType: string = "Input";
    public nodeTypes = ["Input", "Fully Connected", "Conv2D", "Max Pooling", "Reshape", "Output"];

    // machine-learning.sinap.graph-kind
    // dfa.sinap.graph-kind
    constructor(public kind: string) { }

    getNodeProperties(): Array<[string, SinapType]> {
        return [];
    }

    getEdgeProperties(): Array<[string, SinapType]> {
        return [];
    }

    getNodeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [];
    }

    getEdgeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [];
    }

    getEntityName(entityKind: string): string {
        return "Generic Entity";
    }
}

class DFAPluginManager extends PluginManager {
    getNodeProperties(): Array<[string, SinapType]> {
        return [["Accept State", SinapBoolean],
        ["Start State", SinapBoolean]];
    }

    getEdgeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [["Label", SinapString, (th) => (th as any)["Label"] = th.propertyValues["Symbol"]]];
    }

    getEdgeProperties(): Array<[string, SinapType]> {
        return [["Symbol", SinapString]];
    }

    getEntityName(entityKind: string): string {
        switch (entityKind) {
            case "Node":
                return "State";
            default:
                return "Graph";
        }
    }
}

class MachineLearningPluginManager extends PluginManager {
    getNodeProperties(): Array<[string, SinapType]> {
        switch (this.activeNodeType) {
            case "Input":
                return [["shape", SinapString]];
            case "Fully Connected":
                return [];
            case "Conv2D":
                return [["stride", new SinapStructType(new Map([["y", SinapNumber], ["x", SinapNumber]]))],
                ["output depth", SinapNumber]];
            case "Max Pooling":
                return [["size", new SinapStructType(new Map([["y", SinapNumber], ["x", SinapNumber]]))]];
            case "Reshape":
                return [["shape", SinapString]];
            case "Output":
                return [];
            default:
                return [["beta", SinapBoolean]];
        }
    }

    getEntityName(entityKind: string): string {
        switch (entityKind) {
            case "Node":
                return this.activeNodeType;
            default:
                return "Graph";
        }
    }

    getNodeComputedProperties(): Array<[string, SinapType, (entity: PropertiedEntity) => void]> {
        return [["Label", SinapString,
            (th: PropertiedEntity) => {
                let contentString = "";
                switch (th.entityName) {
                    case "Input":
                        contentString = "Shape: " + th.propertyValues["shape"];
                        break;
                    case "Output":
                    case "Fully Connected":
                        break;
                    case "Conv2D":
                        contentString = "Stride: (" + th.propertyValues["stride"].x + ", " + th.propertyValues["stride"].y + ")\nOutput Depth: " + th.propertyValues["output depth"];
                        break;
                    case "Max Pooling":
                        contentString = "Size: (" + th.propertyValues["size"].x + ", " + th.propertyValues["size"].y + ")";
                        break;
                    case "Reshape":
                        contentString = "Shape: " + th.propertyValues["shape"];
                        break;
                    default:
                        break;
                }

                return (th as any)["Label"] = th.entityName + "\n" + contentString;
            }]];
    }
}

@Injectable()
export class PluginService {
    constructor() { }

    public getInterpreter(withGraph: GUIGraph): Program | InterpreterError {
        switch (withGraph.pluginManager.kind) {
            case "dfa.sinap.graph-kind":
                return dfaInterpreter(new InterpreterGraph(withGraph));
            default:
                throw new Error("Unsupported Filetype");
        }
    }

    public getManager(kind: string) {
        if (kind == "machine-learning.sinap.graph-kind") {
            return new MachineLearningPluginManager(kind);
        } else if (kind == "dfa.sinap.graph-kind") {
            return new DFAPluginManager(kind);
        }

        throw new Error("Plugin Manager " + kind + " is not available.")
    }
}


export class InterpreterError {
    constructor(readonly message: string) {
    }
}

export type ProgramInput = string;
export type ProgramOutput = string | boolean;
export type Interpreter = (graph: InterpreterGraph) => Program | InterpreterError; 

/**
 * This interface is to be used for debugging support and is expected to maintain mutable state.
 */
export interface RunningProgram {
    /**
     * These are the properties that will be displayed to the user. TODO: Allow for this to be more flexible if there are large numbers of properties available.
     */
    debugProperties: [string];
    /**
     * Returns true if the program is done executing. While step() is undefined if true, properties may still be available.
     */
    isComplete: boolean;
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
    /**
     * Gets the result of the computation after the program completes. Behavior is undefined if called when isComplete is false.
     */
    getResult(): ProgramOutput;
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
    run(input: ProgramInput): ProgramOutput; // This should be filled in by fillInProgram if not present.
    /**
     * Creates a new debugging instance. While the returned instance may itself be mutable, this object should have no change in state. This method is optional.
     */
    initDebugging?(input: ProgramInput): RunningProgram; // This is completely optional and must be checked.
}

/**
 * This function attempts to fill in certain methods with reasonable defaults for a Program object. Specifically, it will use the initDebugging method to provide a run
 * method and will also provide a default compilation message. If all of these are already provided, the original Program is returned.
 */
function fillInProgram(program: any): Program | InterpreterError {
    let error = new InterpreterError("Program must have either a run method or debugging support.");

    if (!program.run && !program.initDebugging) {
        return error; 
    }

    if (!program.run) {
        program.run = (input: ProgramInput) => {
            if (program.initDebugging) {
                let debug = program.initDebugging(input);
                while(!debug.isComplete) {
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
}

/**
 * This class is still in progress. Presumably, the InterpreterGraph will have different needs from the GUIGraph. TODO: Actually make this different.
 */
export class InterpreterGraph {
    public constructor(readonly graph: GUIGraph) {
    }
}
