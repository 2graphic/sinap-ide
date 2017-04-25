import { Injectable, Inject, EventEmitter } from '@angular/core';
import { somePromises, subdirs, copy, zipFiles, fileStat, tempDir, unzip, closeAfter, getLogger, dirFiles, removeDir, arrayEquals, createDir, sleep, ensureDir } from "../util";
import * as path from "path";
import { remote } from "electron";
import { IS_PRODUCTION } from "../constants";
import { Plugin, PluginLoader, getPluginInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript-loader";
import * as fs from "fs";
import { PythonPluginLoader } from "sinap-python-loader";


const app = remote.app;
const LOG = getLogger("plugin.service");

export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getPath("userData"), "plugins") : "./plugins";
export const ROOT_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app") : ".";

class PluginHolder {
    private _plugin: Plugin;
    private watchers: fs.FSWatcher[];
    private loaded = true;

    constructor(private loader: PluginLoader, private lock: PromiseLock, plugin: Plugin, private pluginService: PluginService) {
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
        this.loaded = false;
    }

    get plugin(): Plugin {
        return this._plugin;
    }

    set plugin(plugin: Plugin) {
        this._plugin = plugin;
        this.close();
        // TODO: add support for child directories.
        this.addWatcher(plugin.pluginInfo.interpreterInfo.directory);
    }

    private timer: number | undefined = undefined;
    public reload() {
        if (this.timer !== undefined) clearInterval(this.timer);
        this.timer = setTimeout(async () => {
            if (this.loaded) {
                const dir = this.plugin.pluginInfo.interpreterInfo.directory;
                try {
                    await this.lock.acquire(dir);
                } catch (_) {
                }
                try {
                    LOG.info(`Reloading plugin at ${dir}`);
                    this.plugin = await this.loader.load(await getPluginInfo(this.plugin.pluginInfo.interpreterInfo.directory));
                    this.pluginService.publishEvent([this.plugin]);
                } catch (e) {
                    LOG.info(`Failed to reload plugin at ${dir}`, e);
                    this.close();
                    await this.pluginService.unload(this.plugin);
                } finally {
                    this.lock.releaseType(dir);
                }
            } else {
                LOG.info(`{this.plugin.pluginInfo.interpreterInfo.directory} is not loaded.`);
            }
        }, 25) as any;
    }

    private async addWatcher(dir: string) {
        const watcher = fs.watch(dir, {
            persistent: false,
            recursive: false
        }, async (event, fname) => {
            this.reload();
        });
    }
}

class PromiseStruct<T> {
    constructor(public readonly resolve: (obj: T) => void,
        public readonly reject: (err: any) => void,
        public readonly promType?: string) {
    }
}

export class PromiseLock {
    private queue: PromiseStruct<void>[];
    private locked: boolean;

    constructor() {
        this.locked = false;
        this.queue = [];
    }

    acquire(eventType?: string): Promise<void> {
        if (this.locked) {
            return new Promise<void>((resolve, reject) => {
                this.queue.push(new PromiseStruct(resolve, reject, eventType));
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
            const next = this.queue.shift()!;
            next.resolve(undefined as any);
            if (next.promType) {
                this.releaseType(next.promType);
            }
        }
    }

    releaseType(typ: string) {
        const pred = (proms: PromiseStruct<void>) => proms.promType === typ;
        const toRemove = this.queue.filter(pred);
        toRemove.forEach(toRem => toRem.reject('Event was already resolved.'));
        this.queue = this.queue.filter(prom => !pred(prom));
        this.release();
    }
}

export type PluginCb = (plugins: Plugin[]) => void;

@Injectable()
export class PluginService {
    private loaders: Map<string, PluginLoader> = new Map([
        ["typescript", new TypescriptPluginLoader(ROOT_DIRECTORY)],
        ["python", new PythonPluginLoader()],
    ]);
    private holders: PluginHolder[];
    private lock: PromiseLock;
    private cbs: PluginCb[] = [];

    get pluginLock(): PromiseLock {
        return this.lock;
    }

    public publishEvent(plugins: Plugin[]) {
        for (const cb of this.cbs) {
            try {
                cb(plugins);
            } catch (err) {
                LOG.error(err);
            }
        }
    }

    public subscribe(cb: PluginCb) {
        this.cbs.push(cb);
    }

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
        ensureDir(PLUGIN_DIRECTORY).then(_ => {
            fs.watch(PLUGIN_DIRECTORY, {
                persistent: false,
                recursive: false
            }, (event, fname) => this.reload());
            this.reload();
        });
    }

    async reload(): Promise<void> {
        try {
            await this.lock.acquire(PLUGIN_DIRECTORY);
        } catch (_) {
            return;
        }
        try {
            for (const holder of this.holders) {
                holder.close();
            }
            this.holders = await this.loadPlugins();
            this.publishEvent(this.holders.map(holder => holder.plugin));
        } finally {
            this.lock.releaseType(PLUGIN_DIRECTORY);
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
        return plugins.map(info => new PluginHolder(info[1], this.lock, info[0], this));
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

    public async unload(plugin: Plugin): Promise<void> {
        try {
            LOG.info(`Unloading the ${plugin.pluginInfo.pluginKind.join(".")} plugin.`);
            const holder = this.holders.find(h => h.plugin === plugin);
            if (holder) {
                holder.close();
                this.holders.splice(this.holders.indexOf(holder), 1);
            }
        } finally {
            this.publishEvent([plugin]);
        }

        return;
    }

    public async removePlugin(plugin: Plugin): Promise<void> {
        await this.unload(plugin);
        await this.lock.acquire();
        try {
            LOG.info(`Removing the ${plugin.pluginInfo.pluginKind.join(".")} plugin.`);
            await removeDir(plugin.pluginInfo.interpreterInfo.directory);
        } finally {
            this.lock.release();
        }
    }

    public exportPlugins(dest: string): Promise<void> {
        return zipFiles(PLUGIN_DIRECTORY, dest);
    }
}
