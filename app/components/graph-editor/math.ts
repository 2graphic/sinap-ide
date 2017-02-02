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

export const SQRT3 = Math.sqrt(3);


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

export function quadBezAv(p0: point, p1: point, p2: point): point {
    return { x: quadBezA(p0.x, p1.x, p2.x), y: quadBezA(p0.y, p1.y, p2.y) };
}

export function quadBezA(p0: number, p1: number, p2: number): number {
    return p0 - 2 * p1 + p2;
}

export function quadBezBv(p0: point, p2: point): point {
    return { x: quadBezB(p0.x, p2.x), y: quadBezB(p0.y, p2.y) };
}

export function quadBezB(p0: number, p2: number): number {
    return 2 * (p2 - p0);
}

export function quadBezDv(a: point, b: point, c: point): point {
    return { x: quadBezD(a.x, b.x, c.x), y: quadBezD(a.y, b.y, c.y) };
}

export function quadBezD(a: number, b: number, c: number): number {
    return b * b - 4 * a * c;
}

export function cubBezAv(p0: point, p1: point, p2: point, p3: point): point {
    return { x: cubBezA(p0.x, p1.x, p2.x, p3.x), y: cubBezA(p0.y, p1.y, p2.y, p3.y) };
}

export function cubBezA(p0: number, p1: number, p2: number, p3: number): number {
    return p3 - 3 * p2 + 3 * p1 - p0;
}

export function cubBezBv(p0: point, p1: point, p2: point): point {
    return { x: cubBezB(p0.x, p1.x, p2.x), y: cubBezB(p0.y, p1.y, p2.y) };
}

export function cubBezB(p0: number, p1: number, p2: number): number {
    return 3 * p2 - 6 * p1 + 3 * p0;
}

export function cubBezCv(p0: point, p1: point): point {
    return { x: cubBezC(p0.x, p1.x), y: cubBezC(p0.y, p1.y) };
}

export function cubBezC(p0: number, p1: number): number {
    return 3 * p1 - 3 * p0;
}

export function cubBezDeltaV(a: point, b: point, c: point, d: point): point {
    return { x: cubBezDelta(a.x, b.x, c.x, d.x), y: cubBezDelta(a.y, b.y, c.y, d.y) };
}

export function cubBezDelta(a: number, b: number, c: number, d: number): number {
    return 18 * a * b * c * d - 4 * b * b * b * d + b * b * c * c - 4 * a * c * c * c - 27 * a * a * d * d;
}

export function cubBezDelta0V(a: point, b: point, c: point): point {
    return { x: cubBezDelta0(a.x, b.x, c.x), y: cubBezDelta0(a.y, b.y, c.y) };
}

export function cubBezDelta0(a: number, b: number, c: number): number {
    return b * b - 3 * a * c;
}

export function cubBezDelta1V(a: point, b: point, c: point, d: point): point {
    return { x: cubBezDelta1(a.x, b.x, c.x, d.x), y: cubBezDelta1(a.y, b.y, c.y, d.y) };
}

export function cubBezDelta1(a: number, b: number, c: number, d: number): number {
    return 2 * b * b * -9 * a * b * c + 27 * a * a * d;
}
