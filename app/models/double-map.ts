

/**
 * Keep two dictionaries in sync, different efficient maps to the same data
 */
export class DoubleMap<A, B, C> {
    private first: Map<A, C>;
    private second: Map<B, C>;

    constructor() {
        this.first = new Map();
        this.second = new Map();
    }

    /**
     * Map `a` and `b` to `c`
     */
    set(a: A, b: B, c: C) {
        this.first.set(a, c);
        this.second.set(b, c);
    }

    /**
     * Get the `C` value that goes with `a`
     */
    getA(a: A) {
        return this.first.get(a);
    }

    /**
     * Get the `C` value that goes with `b`
     */
    getB(b: B) {
        return this.second.get(b);
    }

    values() {
        return this.first.values();
    }

    entries() {
        return this.first.values();
    }
}
