import { Program, Plugin } from "sinap-core";
import { Value, Type } from "sinap-types";
import { SINAP_FILE_FILTER } from "./constants";

export function getInput(program: Program) {
    return getFromType(program, program.plugin.types.arguments[0]);
}

function getFromType(program: Program, type: Type.Type) {
    let inputForPlugin: Value.Value | undefined = undefined;

    if (type instanceof Value.MapType && isNodeType(program.plugin, type.keyType)) {
        const filtered = [...program.model.nodes.values()].filter((n) => Type.isSubtype(n.type, type.keyType));
        if (filtered.length === 0) {
            return undefined;
        }
        const map = program.model.environment.make(type) as Value.MapObject;
        filtered.forEach((n) => {
            map.set(n, program.model.environment.make(type.valueType));
        });
        return map;
    }

    if (isNodeType(program.plugin, type)) {
        inputForPlugin = program.model.nodes.values().next().value;
        return inputForPlugin;
    }


    return program.model.environment.make(type);
}

export function isNodeType(plugin: Plugin, type: Type.Type) {
    return [...plugin.types.nodes.types.values()].find((t) => Type.isSubtype(type, t.pluginType));
}

export function getExpected(program: Program) {
    return getFromType(program, program.plugin.types.result);
}

export function arrayEquals<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}
