/**
 * Main interface for all types
 */
export interface Type {
    /**
     * Return whether `this` is a subtype of `that`, in the case of variables this
     * function can add some constraints on `this` to make it allowed to return 
     * true.
     *
     * If `that.rsubtype` is defined, you should probably call it first to be nice to
     * variables. 
     * TODO: find a better way to enforce this.
     **/
    subtype(that: Type): boolean;

    /*
     * Is `that` a subtype of `this`
     */
    rsubtype?(that: Type): boolean;

    /*
     * Return a new version of this type in the context 
     * of types
     * this probably means just passing it to all inner types
     * and replacing them with the values they return
     * unless this is a variable.
     *
     * TODO: consider making everything return a copy
     * most mutate right now
     */
    feed(types: Map<string, Type>): Type;

    /*
     * Determine whether `this` is "valid"
     * things like invalid overrides should throw a descriptive error message here
     * mostly only used by ClassType. Needs to happen after all feeds
     * also always throws `PREFIX+": free variable"` it it encounters a variable
     */
    validate(): void;

    /*
     * A textual name for the type
     */
    kind: string;

    isInstance(inp: any): boolean;
}

export class TypeScope {
    constructor(public definitions: Map<string, Type>) {

    }

    feed(scope: TypeScope): TypeScope {
        // TODO: make faster?
        const types = new Map([...this.definitions.entries()].concat([...scope.definitions.entries()]));

        for (const [key, type] of this.definitions.entries()) {
            this.definitions.set(key, type.feed(types));
        }
        return this;
    }

    validate() {
        for (const type of this.definitions.values()) {
            type.validate();
        }
    }
}

export class TypeVariable implements Type {
    readonly kind = "Variable";

    constructor(public type?: Type, public lookupName?: string, public matchName?: string) {

    }
    subtype(that: Type): boolean {
        if (!this.type) {
            this.type = that;
            return true;
        }
        if (this.type.subtype(that)) {
            return true;
        }
        if (that.subtype(this.type)) {
            this.type = that;
            return true;
        }
        return false;
    }

    rsubtype(that: Type) {
        if (!this.type) {
            this.type = that;
            return true;
        }
        if (that.subtype(this.type)) {
            return true;
        }
        if (this.type.subtype(that)) {
            this.type = that;
            return true;
        }
        return false;
    }

    feed(types: Map<string, Type>): Type {
        if (this.lookupName) {
            const replacementType = types.get(this.lookupName);
            if (replacementType) {
                return replacementType;
            }
        }
        return this;
    }
    validate() { }

    isInstance(a: any) {
        if (this.type) {
            return this.type.isInstance(a);
        }
        return true;
    }

    toString() {
        return "(" + this.matchName + "?" + this.lookupName + ":" + this.type + ")";
    }
}

// literal: keyword
export class PrimitiveType implements Type {
    readonly kind: string;
    constructor(readonly name: string) {
        this.kind = name;
    }

	/**
	 * true if `this` is a subtype of `that`.
	 **/
    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }
        return (that instanceof PrimitiveType) && that.name === this.name;
    }

    toString() {
        return this.name;
    }

    feed(types: Map<string, Type>) {
        return this;
    }
    validate() { }

    isInstance(a: any) {
        switch (this.kind) {
            case "String":
                return typeof (a) === "string";
            case "Character":
                return (typeof (a) === "string") && a.length === 1;
            case "Number":
                return !Number.isNaN(a);
            case "Color":
                // TODO: make better
                return a instanceof String && a[0] === "#"
            case "Integer":
                return Number.isInteger(a);
            case "Boolean":
                return a === true || a === false;

            //TODO: implement
            case "File":
            default:
                return false;
        }
    }

}

// literal (t1, t2, ...)
export class TupleType implements Type {
    readonly kind = "Tuple"
    constructor(readonly types: Type[]) {
    }

    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }
        if (!(that instanceof TupleType)) {
            return false;
        }
        if (that.types.length !== this.types.length) {
            return false;
        }
        for (let i = 0; i < this.types.length; i++) {
            if (!this.types[i].subtype(that.types[i])) {
                return false;
            }
        }
        return true;
    }

    feed(types: Map<string, Type>) {
        for (let i = 0; i < this.types.length; i++) {
            this.types[i] = this.types[i].feed(types);
        }
        return this;
    }

    isInstance(a: any) {
        for (let i = 0; i < this.types.length; i++) {
            if (!this.types[i].isInstance(i)) {
                return false;
            }
        }
        return true;
    }

    validate() { }

    toString() {
        return "(" + this.types.join(", ") + ")";
    }
}

// literal List<t1>
export class ListType implements Type {
    readonly kind = "List"
    constructor(public type: Type) {
    }

    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }
        if (!(that instanceof ListType)) {
            return false;
        }
        return this.type.subtype(that.type);
    }

    feed(types: Map<string, Type>) {
        this.type = this.type.feed(types);
        return this;
    }
    validate() { }

    isInstance(a: any) {
        if (!Array.isArray(a)) {
            return false;
        }
        for (const el of a) {
            if (!this.type.isInstance(el)) {
                return false;
            }
        }
        return true;
    }


    toString() {
        return "List<" + this.type + ">";
    }
}

