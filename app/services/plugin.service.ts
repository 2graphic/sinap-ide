import { Injectable, Inject, EventEmitter } from '@angular/core';
import { somePromises, subdirs, arrayEquals } from "../util";
import * as path from "path";
import { remote } from 'electron';
let { app } = remote;
import { IS_PRODUCTION } from "../constants";
import { Plugin, PluginLoader, getInterpreterInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";



export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app", "plugins") : "./plugins";
export const ROOT_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app") : ".";

@Injectable()
export class PluginService {
    readonly plugins: Promise<Plugin[]>;
    private loader: TypescriptPluginLoader = new TypescriptPluginLoader(ROOT_DIRECTORY);

    constructor() {
        this.plugins = this.loadPlugins();
    }

    private loadPlugins() {
        return subdirs(PLUGIN_DIRECTORY)
            .then(dirs => somePromises(dirs.map(getInterpreterInfo)))
            .then(infos => somePromises(infos.map(info => this.loader.load(info))));
    }

    public async getPluginByKind(kind: string[]): Promise<Plugin> {
        const plugins = await this.plugins;
        const matches = plugins.filter((plugin) => arrayEquals(kind, plugin.pluginInfo.pluginKind));
        const pluginName = JSON.stringify(kind);
        if (matches.length === 0) {
            throw new Error(`Could not find a plugin with kind ${pluginName}`);
        } else if (matches.length > 1) {
            throw new Error(`Found multiple plugins matching kind ${pluginName}`);
        } else {
            return matches[0];
        }
    }

    public get pluginData(): Promise<PluginInfo[]> {
        return this.plugins.then((plugins) => {
            return plugins.map((plugin) => plugin.pluginInfo);
        });
    }
}
