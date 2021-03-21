import { Injectable } from '@angular/core';
import { arrayEquals } from "../util";
import { Plugin, PluginInfo } from "sinap-core";
import { TypescriptPluginLoader } from "sinap-typescript-loader";

const pluginLoader = new TypescriptPluginLoader();

@Injectable()
export class PluginService {
    private _plugins: Plugin[] = [];

    get plugins(): Promise<Plugin[]> {
        return Promise.resolve(this._plugins);
    }

    constructor() {
        this.reload();
    }

    async reload(): Promise<void> {
        this._plugins = [
            await pluginLoader.load(new PluginInfo(JSON.parse(require(`!raw-loader!../../plugins/dfa/package.json`).default)),
                require(`!raw-loader!../../plugins/dfa/dfa-interpreter.ts`).default),
            await pluginLoader.load(new PluginInfo(JSON.parse(require(`!raw-loader!../../plugins/turing-machine/package.json`).default)),
                require(`!raw-loader!../../plugins/turing-machine/plugin.ts`).default),
            await pluginLoader.load(new PluginInfo(JSON.parse(require(`!raw-loader!../../plugins/nfa/package.json`).default)),
                require(`!raw-loader!../../plugins/nfa/nfa.ts`).default),
            await pluginLoader.load(new PluginInfo(JSON.parse(require(`!raw-loader!../../plugins/pda/package.json`).default)),
                require(`!raw-loader!../../plugins/pda/pda.ts`).default),
            await pluginLoader.load(new PluginInfo(JSON.parse(require(`!raw-loader!../../plugins/circuits/package.json`).default)),
                require(`!raw-loader!../../plugins/circuits/interpreter.ts`).default),
            await pluginLoader.load(new PluginInfo(JSON.parse(require(`!raw-loader!../../plugins/bfs/package.json`).default)),
                require(`!raw-loader!../../plugins/bfs/interpreter.ts`).default),
        ];
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