// TODO: make this a utility function somewhere else
function capitalize(str: string) {
    str = str.replace(/([a-z])([A-Z])/, "$1 $2");
    return str[0].toUpperCase() + str.slice(1);
}

// literal "class t1, t2, tn... { field:t ... }"
export class ClassType implements Type {
    readonly kind = "Class"
    readonly fields = new Map<string, Type>();
    readonly names = new Map<string, string>();

    constructor(readonly conformsTo: (ClassType | TypeVariable)[], readonly mappings: [string, [string | null, Type]][]) {
        for (const [name, [prettyName, type]] of mappings) {
            this.fields.set(name, type);
            if (prettyName) {
                this.names.set(name, prettyName);
            }
        }
    }

    validate(): void {
        for (const [k, t1] of this.fields.entries()) {
            if (t1 instanceof TypeVariable) {
                throw "ClassType.validate: free type variable";
            }

            for (const t2 of this.promisedTypes(k)) {
                if (!t1.subtype(t2)) {
                    throw "ClassType.validate: cannot override " + t2 + " with " + t1;
                }
            }
        }
    }

    toString() {
        return "ClassType";
    }

    private promisedTypes(key: string): Type[] {
        const result: Type[] = [];
        for (const t of this.conformsTo) {
            if (t instanceof TypeVariable) {
                throw "ClassType.promisedTypes: free type variable";
            }
            result.push(...t.promisedTypes(key));
        }
        const myPromise = this.fields.get(key);
        if (myPromise) {
            result.push(myPromise);
        }
        return result;
    }

    typeOf(key: string): Type {
        const va = new TypeVariable();
        for (const t of this.promisedTypes(key)) {
            if (!va.subtype(t)) {
                throw "ClassType.typeOf: internal inconsistancy, please validate";
            }
        }

        if (!va.type) {
            throw "ClassType.typeOf: field doesn't exist";
        }

        return va.type;
    }

    prettyName(key: string): string {
        const name = this.names.get(key);
        if (name) {
            return name;
        }
        for (const sup of this.conformsTo) {
            if (sup instanceof TypeVariable) {
                throw "ClassType.promisedTypes: free type variable";
            }
            const name = sup.prettyName(key);
            if (name) {
                return name;
            }
        }
        return capitalize(key);
    }

    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }
        if (this === that) {
            return true;
        }
        for (const t of this.conformsTo) {
            if (t.subtype(that)) {
                return true;
            }
        }
        return false;
    }

    feed(types: Map<string, Type>) {
        for (const [key, value] of this.fields.entries()) {
            this.fields.set(key, value.feed(types));
        }
        for (let i = 0; i < this.conformsTo.length; i++) {
            const newValue = this.conformsTo[i].feed(types);
            if (newValue instanceof ClassType || newValue instanceof TypeVariable) {
                this.conformsTo[i] = newValue;
            } else {
                throw "ClassType.feed: cannot conform to a non class type"
            }
        }
        return this;
    }

    isInstance(a: any) {
        for (const [n, t] of this.fields.entries()) {
            if (!t.isInstance(a[n])) {
                return false;
            }
        }
        return true;
    }

}


// export class FunctionType implements Type {
//     readonly kind = "Function"
//     constructor(public from: Type, public to: Type) {

//     }

//     subtype(that: Type): boolean {
//         if (that.rsubtype) {
//             return that.rsubtype(this);
//         }

//         if (!(that instanceof FunctionType)) {
//             return false;
//         }
//         return that.from.subtype(this.from) && this.to.subtype(that.to);
//     }

//     feed(types: Map<string, Type>) {
//         this.from = this.from.feed(types);
//         this.to = this.to.feed(types);
//         return this;
//     }
//     validate() { }
// }

// export class ThunkType implements Type {
//     readonly kind = "Thunk"
//     constructor(public to: Type) {

//     }

//     subtype(that: Type): boolean {
//         if (that.rsubtype) {
//             return that.rsubtype(this);
//         }

//         if (that instanceof ThunkType) {
//             if (this.to.subtype(that.to)) {
//                 return true;
//             }
//         }
//         return this.to.subtype(that);
//     }

//     feed(types: Map<string, Type>) {
//         this.to = this.to.feed(types);
//         return this;
//     }
//     validate() { }
// }


export class EnumType implements Type {
    readonly kind = "Enum"
    constructor(public literals: string[]) {

    }

    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }

        if (that instanceof EnumType) {
            for (let i = 0; i < this.literals.length; i++) {
                if (this.literals[i] !== that.literals[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    isInstance(a: any) {
        return this.literals.indexOf(a) !== -1;
    }

    feed(types: Map<string, Type>) {
        return this;
    }
    validate() { }
}