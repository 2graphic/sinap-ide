import { Component, Inject, Output, ChangeDetectorRef } from "@angular/core";
import { PluginService, PLUGIN_DIRECTORY } from "../../services/plugin.service";
import { requestSaveFile, requestOpenDirs, requestFiles, getLogger } from "../../util";
import { remote, shell } from "electron";
import { ZIP_FILE_FILTER } from "../../constants";
import { PluginInfo } from "sinap-core";
import { dirFiles, subdirs, tempDir, unzip, TempDir, getPath } from "../../util";
import { ResizeEvent } from 'angular-resizable-element';
import * as path from "path";

let exec = require('child_process').exec;

async function isPluginDir(dir: string) {
    const files = await dirFiles(dir);
    return files.find(name => name === "package.json");
}

async function recursiveInfo(dir: string): Promise<string[]> {
    if (await isPluginDir(dir)) {
        return [dir];
    } else {
        LOG.log(`${dir} is not a plugin so check its children.`);
        const children = await subdirs(dir);
        const results = await Promise.all(children.map(child => recursiveInfo(child)));
        return ([] as string[]).concat(...results);
    }
}

async function unzipToTemp(src: string): Promise<TempDir> {
    LOG.info(`Unzipping ${src} to a temporary directory.`);
    const result = await tempDir();
    try {
        await unzip(src, result.path);
        return result;
    } catch (err) {
        LOG.info(`Could not unzip ${src}, deleting temporary directory.`);
        await result.close();
        throw err;
    }
}

const DEFAULT_DIR = remote.app.getPath("home");
const LOG = getLogger("plugin-manager");
@Component({
    selector: "plugin-manager",
    templateUrl: "./plugin-manager.component.html",
    styleUrls: ["plugin-manager.component.scss"]
})
export class PluginManager {
    private plugins: PluginInfo[];
    private selectedPlugin: PluginInfo;

    constructor( @Inject(PluginService) private pluginService: PluginService,
        private changeDetectorRef: ChangeDetectorRef) {
        this.pluginService.subscribe(async _ => {
            this.plugins = await this.pluginService.pluginData;
            this.changeDetectorRef.detectChanges();
        });
    }

    // set modalInfo() {
    //     this.plugins = modalInfo.data;
    //     if (this.plugins.length > 0) {
    //         this.pluginSelected(this.plugins[0]);
    //     }
    //     this.changeDetectorRef.detectChanges();
    // }

    // get modalInfo() {
    //     return this._modalInfo;
    // }

    ngAfterViewInit() {
        // setTimeout(() => this.windowService.showWindow(this.modalInfo.id), 30);
    }

    async exportPlugins() {
        const file = await requestSaveFile(DEFAULT_DIR, [ZIP_FILE_FILTER]);
        return await this.pluginService.exportPlugins(file);
    }

    private async importMany(dirNames: string[]) {
        const lock = this.pluginService.pluginLock;
        await lock.acquire();
        try {
            LOG.info(`Finding info for ${JSON.stringify(dirNames)}.`);
            const infos = ([] as string[]).concat(... await Promise.all(dirNames.map(recursiveInfo)));
            LOG.info("Found info, now try to import them all."); // TODO: Prompt for which ones to import.
            const proms = infos.map(dir => this.pluginService.importPlugin(dir));
            await Promise.all(proms);
        } finally {
            lock.release();
        }
    }

    private showInFolder() {
        const directory = getPath(path.join(this.selectedPlugin.interpreterInfo.directory, "package.json"));
        LOG.info(`Opening ${directory} in file manager.`);
        if (!shell.showItemInFolder(directory)) {
            LOG.error(`Could not open ${directory} in file manager.`);
        }
    }

    private getFileManagerText() {
        if (process.platform === 'darwin') {
            return "Reveal in Finder";
        } else {
            return "Open in Explorer";
        }
    }

    async importPlugins() {
        const dirNames = await requestOpenDirs(DEFAULT_DIR);
        await this.importMany(dirNames);
    }

    async deletePlugin() {
        await this.pluginService.removePlugin(await this.pluginService.getPluginByKind(this.selectedPlugin.pluginKind));
    }

    editButton() {
        const command = "/usr/bin/env code '" + this.selectedPlugin.interpreterInfo.directory + "'";
        console.log(command, exec);
        exec(command, function() { console.log(arguments); });
    }

    pluginSelected(plugin: PluginInfo) {
        this.selectedPlugin = plugin;
        this.changeDetectorRef.detectChanges();
    }

    async importFromZip() {
        const fileNames = await requestFiles(DEFAULT_DIR, [ZIP_FILE_FILTER]);
        const tempDirs: TempDir[] = [];
        try {
            for (let i = 0; i < fileNames.length; i++) {
                tempDirs.push(await unzipToTemp(fileNames[i])); // Need to be careful for cleanup.
            }
            await this.importMany(tempDirs.map(tempDir => tempDir.path));
            tempDirs.forEach(tempDir => tempDir.close());
        } finally {
            tempDirs.forEach(tempDir => tempDir.close());
        }
    }

    private width = 200;

    private resizing(evt: ResizeEvent) {
        if (evt.rectangle.width) {
            this.width = Math.max(Math.min(evt.rectangle.width, 275), 185);
        }
    }
}