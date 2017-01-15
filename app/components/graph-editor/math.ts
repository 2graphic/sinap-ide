// File: math.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts


/**
 * dot  
 *   Calculates the dot product of two vectors.
 */
export function dot(a: number[], b: number[]): number {
    console.assert(
        a.length === b.length,
        "error dot: a and b must be of equal length."
    );
    let result = 0;
    for (let i = 0; i < a.length; i++)
        result += a[i] * b[i];
    return result;
}

/**
 * mag  
 *   Calculates the magnitude of a vector.
 */
export function mag(v: number[]): number {
    return Math.sqrt(dot(v, v));
}
