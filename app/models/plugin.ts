import { Graph as GUIGraph} from '../models/graph'
import * as Type from "./types"
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
export type Interpreter = (graph: InterpreterGraph) => Promise<Program>; 

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
    result: [any, Type.SinapType] | null;
    /**
     * Performs one unit of work in the forward direction. Advanced debugging support should be provided elsewhere (such as step over or continue).
     */
    step(): Promise<{active: Element[], }>;
    /**
     * Performs one unit of work backwards. This method is optional since backwards debugging may be non-trivial for some plugins.
     */
    stepBack?(): Promise<void>;
    /**
     * Retrieves the value of a property enumerated in debugProperties.
     */
    getDebugValue(property: string): [any, Type.SinapType];
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
    });
}

/**
 * This class is still in progress. Presumably, the InterpreterGraph will have different needs from the GUIGraph. TODO: Actually make this different.
 */
export class InterpreterGraph {
    public constructor(readonly graph: GUIGraph) {
    }
}
