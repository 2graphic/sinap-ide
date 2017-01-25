export interface Type {
    subtype(that: Type): boolean;
    rsubtype?(that: Type): boolean;
    feed(types: Map<string, Type>): Type;
    validate(): void;
    kind: string;
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
    kind = "Variable";

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

    toString() {
        return "(" + this.matchName + "?" + this.lookupName + ":" + this.type + ")";
    }
}

// literal: keyword
export class PrimitiveType implements Type {
    kind: string;
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
}

// literal (t1, t2, ...)
export class TupleType implements Type {
    kind = "Tuple"
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
    validate() { }

    toString() {
        return "(" + this.types.join(", ") + ")";
    }
}

// literal List<t1>
export class ListType implements Type {
    kind = "List"
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

    toString() {
        return "List<" + this.type + ">";
    }
}

// literal "class t1, t2, tn... { field:t ... }"
export class ClassType implements Type {
    kind = "Class"
    constructor(readonly conformsTo: (ClassType | TypeVariable)[], readonly fields: Map<string, Type>) {
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

    promisedTypes(key: string): Type[] {
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
}


export class FunctionType implements Type {
    kind = "Function"
    constructor(public from: Type, public to: Type) {

    }

    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }

        if (!(that instanceof FunctionType)) {
            return false;
        }
        return that.from.subtype(this.from) && this.to.subtype(that.to);
    }

    feed(types: Map<string, Type>) {
        this.from = this.from.feed(types);
        this.to = this.to.feed(types);
        return this;
    }
    validate() { }
}

export class ThunkType implements Type {
    kind = "Thunk"
    constructor(public to: Type) {

    }

    subtype(that: Type): boolean {
        if (that.rsubtype) {
            return that.rsubtype(this);
        }

        if (that instanceof ThunkType) {
            if (this.to.subtype(that.to)) {
                return true;
            }
        }
        return this.to.subtype(that);
    }

    feed(types: Map<string, Type>) {
        this.to = this.to.feed(types);
        return this;
    }
    validate() { }
}


export class EnumType implements Type {
    kind = "Enum"
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

    feed(types: Map<string, Type>) {
        return this;
    }
    validate() { }
}