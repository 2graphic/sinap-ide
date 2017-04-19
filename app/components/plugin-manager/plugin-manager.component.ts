import { Component, Inject, Output, ChangeDetectorRef } from "@angular/core";
import { PluginService } from "../../services/plugin.service";
import { requestSaveFile, requestOpenDirs, requestFiles, getLogger } from "../../util";
import { remote } from "electron";
import { ZIP_FILE_FILTER } from "../../constants";
import { ModalComponent, ModalInfo } from "../../models/modal-window";
import { getPluginInfo, PluginInfo } from "sinap-core";
import { dirFiles, subdirs, tempDir, unzip, TempDir } from "../../util";
import { WindowService } from "./../../modal-windows/services/window.service";

async function isPluginDir(dir: string) {
    const files = await dirFiles(dir);
    return files.find(name => name === "package.json");
}

async function recursiveInfo(dir: string): Promise<PluginInfo[]> {
    if (await isPluginDir(dir)) {
        LOG.log(`Getting info for ${dir}`);
        return [await getPluginInfo(dir)];
    } else {
        LOG.log(`${dir} is not a plugin so check its children.`);
        const children = await subdirs(dir);
        const results = await Promise.all(children.map(child => recursiveInfo(child)));
        return ([] as PluginInfo[]).concat(...results);
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
export class PluginManager implements ModalComponent {
    public modalInfo: ModalInfo;
    private plugins: PluginInfo[];
    private selectedPlugin: PluginInfo;

    constructor( @Inject(PluginService) private pluginService: PluginService,
        @Inject(WindowService) private windowService: WindowService,
        private changeDetectorRef: ChangeDetectorRef) {
    }

    async ngOnInit() {
        this.plugins = await this.pluginService.pluginData;
        this.changeDetectorRef.detectChanges();
    }

    ngAfterViewInit() {
        setTimeout(() => this.windowService.showWindow(this.modalInfo.id), 30);
    }

    async exportPlugins() {
        const file = await requestSaveFile(DEFAULT_DIR, [ZIP_FILE_FILTER]);
        return await this.pluginService.exportPlugins(file);
    }

    private async importMany(dirNames: string[]) {
        LOG.info(`Finding info for ${JSON.stringify(dirNames)}.`);
        const infos = ([] as PluginInfo[]).concat(... await Promise.all(dirNames.map(recursiveInfo)));
        LOG.info("Found info, now try to import them all."); // TODO: Prompt for which ones to import.
        infos.forEach(info => this.pluginService.importPlugin(info.interpreterInfo.directory));
        this.plugins = await this.pluginService.pluginData;
        this.changeDetectorRef.detectChanges();
    }

    async importPlugins() {
        const dirNames = await requestOpenDirs(DEFAULT_DIR);
        await this.importMany(dirNames);
    }

    async deletePlugin() {
        await this.pluginService.removePlugin(await this.pluginService.getPluginByKind(this.selectedPlugin.pluginKind));
        this.plugins = await this.pluginService.pluginData;
        this.changeDetectorRef.detectChanges();
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
        } finally {
            tempDirs.forEach(tempDir => tempDir.close());
        }
    }
}