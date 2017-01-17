export class Type {
    constructor(public type: string, public prototypicalStructure: () => any) {
    }

    typeEqual(t: Type): boolean {
        return this.type == t.type;
    }

    get topLevelKind(): string {
        return (this instanceof CompositeType) ? this.compositeKind : this.type;
    }
}

export class CompositeType extends Type {
    constructor(public compositeKind: string, body: string, prototypicalStructure: () => any) {
        super(compositeKind + "of(" + body + ")", prototypicalStructure)
    }
}

export class OptionalType extends CompositeType {
    constructor(public baseType: Type) {
        super("option", baseType.type, () => null);
    }
}

export class ListType extends CompositeType {
    constructor(public baseType: Type) {
        super("list", baseType.type, () => []);
    }
}

export class EnumType extends CompositeType {
    constructor(public literals: Array<string>) {
        super("enum", "'" + literals.join("','") + "'", () => this.literals[0]);
    }
}

export class UnionType extends CompositeType {
    constructor(public baseTypes: Array<Type>) {
        // TODO implement prototypical structure
        super("union", baseTypes.map(x => x.type).join(","), () => null);
    }
}

export class TupleType extends CompositeType {
    constructor(public baseTypes: Array<Type>) {
        super("tuple", baseTypes.map(x => x.type).join(","),
            () => this.baseTypes.map(x => x.prototypicalStructure()));
    }
}

export class StructType extends CompositeType {
    constructor(public baseTypes: Map<string, Type>) {
        super("struct", [...baseTypes.entries()].map(p => p[0] + ":" + p[1].type).join(","),
            () => {
                let res: any = {};
                for (let pair of this.baseTypes.entries()) {
                    res[pair[0]] = pair[1].prototypicalStructure();
                }
                return res;
            });
    }
}

export const String = new Type("string", () => "");
export const Number = new Type("number", () => 0);
export const File = new Type("file", () => null);
export const Boolean = new Type("boolean", () => false);
export const Node = new Type("node", () => null);
export const Edge = new Type("edge", () => null);
export const Color = new Type("color", () => "#000000");
export const Shape = new EnumType(["circle", "square"]);
export const LineStyles = new EnumType(["dotted", "solid", "dashed"]);
export const Point = new StructType(new Map<string, Type>([['x', Number], ['y', Number]]));