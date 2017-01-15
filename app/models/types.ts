export class SinapType {
    constructor(public type: string, public prototypicalStructure: () => any) {
    }

    typeEqual(t: SinapType): boolean {
        return this.type == t.type;
    }

    get topLevelKind(): string {
        return (this instanceof SinapCompositeType) ? this.compositeKind : this.type;
    }
}

export class SinapCompositeType extends SinapType {
    constructor(public compositeKind: string, body: string, prototypicalStructure: () => any) {
        super(compositeKind + "of(" + body + ")", prototypicalStructure)
    }
}

export class SinapOptionalType extends SinapCompositeType {
    constructor(public baseType: SinapType) {
        super("option", baseType.type, () => null);
    }
}

export class SinapListType extends SinapCompositeType {
    constructor(public baseType: SinapType) {
        super("list", baseType.type, () => []);
    }
}

export class SinapEnumType extends SinapCompositeType {
    constructor(public literals: Array<string>) {
        super("enum", "'" + literals.join("','") + "'", () => this.literals[0]);
    }
}

export class SinapUnionType extends SinapCompositeType {
    constructor(public baseTypes: Array<SinapType>) {
        // TODO implement prototypical structure
        super("union", baseTypes.map(x => x.type).join(","), () => null);
    }
}

export class SinapTupleType extends SinapCompositeType {
    constructor(public baseTypes: Array<SinapType>) {
        super("tuple", baseTypes.map(x => x.type).join(","),
            () => this.baseTypes.map(x => x.prototypicalStructure()));
    }
}

export class SinapStructType extends SinapCompositeType {
    constructor(public baseTypes: Map<string, SinapType>) {
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

export const SinapString = new SinapType("string", () => "");
export const SinapNumber = new SinapType("number", () => 0);
export const SinapFile = new SinapType("file", () => null);
export const SinapBoolean = new SinapType("boolean", () => false);
export const SinapNode = new SinapType("node", () => null);
export const SinapEdge = new SinapType("edge", () => null);
export const SinapColor = new SinapType("color", () => "#000000");
export const SinapShape = new SinapEnumType(["circle", "square"]);
export const SinapLineStyles = new SinapEnumType(["dotted", "solid", "dashed"]);
export const SinapPoint = new SinapStructType(new Map<string, SinapType>([['x', SinapNumber], ['y', SinapNumber]]));