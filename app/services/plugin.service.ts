import { Injectable, Inject, EventEmitter } from '@angular/core';
import { somePromises, subdirs, arrayEquals } from "../util";
import * as path from "path";
import { app } from "electron";
import { IS_PRODUCTION } from "../constants";
import { Plugin, PluginLoader, getInterpreterInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";



export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app", "plugins") : "./plugins";

@Injectable()
export class PluginService {
    readonly plugins: Promise<[PluginInfo, Promise<Plugin>][]>;
    private loader: TypescriptPluginLoader = new TypescriptPluginLoader();

    constructor() {
        this.plugins = this.loadPlugins();
    }

    private async loadPlugins() {
        return subdirs(PLUGIN_DIRECTORY)
            .then(dirs => somePromises(dirs.map(getInterpreterInfo)))
            .then(infos => infos.map(info => [info, this.loader.load(info.interpreterInfo)]));
    }

    public async getPluginByKind(kind: string[]): Promise<Plugin> {
        const plugins = await this.plugins;
        const matches = plugins.filter((plugin) => arrayEquals(kind, plugin[0].pluginKind));
        const pluginName = JSON.stringify(kind);
        if (matches.length === 0) {
            throw new Error(`Could not find a plugin with kind ${pluginName}`);
        } else if (matches.length > 1) {
            throw new Error(`Found multiple plugins matching kind ${pluginName}`);
        } else {
            return matches[0][1];
        }
    }

    public get pluginData(): Promise<PluginInfo[]> {
        return this.plugins.then((plugins) => {
            return plugins.map(([pluginInfo, _]) => pluginInfo);
        });
    }
}
