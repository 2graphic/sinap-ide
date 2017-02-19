// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service";
import { MenuEventAction } from "../../models/menu";
import { GraphEditorComponent } from "../graph-editor/graph-editor.component";
import { PluginService, Program, Output } from "../../services/plugin.service";
import { WindowService } from "../../modal-windows/services/window.service"
import { ModalInfo, ModalType } from './../../models/modal-window'
import { REPLComponent, REPLDelegate } from "../repl/repl.component"
import { PropertiesPanelComponent } from "../properties-panel/properties-panel.component"
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component"
import { TestPanelComponent } from "../test-panel/test-panel.component"
import { StatusBarComponent } from "../status-bar/status-bar.component"
import { GraphController, UndoableAdd, UndoableChange, UndoableDelete, UndoableEvent } from "../../models/graph-controller";
import { CoreElement, CoreModel, CoreElementKind } from "sinap-core";
import { SideBarComponent } from "../side-bar/side-bar.component"
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component"
import { FileService, LocalFileService, File } from "../../services/files.service";
import { SandboxService } from "../../services/sandbox.service";
import * as MagicConstants from "../../models/constants-not-to-be-included-in-beta";

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
    providers: [MenuService, PluginService, WindowService, LocalFileService, SandboxService]
})

export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private fileService: LocalFileService, private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.repl.delegate = this;
        this.tabBar.delegate = this;
        this.menu.addEventListener(this);
    }

    ngAfterViewInit() {
        if (process.env.ENV !== 'production') {
            this.newFile();
            this.changeDetectorRef.detectChanges();
        }
    }

    @ViewChild(GraphEditorComponent)
    private graphEditor: GraphEditorComponent;

    @ViewChild(REPLComponent)
    private repl: REPLComponent;

    @ViewChild(PropertiesPanelComponent)
    private propertiesPanel: PropertiesPanelComponent;

    @ViewChild(ToolsPanelComponent)
    private toolsPanel: ToolsPanelComponent;

    @ViewChild("leftPanelBar")
    private leftPanelBar: SideBarComponent;

    @ViewChild("bottomPanelBar")
    private bottomPanelBar: SideBarComponent;

    @ViewChild(TestPanelComponent)
    private testComponent: TestPanelComponent;

    @ViewChild(TabBarComponent)
    private tabBar: TabBarComponent;

    public package = "Finite Automata";
    public barMessages: string[] = []

    private tabs: Map<Number, TabContext> = new Map<Number, TabContext>();
    private context: TabContext | null;

    @ViewChild(StatusBarComponent)
    private statusBar: StatusBarComponent;

    private onContextChanged() {
        if (this.context) {
            if (this.graphEditor) {
                this.graphEditor.redraw();
            }
            if (this.pluginService) {
            }
        }
    };

    private makeChangeNotifier(context: TabContext) {
        return (change: UndoableEvent) => {
            // Something like this.changes.get(context).add(change)
            console.log(context.graph, change);
            this.getProgram(context).then(program => {
                this.updateStatusBar(program);
                this.testComponent.program = program;
            });
        }
    }

    private updateStatusBar(program: Program) {
        let validation = program.validate();
        validation.unshift("DFA");
        this.barMessages = validation;
    }

    private getProgram(context: TabContext) {
        return this.pluginService.getProgram(context.graph.plugin, context.graph.core);
    }

    newFile(f?: String, g?: CoreModel) {
        const kind = this.toolsPanel.activeGraphType == "Machine Learning" ?
            MagicConstants.MACHINE_LEARNING_PLUGIN_KIND : MagicConstants.DFA_PLUGIN_KIND;

        const plugin = this.pluginService.getPlugin(kind);
        g = g ? g : new CoreModel(plugin);

        let filename = f ? f : "Untitled";
        let tabNumber = this.tabBar.newTab(filename);

        const graph = new GraphController(g, plugin);
        const context = new TabContext(graph, filename);

        this.getProgram(context).then(program => {
            this.updateStatusBar(program);
        });

        graph.changed.asObservable().subscribe(this.makeChangeNotifier(context));

        this.tabs.set(tabNumber, context);
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
        switch (e.action) {
            case MenuEventAction.NEW_FILE:
                this.promptNewFile();
                break;
            case MenuEventAction.LOAD_FILE:
                this.loadFile();
                break;
            case MenuEventAction.SAVE_FILE:
                this.saveFile();
                break;
            case MenuEventAction.CUT:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.cut();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.COPY:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.copy();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.PASTE:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.paste();
                    e.preventDefault();
                }
                break;
        }
    }

    /**
     * Return true if the focused element is a child of an element with an `id` of `childOf`
     */
    private focusIsChildOf(childOf: string) {
        function elementIsChildOf(element: Element, id: string): boolean {
            while (element.parentElement) {
                if (element.parentElement.id == id) {
                    return true;
                } else {
                    return elementIsChildOf(element.parentElement, id);
                }
            }

            return false;
        }

        return document.hasFocus() && elementIsChildOf(document.activeElement, childOf);
    }

    saveFile() {
        this.fileService.requestSaveFile()
            .then((file: File) => {
                if (!this.context) {
                    alert("No open graph to save");
                    return;
                }

                const pojo = this.context.graph.core.serialize();

                file.writeData(JSON.stringify(pojo, null, 4))
                    .catch((err) => {
                        alert(`Error occurred while saving to file ${file.name}: ${err}.`);
                    });
            });
    }

    loadFile() {
        this.fileService.requestFiles()
            .then((files: File[]) => {
                for (const file of files) {
                    file.readData().then(f => {
                        // TODO: use correct plugin
                        const plugin = this.pluginService.getPlugin(MagicConstants.DFA_PLUGIN_KIND);
                        this.newFile(file.name, new CoreModel(plugin, JSON.parse(f)));
                    })
                }
            });
    }

    run(input: string): Promise<Output> {
        if (this.context) {
            return this.getProgram(this.context).then(a => {
                return a.run(input);
            });
        } else {
            throw new Error("No Graph to Run");
        }
    }
}

class TabContext {
    constructor(public graph: GraphController, public filename?: String) { };
}
