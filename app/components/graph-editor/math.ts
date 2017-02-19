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
    let A = lp1.y - lp0.y;
    let B = lp0.x - lp1.x;
    let C = -lp0.x * A - lp0.y * B;

    let coefs = quadBezCoefs(p0, p1, p2);
    let a = A * coefs[0].x + B * coefs[0].y;
    let b = A * coefs[1].x + B * coefs[1].y;
    let c = A * coefs[2].x + B * coefs[2].y + C;

    let rts = getQuadraticRoots(a, b, c);
    for (let t of rts) {
        let ipt = {
            x: coefs[0].x * t * t + coefs[1].x * t + coefs[2].x,
            y: coefs[0].y * t * t + coefs[1].y * t + coefs[2].y
        };
        let s = (B == 0 ? (ipt.y - lp0.y) / A : (lp0.x - ipt.x) / B);
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
    let A = lp1.y - lp0.y;
    let B = lp0.x - lp1.x;
    let C = -lp0.x * A - lp0.y * B;

    let coefs = cubBezCoefs(p0, p1, p2, p3);
    let a = A * coefs[0].x + B * coefs[0].y;
    let b = A * coefs[1].x + B * coefs[1].y;
    let c = A * coefs[2].x + B * coefs[2].y;
    let d = A * coefs[3].x + B * coefs[3].y + C;

    let rts = (a == 0 ? getQuadraticRoots(b, c, d) : getCubicRoots(a, b, c, d));
    for (let t of rts) {
        let ip = {
            x: coefs[0].x * t * t * t + coefs[1].x * t * t + coefs[2].x * t + coefs[3].x,
            y: coefs[0].y * t * t * t + coefs[1].y * t * t + coefs[2].y * t + coefs[3].y
        };
        let s = (B == 0 ? (ip.y - lp0.y) / A : (lp0.x - ip.x) / B);
        if (s >= 0 && s <= 1)
            return true;
    }
    return false;
}

function getQuadraticRoots(a: number, b: number, c: number) {
    a *= 2;
    let t = [];
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
        let r = -b / (2 * a);
        if (r >= 0 && r <= 1)
            t.push(r);
    }
    return t;
}

function getCubicRoots(a: number, b: number, c: number, d: number) {
    // Source:
    // https://www.particleincell.com/2013/cubic-line-intersection/
    // https://www.particleincell.com/wp-content/uploads/2013/08/cubic-line.svg
    let t = [];

    let A = b / a;
    let B = c / a;
    let C = d / a;

    let _A3 = -A / 3;

    let Q = (3 * B - Math.pow(A, 2)) / 9;
    let Q3 = Math.pow(Q, 3);
    let R = (9 * A * B - 27 * C - 2 * Math.pow(A, 3)) / 54;
    let D = Q3 + Math.pow(R, 2);

    if (D >= 0) {
        let sqrtD = Math.sqrt(D);

        let S = sgn(R + sqrtD) * Math.pow(Math.abs(R + sqrtD), 1 / 3);
        let T = sgn(R - sqrtD) * Math.pow(Math.abs(R - sqrtD), 1 / 3);
        let ST = S + T;

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
        let th = Math.acos(R / Math.sqrt(-Q3));

        let sqrtQ = 2 * Math.sqrt(-Q);
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