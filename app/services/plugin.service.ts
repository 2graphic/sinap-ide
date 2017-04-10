import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Plugin, PluginLoader, getInterpreterInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";
import { LocalFileService } from "../services/files.service";


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

@Injectable()
export class PluginService {
    readonly plugins: Promise<[PluginInfo, Promise<Plugin>][]>;
    private loader: TypescriptPluginLoader = new TypescriptPluginLoader();

    constructor( @Inject(LocalFileService) private fileService: LocalFileService) {
        this.plugins = this.loadPlugins();
    }

    private async loadPlugins() {
        const appLocations = await this.fileService.getAppLocations();
        const pluginDirectories = await appLocations.pluginDirectory.getSubDirectories();
        return Promise.all(pluginDirectories.map(async pluginDir => {
            const info = await getInterpreterInfo(pluginDir.fullName);
            return [info, this.loader.load(info.interpreterInfo)] as [PluginInfo, Promise<Plugin>];
        }));
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
