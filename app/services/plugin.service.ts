import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";

import { Type, ObjectType, Plugin, CoreGraph } from "sinap-core";
import { Context, SandboxService, Script } from "../services/sandbox.service";
import { FileService } from "../services/files.service";
import * as MagicConstants from "../models/constants-not-to-be-included-in-beta";

// TODO:
// this file has a bunch of calls to 
// `instanceof` that could probably be encoded in the 
// type system

@Injectable()
export class PluginService {
    private plugins = new Map<string, Plugin>();
    private interpretCode: Script;
    private runInputCode: Script;
    // TODO: load from somewhere
    private pluginKinds = new Map([[MagicConstants.DFA_PLUGIN_KIND, "./dfa-definition.sinapdef"]])

    constructor( @Inject(FileService) private fileService: FileService,
        @Inject(SandboxService) private sandboxService: SandboxService) {
        this.interpretCode = sandboxService.compileScript('sinap.__program = module.interpret(sinap.__graph)');
        // TODO: Make sure that there is nothing weird about the output returned from the plugin
        // (such as an infinite loop for toString). Maybe make sure that it is JSON only?
        this.runInputCode = sandboxService.compileScript('sinap.__program.then((program) => program.run(sinap.__input))');
    }

    public getPlugin(kind: string){
        let plugin = this.plugins.get(kind);
        if (plugin){
            return plugin;
        }
        const fileName = this.pluginKinds.get(kind);
        if (! fileName){
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
                __input: null
            },

            interpret: null
        });

        return script.runInContext(context).then((_) => context);
    }

    private addToContext(ctx: Promise<Context>, key: string, value: any) {
        return ctx.then((context) => {
            context.sinap[key] = value;
            return context;
        })
    }
}