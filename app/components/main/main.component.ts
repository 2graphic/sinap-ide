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
import { PluginService } from "../../services/plugin.service";
import { WindowService } from "../../modal-windows/services/window.service";
import { ModalInfo, ModalType } from './../../models/modal-window';
import { InputPanelComponent, InputPanelDelegate } from "../input-panel/input-panel.component";
import { PropertiesPanelComponent } from "../properties-panel/properties-panel.component";
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component";
import { TestPanelComponent } from "../test-panel/test-panel.component";
import { StatusBarComponent } from "../status-bar/status-bar.component";
import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { SideBarComponent } from "../side-bar/side-bar.component";
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component";
import { LocalFileService, File } from "../../services/files.service";
import { SandboxService } from "../../services/sandbox.service";
import * as MagicConstants from "../../models/constants-not-to-be-included-in-beta";

import { CoreElement, CoreModel, CoreElementKind, CoreValue, Program } from "sinap-core";

import { ResizeEvent } from 'angular-resizable-element';


@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
    providers: [MenuService, PluginService, WindowService, LocalFileService, SandboxService]
})

export class MainComponent implements OnInit, MenuEventListener, InputPanelDelegate, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private fileService: LocalFileService, private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.inputPanel.delegate = this;
        this.tabBar.delegate = this;
        this.menu.addEventListener(this);
    }

    ngAfterViewInit() {
        if (process.env.ENV !== 'production') {
            this.newFile();
            this.changeDetectorRef.detectChanges();
        }

        this.leftPanelsGroup.nativeElement.style.width = "300px";
        this.bottomPanels.nativeElement.style.height = "225px";
    }

    @ViewChild(GraphEditorComponent)
    private graphEditor: GraphEditorComponent;

    @ViewChild(InputPanelComponent)
    private inputPanel: InputPanelComponent;

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

    @ViewChild('editorPanel') editorPanel: ElementRef;
    @ViewChild('leftPanelsGroup') leftPanelsGroup: ElementRef;
    @ViewChild('bottomPanels') bottomPanels: ElementRef;

    public package = "Finite Automata";
    public barMessages: string[] = [];

    private tabs: Map<Number, TabContext> = new Map<Number, TabContext>();
    private _context?: TabContext;

    @ViewChild(StatusBarComponent)
    private statusBar: StatusBarComponent;

    private set context(context: TabContext | undefined) {
        this._context = context;
        if (this._context) {
            this.toolsPanel.graph = this._context.graph;
            if (this.toolsPanel.shouldDisplay()) {
                this.leftPanelIcons = [this.propertiesIcon, this.toolsIcon, this.filesIcon];
            } else {
                this.leftPanelIcons = [this.propertiesIcon, this.filesIcon];
            }
            this.graphEditor.redraw();
        } else {
            this.leftPanelIcons = [this.filesIcon];
        }
    };

    private get context() {
        return this._context;
    }

    private propertiesIcon = {
        path: `${require('../../images/properties.svg')}`,
        name: 'Properties'
    };
    private toolsIcon = {
        path: `${require('../../images/tools.svg')}`,
        name: 'Tools'
    };
    private filesIcon = {
        path: `${require('../../images/files.svg')}`,
        name: 'Files'
    };
    private leftPanelIcons = [this.filesIcon];

    private makeChangeNotifier(context: TabContext) {
        return (change: UndoableEvent) => {
            context.change(change);
            this.getProgram(context).then(this.gotNewProgram);
        };
    }

    private gotNewProgram = (program: Program) => {
        let validation = program.validate();
        validation.unshift("DFA");
        this.barMessages = validation;

        this.testComponent.program = program;
        this.inputPanel.program = program;
    }

    private getProgram(context: TabContext) {
        return this.pluginService.getProgram(context.graph.plugin, context.graph.core);
    }

    newFile(f?: String, g?: CoreModel) {
        const kind = MagicConstants.DFA_PLUGIN_KIND;
        console.log(kind);
        this.pluginService.getPlugin(kind).then((plugin) => {
            g = g ? g : new CoreModel(plugin);

            let filename = f ? f : "Untitled";
            let tabNumber = this.tabBar.newTab(filename);

            const graph = new GraphController(g, plugin);
            const context = new TabContext(tabNumber, graph, filename);

            this.getProgram(context).then(this.gotNewProgram);

            graph.changed.asObservable().subscribe(this.makeChangeNotifier(context));

            this.tabs.set(tabNumber, context);
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
        } else {
            // No tabs
            this.context = undefined;
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
            case MenuEventAction.DELETE:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.deleteSelected();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.SELECT_ALL:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.selectAll();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.CLOSE:
                if (this.context) {
                    this.tabBar.deleteTab(this.context.index);
                    e.preventDefault();
                }
                break;
            case MenuEventAction.PREVIOUS_TAB:
                this.tabBar.selectPreviousTab();
                break;
            case MenuEventAction.NEXT_TAB:
                this.tabBar.selectNextTab();
                break;
            case MenuEventAction.UNDO:
                if (!this.focusIsChildOf("bottom-panels") && this.context) {
                    this.context.undo();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.REDO:
                if (!this.focusIsChildOf("bottom-panels") && this.context) {
                    this.context.redo();
                    e.preventDefault();
                }
                break;
        }
    }

    /**
     * Return true if the focused element is a child of an element with an `id` of `childOf`
     */
    private focusIsChildOf(childOf: string) {
        let el: Element | null = document.activeElement;
        while (el && document.hasFocus()) {
            if (el.id === childOf)
                return true;
            el = el.parentElement;
        }
        return false;
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
                        this.pluginService.getPlugin(MagicConstants.DFA_PLUGIN_KIND).then((plugin) => {
                            this.newFile(file.name, new CoreModel(plugin, JSON.parse(f)));
                        });
                    });
                }
            });
    }


    selectNode(a: any) {
        // TODO: Fix everything
        if (this.context) {
            for (let n of this.context.graph.drawable.nodes) {
                if (n.label === a.label) {
                    this.context.graph.drawable.clearSelection();
                    this.context.graph.drawable.select(n);
                }
            }
        }
    }


    /* ---------- Resizable Panels ---------- */

    private leftPanelWidth = 300;
    private bottomPanelHeight = 225;

    private resizing(element: Element, event: ResizeEvent) {
        if (element.id === "left-panels-group") {
            if (event.rectangle.width !== undefined) {
                this.leftPanelWidth = Math.max(event.rectangle.width, 250);
            }
        } else if (element.id === "bottom-panels") {
            if (event.rectangle.height !== undefined) {
                this.bottomPanelHeight = Math.max(event.rectangle.height, 175);
            }
        }
    }
}

class TabContext {
    private readonly undoHistory: UndoableEvent[] = [];
    private readonly redoHistory: UndoableEvent[] = [];

    private stack = this.undoHistory;
    private isRedoing = false;

    private readonly UNDO_HISTORY_LENGTH = 100;

    constructor(public readonly index: number, public graph: GraphController, public filename?: String) { };

    public undo() {
        const change = this.undoHistory.pop();
        if (change) {
            // If undoing causes a change, push it to the redoHistory stack.
            this.stack = this.redoHistory;
            this.graph.applyUndoableEvent(change);
            this.stack = this.undoHistory;
        }
    }

    public redo() {
        const change = this.redoHistory.pop();
        if (change) {
            this.isRedoing = true;
            this.graph.applyUndoableEvent(change);
            this.isRedoing = false;
        }
    }

    public change(change: UndoableEvent) {
        this.stack.push(change);
        if (this.stack === this.undoHistory && !this.isRedoing) {
            this.redoHistory.length = 0;
        }


        if (this.undoHistory.length > this.UNDO_HISTORY_LENGTH) {
            this.undoHistory.shift();
        }
    }
}
