import * as Structure from "./type-structures";

const tpi = require("./type-parser-inner.js");
type SyntaxError = {
    message: string;
    expected: { ignoreCase: boolean, test: string, type: string }[];
    found: string;
    location: { start: location, end: location };
    name: "SyntaxError";
}

export { Type, TypeScope } from "./type-structures";

export function parseScopeRaw(str: string): Structure.TypeScope {
    return tpi.parse("{" + str + "}", { startRule: "Definitions" });
}

export function parseScope(str: string, inject?: Structure.TypeScope): Structure.TypeScope {
    if (inject === undefined) {
        inject = builtins;
    }
    return parseScopeRaw(str).feed(inject);
}

export function parseTypeRaw(str: string): Structure.Type {
    return tpi.parse(str, { startRule: "Type" });
}
export function parseType(str: string, inject?: Structure.TypeScope): Structure.Type {
    if (inject === undefined) {
        inject = builtins;
    }
    return parseTypeRaw(str).feed(inject.definitions);
}

export function isSyntaxError(e: any): e is SyntaxError {
    return e.name && e.name === "SyntaxError";
}

type location = { column: number, line: number, offset: number };

export const String = new Structure.PrimitiveType("String");
export const File = new Structure.PrimitiveType("File");
export const Number = new Structure.PrimitiveType("Number");
export const Color = new Structure.PrimitiveType("Color");
export const Integer = new Structure.PrimitiveType("Integer");
export const Boolean = new Structure.PrimitiveType("Boolean");

const primitives = new Structure.TypeScope(new Map<string, Structure.Type>([
    ["String", String],
    ["Number", Number],
    ["Color", Color],
    ["Integer", Integer],
    ["Boolean", Boolean],
]));

export const builtins = parseScopeRaw(`
Point = class {
	x: Number
	y: Number
}

Graph = class {
	Nodes: List<Node>
	Edges: List<Edge>
}

Node = class {
    Label: String
    Edges: List<Edge>
}

Edge = class {
    Label: String
    Source: Node
    Destination: Node
}

Shape = enum {circle, square}
LineStyles = enum {dotted, solid, dashed}
`).feed(primitives)

for (const [name, type] of primitives.definitions) {
    builtins.definitions.set(name, type);
}

export const Point = builtins.definitions.get("Point") as Structure.ClassType;
export const Graph = builtins.definitions.get("Graph") as Structure.ClassType;
export const Node = builtins.definitions.get("Node") as Structure.ClassType;
export const Edge = builtins.definitions.get("Edge") as Structure.ClassType;
export const Shape = builtins.definitions.get("Shape") as Structure.EnumType;
export const LineStyles = builtins.definitions.get("LineStyles") as Structure.EnumType;
