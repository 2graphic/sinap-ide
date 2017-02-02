import * as Structure from "./type-structures";

///////
/// Wrap up ./type-parser-inner.js
///////

const tpi = require("./type-parser-inner.js");

// type defintion for the kind of exception thrown by the parser
type SyntaxError = {
    message: string;
    expected: { ignoreCase: boolean, test: string, type: string }[];
    found: string;
    location: { start: location, end: location };
    name: "SyntaxError";
}
type location = { column: number, line: number, offset: number };

export type Typed = [any, Structure.Type];
export type TypedVariable = [string, Structure.Type];

/**
 * Check whther an exception is a syntax error
 **/
export function isSyntaxError(e: any): e is SyntaxError {
    return e.name && e.name === "SyntaxError";
}


export { Type, TypeScope, ClassType, ListType, TupleType, TypeVariable } from "./type-structures";

/*
 * Parse a scope literal on its own
 */
export function parseScopeRaw(str: string): Structure.TypeScope {
    return tpi.parse("{" + str + "}", { startRule: "Definitions" });
}

/*
 * Parse a scope literal either in the default scope or in `inject`
 */
export function parseScope(str: string, inject?: Structure.TypeScope): Structure.TypeScope {
    if (inject === undefined) {
        inject = builtins;
    }
    return parseScopeRaw(str).feed(inject);
}

/*
 * Parse a type literal on its own
 */
export function parseTypeRaw(str: string): Structure.Type {
    return tpi.parse(str, { startRule: "Type" });
}

/*
 * Parse a type literal either in the default scope or in `inject`
 */
export function parseType(str: string, inject?: Structure.TypeScope): Structure.Type {
    if (inject === undefined) {
        inject = builtins;
    }
    return parseTypeRaw(str).feed(inject.definitions);
}

class CharacterType extends Structure.PrimitiveType {
    constructor() {
        super("Character");
    }

    subtype(t: Structure.Type) {
        // Make sure rsubtype ends up called correctly
        if (super.subtype(t)) {
            return true;
        }
        return (t instanceof Structure.PrimitiveType) && t.name === "String";
    }
}

/**
 * List of all primitive types
 **/
export const String = new Structure.PrimitiveType("String");
export const Character = new CharacterType();
export const File = new Structure.PrimitiveType("File");
export const Number = new Structure.PrimitiveType("Number");
export const Color = new Structure.PrimitiveType("Color");
export const Integer = new Structure.PrimitiveType("Integer");
export const Boolean = new Structure.PrimitiveType("Boolean");

const primitives = new Structure.TypeScope(new Map<string, Structure.Type>([
    ["String", String],
    ["Character", Character],
    ["Number", Number],
    ["Color", Color],
    ["Integer", Integer],
    ["Boolean", Boolean],
    ["File", File],
]));

/**
 * Exported scope containing all "Builtin" types
 **/
export const builtins = parseScopeRaw(`
Point = class {
	x: Number
	y: Number
}

Graph = class {
	nodes: List<Node>
	edges: List<Edge>
}

Node = class {
    label: String
    children: List<Edge>
}

Edge = class {
    label: String
    source: Node
    destination: Node
}

Shape = enum {circle, square}
LineStyles = enum {dotted, solid, dashed}
`).feed(primitives)

for (const [name, type] of primitives.definitions) {
    builtins.definitions.set(name, type);
}

/**
 * Allow for easy imports of builtins.
 **/
export const Point = builtins.definitions.get("Point") as Structure.ClassType;
export const Graph = builtins.definitions.get("Graph") as Structure.ClassType;
export const Node = builtins.definitions.get("Node") as Structure.ClassType;
export const Edge = builtins.definitions.get("Edge") as Structure.ClassType;
export const Shape = builtins.definitions.get("Shape") as Structure.EnumType;
export const LineStyles = builtins.definitions.get("LineStyles") as Structure.EnumType;
