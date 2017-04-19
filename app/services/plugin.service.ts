import { Injectable, Inject, EventEmitter } from '@angular/core';
import { somePromises, subdirs, copy, zipFiles, fileStat, tempDir, unzip, closeAfter, getLogger, dirFiles, removeDir, arrayEquals, createDir, sleep } from "../util";
import * as path from "path";
import { remote } from "electron";
import { IS_PRODUCTION } from "../constants";
import { Plugin, PluginLoader, getPluginInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";


const app = remote.app;
const LOG = getLogger("plugin.service");

export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getPath("userData"), "plugins") : "./plugins";
export const ROOT_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app") : ".";

@Injectable()
export class PluginService {
    plugins: Promise<Plugin[]>;
    private loader: TypescriptPluginLoader = new TypescriptPluginLoader(ROOT_DIRECTORY);

    constructor() {
        this.plugins = this.loadPlugins();
    }

    public async reload() {
        this.plugins = this.loadPlugins();
        await this.plugins;
    }

    private loadPlugins(): Promise<Plugin[]> {
        LOG.info(`Reloading plugins from ${PLUGIN_DIRECTORY}`);
        return subdirs(PLUGIN_DIRECTORY)
            .catch(async err => {
                if (err && err.code === "ENOENT") {
                    return createDir(PLUGIN_DIRECTORY).then(_ => []);
                } else {
                    throw err;
                }
            })
            .then(dirs => somePromises(dirs.map((dir) => this.loadPlugin(dir)), LOG))
    }

    private async loadPlugin(dir: string): Promise<Plugin> {
        return await this.loader.load(await getPluginInfo(dir));
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
        await copy(dir, dest);
        await this.reload();
    }

    public async removePlugin(plugin: Plugin): Promise<void> {
        LOG.info(`Removing the ${plugin.pluginInfo.pluginKind.join(".")} plugin.`);
        await removeDir(plugin.pluginInfo.interpreterInfo.directory);
        await this.reload();
    }

    public exportPlugins(dest: string): Promise<void> {
        return zipFiles(PLUGIN_DIRECTORY, dest);
    }
}
