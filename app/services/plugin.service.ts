import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Plugin, Program, getInterpreterInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";
import { somePromises, subdirs } from "../util";
import * as path from "path";
import { app } from "electron";
import { IS_PRODUCTION } from "../constants";

export class PluginData {
    constructor(readonly path: string[], readonly description: string) {
    }
    get name(): string {
        return this.path[this.path.length - 1];
    }
    get group(): string {
        return this.path[this.path.length - 2];
    }
    toString() {
        return this.name;
    }
}

function arrayEquals<T>(arr1: T[], arr2: T[]): boolean {
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

export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app", "plugins") : "../plugins";

@Injectable()
export class PluginService {
    readonly plugins: Promise<Plugin[]>;
    private loader = new TypescriptPluginLoader();

    constructor() {
        this.plugins = subdirs(PLUGIN_DIRECTORY)
            .then(dirs => somePromises(dirs.map(getInterpreterInfo)))
            .then(infos => somePromises(infos.map(info => this.loader.load(info.interpreterInfo))));
    }

    public getPluginByKind(kind: string[]): Promise<Plugin> {
        return this.plugins.then((plugins) => {
            // TODO
            // const matches = plugins.filter((plugin) => arrayEquals(kind, plugin.pluginKind));
            // const pluginName = JSON.stringify(kind);
            // if (matches.length === 0) {
            //     throw new Error(`Could not find a plugin with kind ${pluginName}`);
            // } else if (matches.length > 1) {
            //     throw new Error(`Found multiple plugins matching kind ${pluginName}`);
            // } else {
            //     return matches[0];
            // }

            if (plugins.length === 0) {
                throw new Error("Oops no plugins");
            }

            return plugins[0];
        });
    }

    public get pluginData(): Promise<PluginData[]> {
        return this.plugins.then((plugins) => {
            return plugins.map((plugin) => new PluginData(["FLAP", "DFA"], "Hardcoded"));
        });
    }
}
