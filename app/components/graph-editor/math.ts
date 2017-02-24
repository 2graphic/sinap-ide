// File: math.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts


// Imports /////////////////////////////////////////////////////////////////////


import { point } from "./graph-editor-canvas";


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

export function quadBezIntersect(
    p0: point,
    p1: point,
    p2: point,
    lp0: point,
    lp1: point
) {
    const A = lp1.y - lp0.y;
    const B = lp0.x - lp1.x;
    const C = -lp0.x * A - lp0.y * B;

    const coefs = quadBezCoefs(p0, p1, p2);
    const a = A * coefs[0].x + B * coefs[0].y;
    const b = A * coefs[1].x + B * coefs[1].y;
    const c = A * coefs[2].x + B * coefs[2].y + C;

    const rts = getQuadraticRoots(a, b, c);
    for (const t of rts) {
        const ipt = {
            x: coefs[0].x * t * t + coefs[1].x * t + coefs[2].x,
            y: coefs[0].y * t * t + coefs[1].y * t + coefs[2].y
        };
        const s = (B == 0 ? (ipt.y - lp0.y) / A : (lp0.x - ipt.x) / B);
        if (s >= 0 && s <= 1)
            return true;
    }
    return false;
}

export function cubBezIntersect(
    p0: point,
    p1: point,
    p2: point,
    p3: point,
    lp0: point,
    lp1: point
) {
    // Source:
    // https://www.particleincell.com/2013/cubic-line-intersection/
    // https://www.particleincell.com/wp-content/uploads/2013/08/cubic-line.svg
    const A = lp1.y - lp0.y;
    const B = lp0.x - lp1.x;
    const C = -lp0.x * A - lp0.y * B;

    const coefs = cubBezCoefs(p0, p1, p2, p3);
    const a = A * coefs[0].x + B * coefs[0].y;
    const b = A * coefs[1].x + B * coefs[1].y;
    const c = A * coefs[2].x + B * coefs[2].y;
    const d = A * coefs[3].x + B * coefs[3].y + C;

    const rts = (a == 0 ? getQuadraticRoots(b, c, d) : getCubicRoots(a, b, c, d));
    for (const t of rts) {
        const ip = {
            x: coefs[0].x * t * t * t + coefs[1].x * t * t + coefs[2].x * t + coefs[3].x,
            y: coefs[0].y * t * t * t + coefs[1].y * t * t + coefs[2].y * t + coefs[3].y
        };
        const s = (B == 0 ? (ip.y - lp0.y) / A : (lp0.x - ip.x) / B);
        if (s >= 0 && s <= 1)
            return true;
    }
    return false;
}

function getQuadraticRoots(a: number, b: number, c: number) {
    a *= 2;
    const t = [];
    let d = b * b - 2 * a * c;
    if (d > 0) {
        d = Math.sqrt(d);
        let r = (-b + d) / a;
        if (r >= 0 && r <= 1)
            t.push(r);
        r = (-b - d) / a;
        if (r >= 0 && r <= 1)
            t.push(r);
    }
    else if (d == 0) {
        const r = -b / (2 * a);
        if (r >= 0 && r <= 1)
            t.push(r);
    }
    return t;
}

function getCubicRoots(a: number, b: number, c: number, d: number) {
    // Source:
    // https://www.particleincell.com/2013/cubic-line-intersection/
    // https://www.particleincell.com/wp-content/uploads/2013/08/cubic-line.svg
    const t = [];

    const A = b / a;
    const B = c / a;
    const C = d / a;

    const _A3 = -A / 3;

    const Q = (3 * B - Math.pow(A, 2)) / 9;
    const Q3 = Math.pow(Q, 3);
    const R = (9 * A * B - 27 * C - 2 * Math.pow(A, 3)) / 54;
    const D = Q3 + Math.pow(R, 2);

    if (D >= 0) {
        const sqrtD = Math.sqrt(D);

        const S = sgn(R + sqrtD) * Math.pow(Math.abs(R + sqrtD), 1 / 3);
        const T = sgn(R - sqrtD) * Math.pow(Math.abs(R - sqrtD), 1 / 3);
        const ST = S + T;

        let r = _A3 + ST;
        if (r >= 0 && r <= 1)
            t.push(r);

        if (S - T == 0) {
            r = _A3 - ST / 2;
            if (r >= 0 && r <= 1)
                t.push(r);
        }
    }
    else {
        const th = Math.acos(R / Math.sqrt(-Q3));

        const sqrtQ = 2 * Math.sqrt(-Q);
        let r = _A3 + sqrtQ * Math.cos(th / 3);
        if (r >= 0 && r <= 1)
            t.push(r);
        r = _A3 + sqrtQ * Math.cos((th + 2 * Math.PI) / 3);
        if (r >= 0 && r <= 1)
            t.push(r);
        r = _A3 + sqrtQ * Math.cos((th + 4 * Math.PI) / 3);
        if (r >= 0 && r <= 1)
            t.push(r);
    }

    return t;
}

function quadBezCoefs(p0: point, p1: point, p2: point) {
    return [
        {
            x: (p0.x - 2 * p1.x + p2.x),
            y: (p0.y - 2 * p1.y + p2.y)
        },
        {
            x: -2 * p0.x + 2 * p1.x,
            y: -2 * p0.y + 2 * p1.y,
        },
        p0
    ];
}

/**
 * cubBezCoefs  
 *   Gets the cubic bezier curve coefficients.
 */
function cubBezCoefs(p0: point, p1: point, p2: point, p3: point) {
    // Source:
    // https://www.particleincell.com/2013/cubic-line-intersection/
    // https://www.particleincell.com/wp-content/uploads/2013/08/cubic-line.svg
    return [
        {
            x: (-p0.x + 3 * p1.x - 3 * p2.x + p3.x),
            y: (-p0.y + 3 * p1.y - 3 * p2.y + p3.y)
        },
        {
            x: (3 * p0.x - 6 * p1.x + 3 * p2.x),
            y: (3 * p0.y - 6 * p1.y + 3 * p2.y),
        },
        {
            x: (-3 * p0.x + 3 * p1.x),
            y: (-3 * p0.y + 3 * p1.y)
        },
        p0
    ];
}

function sgn(n: number) {
    return (n < 0 ? -1 : 1);
}