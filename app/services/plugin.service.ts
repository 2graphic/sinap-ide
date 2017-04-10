import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Plugin, PluginLoader, getInterpreterInfo, Program, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript";
import { LocalFileService } from "../services/files.service";
import { somePromises } from "../util";


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
        this.plugins = new Promise((resolve, reject) => {
            const plugins: [PluginInfo, Promise<Plugin>][] = [];

            this.fileService.getAppLocations()
                .then((appLocations) => appLocations.pluginDirectory.getSubDirectories())
                .then((pluginDirectories) => {
                    somePromises(pluginDirectories.map((pluginDir) => {
                        return getInterpreterInfo(pluginDir.fullName).then((info) => {
                            plugins.push([info, this.loader.load(info.interpreterInfo)]);
                        });
                    })).then(() => {
                        resolve(plugins);
                    });
                }).catch((e) => {
                    reject(e);
                });
        });
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
            return plugins.map((plugin) => plugin[0]);
        });
    }
}
