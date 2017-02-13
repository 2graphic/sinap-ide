// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service";
import { GraphEditorComponent } from "../graph-editor/graph-editor.component";
import { PluginService } from "../../services/plugin.service";
import { WindowService } from "../../modal-windows/services/window.service";
import { ModalInfo, ModalType } from "./../../models/modal-window";
import { REPLComponent, REPLDelegate } from "../repl/repl.component";
import { PropertiesPanelComponent, PropertiedEntity, PropertiedEntityLists } from "../properties-panel/properties-panel.component";
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component";
import { TestPanelComponent } from "../test-panel/test-panel.component";
import { StatusBarComponent } from "../status-bar/status-bar.component";
import { MainGraph } from "../../models/main-graph";
import { CoreGraph } from "sinap-core";
import { SideBarComponent } from "../side-bar/side-bar.component";
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component";
import { FileService } from "../../services/files.service";
import { SandboxService } from "../../services/sandbox.service";
import * as MagicConstants from "../../models/constants-not-to-be-included-in-beta";

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.css"],
    providers: [MenuService, PluginService, WindowService, FileService, SandboxService]
})

export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private fileService: FileService, private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.repl.delegate = this;
        this.tabBar.delegate = this;
        this.menu.addEventListener(this);
    }

    ngAfterViewInit() {
        this.changeDetectorRef.detectChanges(); //http://stackoverflow.com/a/35243106 sowwwwwy...
    }

    @ViewChild(GraphEditorComponent)
    private graphEditor: GraphEditorComponent;

    @ViewChild(REPLComponent)
    private repl: REPLComponent;

    @ViewChild(PropertiesPanelComponent)
    private propertiesPanel: PropertiesPanelComponent;

    @ViewChild(ToolsPanelComponent)
    private toolsPanel: ToolsPanelComponent;

    @ViewChild("leftSideBar")
    private leftSideBar: SideBarComponent;

    @ViewChild("bottomSideBar")
    private bottomSideBar: SideBarComponent;

    @ViewChild(TestPanelComponent)
    private testComponent: TestPanelComponent;

    @ViewChild(TabBarComponent)
    private tabBar: TabBarComponent;

    public package = "Finite Automata";
    public barMessages = ["DFA", ""]

    private tabs: Map<Number, TabContext> = new Map<Number, TabContext>();
    private context: TabContext | null;

    @ViewChild(StatusBarComponent)
    private statusBar: StatusBarComponent;

    onContextChanged = () => { // arrow syntax to bind correct "this"
        if (this.context) {
            if (this.graphEditor) {
                this.graphEditor.redraw();
            }
            if (this.pluginService) {
            }
        }
    };

    newFile(f?: String, g?: CoreGraph) {
        const kind = this.toolsPanel.activeGraphType == "Machine Learning" ?
            MagicConstants.MACHINE_LEARNING_PLUGIN_KIND : MagicConstants.DFA_PLUGIN_KIND;
        g = g ? g : new CoreGraph(null as any); // <--- TODO: liquid evil, please fix
        let filename = f ? f : "Untitled";
        let tabNumber = this.tabBar.newTab(filename);
        this.tabs.set(tabNumber, new TabContext(new MainGraph(g), filename));
        this.selectedTab(tabNumber);
    }

    ngAfterViewChecked() {
        this.graphEditor.resize();
    }

    promptNewFile() {
        let [_, result] = this.windowService.createModal("sinap-new-file", ModalType.MODAL);

        result.then((result: string) => {
            this.newFile(result);
        });
    }


    /* ---------- TabBarDelegate ---------- */

    deletedTab(i: Number) {
        this.tabs.delete(i);
    }

    selectedTab(i: Number) {
        let context = this.tabs.get(i);
        if (context) {
            this.context = context;
            // TODO: add back
            // this.toolsPanel.manager = this.context.graph.pluginManager;

            // TODO: GraphEditor needs a way to set selected elements
            this.onContextChanged();
        } else {
            // No tabs
            this.context = null;
            this.onContextChanged();
        }
    }

    createNewTab() {
        this.promptNewFile();
    }

    /* ------------------------------------ */


    menuEvent(e: MenuEvent) {
        switch (e) {
            case MenuEvent.NEW_FILE:
                this.promptNewFile();
                break;
            case MenuEvent.LOAD_FILE:
                this.loadFile();
                break;
            case MenuEvent.SAVE_FILE:
                this.saveFile();
                break;
        }
    }

    saveFile() {
        this.fileService.requestFilename(true)
            .then((filename: string) => {
                if (!this.context) {
                    alert("No open graph to save");
                    return;
                }

                let graph = this.context.graph.core.serialize();
                this.fileService.writeFile(filename, JSON.stringify(graph))
                    .catch((err) => {
                        alert(`Error occurred while saving to file ${filename}: ${err}.`);
                    });
            });
    }

    loadFile() {
        this.fileService.requestFilename(false)
            .then((filename: string) => {
                this.fileService.readFile(filename)
                    .then((data: string) => {
                        try {
                            let pojo = JSON.parse(data);

                            if (pojo['sinap-file-format-version'] != "0.0.3") {
                                throw "invalid file format version";
                            }
                        } catch (e) {
                            alert(`Could not de-serialize graph: ${e}.`);
                        }
                    })
                    .catch((err) => {
                        alert(`Error reading file ${filename}: ${err}`);
                    });
            });
    }

    run(input: string): Promise<string> {
        if (this.context) {
            return Promise.resolve("hi, sheyne is bad");
        } else {
            throw new Error("No Graph to Run");
        }
    }
}

class TabContext {
    constructor(public graph: MainGraph, public filename?: String) { };
}
