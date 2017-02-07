import * as Core from '../models/core';
import { Type, MetaType } from 'sinap-core';

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
export type Interpreter = (graph: any) => Promise<Program>;

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
    result: [any, MetaType] | null;
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
    getDebugValue(property: string): [any, MetaType];
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
    run(input: ProgramInput): Promise<ProgramOutput>; // This should be filled in by fillInProgram if not present.
    /**
     * Creates a new debugging instance. While the returned instance may itself be mutable, this object should have no change in state. This method is optional.
     */
    initDebugging?(input: ProgramInput): Promise<RunningProgram>; // This is completely optional and must be checked.
}

const conversions = new Map<MetaType, (a: any) => any>([
    [Type.Integer, Math.round],
    [Type.Number, Number],
    [Type.String, String],
    [Type.Boolean, Boolean],
    [Type.Color, String],
    [Type.Character, (a) => {
        a = String(a);
        if (a.length !== 1) {
            throw "Cannot coerce: Not a character";
        }
        return a;
    }],
]);

export function coerceIfPossible(a: any, t: MetaType) {
    const conversion = conversions.get(t);
    if (!conversion) {
        return a;
    } else {
        return conversion(a);
    }
}
