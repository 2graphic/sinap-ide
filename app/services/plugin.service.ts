import { Injectable, Inject, EventEmitter } from '@angular/core';
import { somePromises, subdirs, copy, zipFiles, fileStat, tempDir, unzip, closeAfter, getLogger, dirFiles, removeDir, arrayEquals, createDir, sleep } from "../util";
import * as path from "path";
import { remote } from "electron";
import { IS_PRODUCTION } from "../constants";
import { Plugin, PluginLoader, getPluginInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";
import * as fs from "fs";
import { PythonPluginLoader } from "sinap-python-loader";


const app = remote.app;
const LOG = getLogger("plugin.service");

export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getPath("userData"), "plugins") : "./plugins";
export const ROOT_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app") : ".";

class PluginHolder {
    private _plugin: Plugin;
    private watchers: fs.FSWatcher[];

    constructor(private loader: PluginLoader, private lock: PromiseLock, plugin: Plugin) {
        this.watchers = [];
        this.plugin = plugin;
    }

    close() {
        for (const watcher of this.watchers) {
            try {
                watcher.close();
            } catch (err) {
                LOG.error(err);
            }
        }

        this.watchers = [];
    }

    get plugin(): Plugin {
        return this._plugin;
    }

    set plugin(plugin: Plugin) {
        this._plugin = plugin;
        this.close();
        this.addWatcher(plugin.pluginInfo.interpreterInfo.directory);
    }

    private async addWatcher(dir: string) {
        const watcher = fs.watch(dir, {
            persistent: false,
            recursive: false
        }, async (event, fname) => {
            // This may need to be debounced for performance.
            await this.lock.acquire();
            try {
                console.log("updating plugin at " + dir);
                this.plugin = await this.loader.load(await getPluginInfo(this.plugin.pluginInfo.interpreterInfo.directory));
                console.log("updated plugin at " + dir, this.plugin);
            } finally {
                this.lock.release();
            }
        });
    }
}

export class PromiseLock {
    private queue: (() => void)[];
    private locked: boolean;

    constructor() {
        this.locked = false;
        this.queue = [];
    }

    acquire(): Promise<void> {
        if (this.locked) {
            return new Promise<void>((resolve, reject) => {
                this.queue.push(resolve);
            });
        } else {
            this.locked = true;
            return Promise.resolve();
        }
    }

    release() {
        if (this.queue.length === 0) {
            this.locked = false;
        } else {
            const next = this.queue.shift();
            next!();
        }
    }
}

@Injectable()
export class PluginService {
    private loaders: Map<string, PluginLoader> = new Map([
        ["typescript", new TypescriptPluginLoader(ROOT_DIRECTORY)],
        ["python", new PythonPluginLoader()],
    ]);
    private holders: PluginHolder[];
    private lock: PromiseLock;

    get plugins(): Promise<Plugin[]> {
        return this.lock.acquire().then(_ => {
            const result = this.holders.map(holder => holder.plugin);
            this.lock.release();
            return result;
        });
    }

    constructor() {
        this.lock = new PromiseLock();
        this.holders = [];
        fs.watch(PLUGIN_DIRECTORY, {
            persistent: false,
            recursive: false
        }, (event, fname) => this.reload());
        this.reload();
    }

    async reload(): Promise<void> {
        await this.lock.acquire();
        try {
            for (const holder of this.holders) {
                holder.close();
            }
            this.holders = await this.loadPlugins();
        } finally {
            this.lock.release();
        }
    }

    private async loadPlugins(): Promise<PluginHolder[]> {
        LOG.info(`Reloading plugins from ${PLUGIN_DIRECTORY}`);
        let dirs: string[] = [];

        try {
            dirs = await subdirs(PLUGIN_DIRECTORY);
        } catch (err) {
            if (err && err.code === "ENOENT") {
                await createDir(PLUGIN_DIRECTORY);
                dirs = [];
            }
        }

        const plugins = await somePromises(dirs.map(dir => this.loadPlugin(dir)), LOG);
        return plugins.map(info => new PluginHolder(info[1], this.lock, info[0]));
    }

    private async loadPlugin(dir: string) {
        const info = await getPluginInfo(dir);
        const loader = this.loaders.get(info.interpreterInfo.loader);
        if (!loader) {
            throw new Error(`loader: "${info.interpreterInfo.loader}" not found`);
        }
        const plugin = await loader.load(info);
        return [plugin, loader] as [Plugin, PluginLoader];
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
    }

    public async removePlugin(plugin: Plugin): Promise<void> {
        LOG.info(`Removing the ${plugin.pluginInfo.pluginKind.join(".")} plugin.`);
        await removeDir(plugin.pluginInfo.interpreterInfo.directory);
    }

    public exportPlugins(dest: string): Promise<void> {
        return zipFiles(PLUGIN_DIRECTORY, dest);
    }
}
