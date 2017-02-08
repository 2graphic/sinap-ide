import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import { Type, ObjectType, Plugin, CoreGraph } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { FileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

@Injectable()
export class PluginService {
    private plugins = new Map<string, Plugin>();
    private interpretCode: Script;
    private runInputCode: Script;
    // TODO: load from somewhere
    private pluginKinds = new Map([[MagicConstants.DFA_PLUGIN_KIND, "./dfa-definition.sinapdef"]])

    constructor( @Inject(FileService) private fileService: FileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
        this.interpretCode = sandboxService.compileScript(`
            try{
                sinap.__program = module.interpret(new module.Graph(sinap.__graph));
            } catch (err) {
                sinap.__err = err.toString();
            }`);
        // TODO: Make sure that there is nothing weird about the output returned from the plugin
        // (such as an infinite loop for toString). Maybe make sure that it is JSON only?
        this.runInputCode = sandboxService.compileScript(`
            try {
                sinap.__result = sinap.__program.run(sinap.__input)
            } catch (err) {
                sinap.__err = err.toString();
            }
        `);
    }

    public getPlugin(kind: string) {
        let plugin = this.plugins.get(kind);
        if (plugin) {
            return plugin;
        }
        const fileName = this.pluginKinds.get(kind);
        if (!fileName) {
            throw "Plugin not installed";
        }
        plugin = new Plugin(fileName);
        this.plugins.set(kind, plugin);
        return plugin;
    }

    private getContext(script: Script): Promise<Context> {
        let context: Context = this.sandboxService.createContext({
            sinap: {
                __program: null,
                __graph: null,
                __input: null,
                __err: null,
                __result: null
            },
        });

        return script.runInContext(context).then((_) => context);
    }
}
