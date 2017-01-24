// File: math.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts


// Constants ///////////////////////////////////////////////////////////////////


/**
 * COS_150  
 *   Used in the rotation matrix for drawing edge arrows.
 */
export const COS_150: number = Math.cos(5 * Math.PI / 6);

/**
 * SIN_150  
 *   Used in the rotation matrix for drawing edge arrows.
 */
export const SIN_150: number = Math.sin(5 * Math.PI / 6);

/**
 * COS_22_5  
 *   Used in the rotation matrix for calculating edge loopback points.
 */
export const COS_22_5: number = Math.cos(Math.PI / 8);

/**
 * SIN_22_5  
 *   Used in the rotation matrix for calculating edge loopback points.
 */
export const SIN_22_5: number = Math.sin(Math.PI / 8);

/**
 * _5_3  
 *   5^3 used for calculating the midpoint of a cubic bezier curve.
 */
export const _5_3: number = 0.5 * 0.5 * 0.5;

/**
 * _5_2  
 *   5^2 used for calculating the midpoint of a quadratic bezier curve.
 */
export const _5_2: number = 0.5 * 0.5;


// Functions ///////////////////////////////////////////////////////////////////


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
