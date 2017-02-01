// File: math.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts


// Imports /////////////////////////////////////////////////////////////////////


import { point } from "./canvas";


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


// Functions ///////////////////////////////////////////////////////////////////


/**
 * dot  
 *   Calculates the dot product of two points.
 */
export function dot(a: point, b: point): number {
    return a.x * b.x + a.y * b.y;
}

/**
 * mag  
 *   Calculates the magnitude of a point.
 */
export function mag(v: point): number {
    return Math.sqrt(dot(v, v));
}
