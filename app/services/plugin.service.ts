import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Plugin, Program, getInterpreterInfo, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";
import { somePromises, subdirs, copy, zipFiles, fileStat, tempDir, unzip, closeAfter, getLogger, dirFiles, removeDir, arrayEquals, createDir } from "../util";
import * as path from "path";
import { remote } from "electron";
import { IS_PRODUCTION } from "../constants";

const app = remote.app;
const LOG = getLogger("plugin.service");

export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getPath("userData"), "plugins") : "./plugins";
export const ROOT_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app") : ".";

@Injectable()
export class PluginService {
    readonly plugins: Promise<Plugin[]>;
    private loader: TypescriptPluginLoader = new TypescriptPluginLoader(ROOT_DIRECTORY);

    constructor() {
        this.plugins = this.loadPlugins();
    }

    private loadPlugins(): Promise<Plugin[]> {
        return subdirs(PLUGIN_DIRECTORY)
            .catch(async err => {
                if (err && err.code === "ENOENT") {
                    return createDir(PLUGIN_DIRECTORY).then(_ => []);
                } else {
                    throw err;
                }
            })
            .then(dirs => somePromises(dirs.map(getInterpreterInfo), LOG))
            .then(infos => somePromises(infos.map(info => this.loader.load(info)), LOG));
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

    public async importPlugin(dir: string): Promise<void> {
        // Recursively progress through directories until we get interpreter info.
        const dest = path.join(PLUGIN_DIRECTORY, path.basename(dir));
        LOG.log(`Importing plugins from ${dir} to ${dest}.`);
        return await copy(dir, dest);
    }

    public async removePlugin(plugin: Plugin): Promise<void> {
        LOG.info(`Removing the ${plugin.pluginInfo.pluginKind.join(".")} plugin.`);
        await removeDir(plugin.pluginInfo.interpreterInfo.directory);
    }

    public exportPlugins(dest: string): Promise<void> {
        return zipFiles(PLUGIN_DIRECTORY, dest);
    }
}
