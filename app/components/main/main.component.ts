// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service"
import { GraphEditorComponent, Drawable as DrawableInterface } from "../graph-editor/graph-editor.component";
import { PluginService } from "../../services/plugin.service";
import { Program } from "../../models/plugin";
import { WindowService } from "../../modal-windows/services/window.service"
import { ModalInfo, ModalType } from './../../models/modal-window'
import { REPLComponent, REPLDelegate } from "../repl/repl.component"
import { PropertiesPanelComponent, PropertiedEntity, PropertiedEntityLists } from "../properties-panel/properties-panel.component"
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component"
import { TestPanelComponent } from "../test-panel/test-panel.component"
import { StatusBarComponent } from "../status-bar/status-bar.component"
import * as Drawable from "../../models/drawable"
import * as Core from "../../models/core"
import { SideBarComponent } from "../side-bar/side-bar.component"
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component"
import { FileService } from "../../services/files.service";
import { SerializerService } from "../../services/serializer.service";
import { SandboxService } from "../../services/sandbox.service";
import * as MagicConstants from "../../models/constants-not-to-be-included-in-beta";

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.css"],
    providers: [MenuService, PluginService, WindowService, FileService, SerializerService, SandboxService]
})

export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private fileService: FileService, private serializerService: SerializerService, private changeDetectorRef: ChangeDetectorRef) {
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

    private getInterpreter(): Promise<Program> {
        const context = this.context;
        if (context) {
            const graph = this.serializerService.serialize(context.graph.core);
            return this.pluginService.getInterpreter(graph);
        } else {
            return Promise.reject("No graph context available");
        }
    }

    onContextChanged = () => { // arrow syntax to bind correct "this"
        if (this.context) {
            this.context.graph.activeEdgeType = "DFAEdge";
            this.context.graph.activeNodeType = "DFANode";
            if (this.graphEditor) {
                this.graphEditor.redraw();
            }
            if (this.pluginService) {
                if (this.context.graph.core.plugin.kind == MagicConstants.MACHINE_LEARNING_PLUGIN_KIND) {
                    this.barMessages = []
                    this.package = "Machine Learning"
                } else {
                    let interp = this.getInterpreter();
                    this.package = "Finite Automata";
                    interp.then((program) => {
                        this.barMessages = program.compilationMessages;
                        for (let triplet of this.testComponent.tests) {
                            program.run(triplet[0] as string)
                                .then((output) => {
                                    triplet[2] = output;
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        }
                    })
                        .catch((err) => {
                            console.log(err);
                            this.barMessages = ["Compilation Error", err];
                        });
                }
            }
        }
    };

    newFile(f?: String, g?: Core.Graph) {
        const kind = this.toolsPanel.activeGraphType == "Machine Learning" ?
            MagicConstants.MACHINE_LEARNING_PLUGIN_KIND : MagicConstants.DFA_PLUGIN_KIND;

        this.pluginService.getPlugin(kind).then((plugin) => {
            g = g ? g : new Core.Graph(plugin);
            let filename = f ? f : "Untitled";
            let tabNumber = this.tabBar.newTab(filename);

            this.tabs.set(tabNumber, new TabContext(new Drawable.ConcreteGraph(g), filename));
            this.selectedTab(tabNumber);
        });
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

                const pojo = this.serializerService.serialize(this.context.graph.core);

                this.fileService.writeFile(filename, JSON.stringify(pojo, null, 4))
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

                            this.serializerService.deserialize(pojo).then((graph) => {
                                this.newFile(filename, graph);
                            })
                                .catch((err) => {
                                    alert(`Could not read graph: ${err}.`);
                                });
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
        let interpreter = this.getInterpreter()
            .catch((err) => {
                this.barMessages = ['Compilation error', err];
                return Promise.reject(err);
            });
        return interpreter.then((program) => {
            this.barMessages = program.compilationMessages;
            return program.run(input).then((obj: any): string => obj.toString());
        });
    }

    propertyChanged(event: [PropertiedEntity, keyof PropertiedEntityLists, string, string[]]) {
        // THIS IS SUPER DIRTY AND CJ SHOULD REALLY HOOK THE CHANGE DETECTOR
        // TODO: KILL THIS WITH FIRE
        let [entity, group, key, keyPath] = event;
        if (group == "drawableProperties") {
            const lst = entity.drawableProperties as Core.MappedPropertyList;
            const drawableKey = lst.key(key);
            this.graphEditor.update(entity as any, drawableKey);
        }
    }
    graphSelectionChanged(selected: Set<PropertiedEntity>) {
        let newSelectedEntity: PropertiedEntity | null = null;
        if (selected.size > 0) {
            for (let x of selected) {
                // this cast is safe because we know that the only Drawables that we
                // ever give the `graphEditor` are `Element`s
                newSelectedEntity = x;
                break;
            }
        } else {
            if (this.context) {
                newSelectedEntity = this.context.graph.core;
            } else {
                throw "How did graph selection change, there's no context? ";

            }
        }
        // ugly trick to silence the fact that things seem to get emitted too often
        // TODO, reduce the frequency things are emitted
        if (this.propertiesPanel.selectedEntity != newSelectedEntity) {
            this.propertiesPanel.selectedEntity = newSelectedEntity;
        }
    }
}

class TabContext {
    selectedDrawables = new Set<DrawableInterface>();
    constructor(public graph: Drawable.ConcreteGraph, public filename?: String) { };
}
