// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewChild, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CoreElement, CoreModel, CoreElementKind, CoreValue, Program, SerialJSO } from "sinap-core";

import { GraphEditorComponent, DrawableElement } from "../graph-editor/graph-editor.component";
// import { InputPanelComponent, InputPanelDelegate } from "../input-panel/input-panel.component";
import { PropertiesPanelComponent } from "../properties-panel/properties-panel.component";
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component";
import { FilesPanelComponent } from "../files-panel/files-panel.component";
// import { TestPanelComponent } from "../test-panel/test-panel.component";
import { StatusBarComponent } from "../status-bar/status-bar.component";
import { SideBarComponent } from "../side-bar/side-bar.component";
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component";
import { NewFileResult } from "../new-file/new-file.component";

import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { MenuEventAction } from "../../models/menu";
import { ModalInfo, ModalType } from './../../models/modal-window';

import { LocalFileService, LocalFile, UntitledFile } from "../../services/files.service";
import { SandboxService } from "../../services/sandbox.service";
import { PluginService } from "../../services/plugin.service";
import { WindowService } from "../../modal-windows/services/window.service";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service";

import { TabContext } from "./tab-context";
import { PROPERTIES_ICON, TOOLS_ICON, FILES_ICON, INPUT_ICON, TEST_ICON } from "./icons";

import { ResizeEvent } from 'angular-resizable-element';

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
    providers: [MenuService, PluginService, WindowService, LocalFileService, SandboxService]
})

export class MainComponent implements OnInit, AfterViewInit, AfterViewChecked, MenuEventListener, /*InputPanelDelegate,*/ TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private fileService: LocalFileService, private changeDetectorRef: ChangeDetectorRef) {
        window.addEventListener("beforeunload", this.onClose);

        // Restore previously opened files.
        try {
            const openFilesJSON = localStorage.getItem("openFiles");
            if (openFilesJSON) {
                const openFiles = JSON.parse(openFilesJSON) as string[];
                openFiles.map((fileName) => this.fileService.fileByName(fileName)).forEach((p) => {
                    p.then((f) => {
                        this.openFile(f);
                    });
                });
            }
        } catch (e) {
            console.log(e);
        }

    }

    ngOnInit(): void {
        // this.inputPanel.delegate = this;
        this.tabBar.delegate = this;
        this.menu.addEventListener(this);
    }

    ngAfterViewInit() {
        this.leftPanelsGroup.nativeElement.style.width = "300px";
        this.bottomPanels.nativeElement.style.height = "225px";
    }

    ngAfterViewChecked() {
        // TODO: Let HTML resize this for us.
        this.graphEditor.resize();
    }

    // Setup references to child components. These are setup by angular once ngAfterViewInit is called.
    @ViewChild(GraphEditorComponent) private graphEditor: GraphEditorComponent;
    // @ViewChild(InputPanelComponent) private inputPanel: InputPanelComponent;
    @ViewChild(PropertiesPanelComponent) private propertiesPanel: PropertiesPanelComponent;
    @ViewChild(ToolsPanelComponent) private toolsPanel: ToolsPanelComponent;
    @ViewChild(FilesPanelComponent) private filesPanel: FilesPanelComponent;
    @ViewChild("leftPanelBar") private leftPanelBar: SideBarComponent;
    @ViewChild("bottomPanelBar") private bottomPanelBar: SideBarComponent;
    // @ViewChild(TestPanelComponent) private testComponent: TestPanelComponent;
    @ViewChild(TabBarComponent) private tabBar: TabBarComponent;
    @ViewChild('editorPanel') editorPanel: ElementRef;
    @ViewChild('leftPanelsGroup') leftPanelsGroup: ElementRef;
    @ViewChild('bottomPanels') bottomPanels: ElementRef;
    @ViewChild(StatusBarComponent) private statusBar: StatusBarComponent;

    private tabs = new Map<number, TabContext>();
    private leftPanelIcons = [FILES_ICON];
    private bottomPanelIcons = [INPUT_ICON, TEST_ICON];

    private _context?: TabContext;
    private set context(context: TabContext | undefined) {
        this._context = context;
        if (context) {
            context.compileProgram().then(this.onNewProgram);

            this.toolsPanel.graph = context.graph;
            this.filesPanel.selectedFile = context.file;
            this.statusBar.info = context.statusBarInfo;

            if (this.toolsPanel.shouldDisplay()) {
                this.leftPanelIcons = [PROPERTIES_ICON, TOOLS_ICON, FILES_ICON];
            } else {
                this.leftPanelIcons = [PROPERTIES_ICON, FILES_ICON];
            }
        } else {
            // Clear state

            this.leftPanelIcons = [FILES_ICON];
            this.filesPanel.selectedFile = undefined;
            this.statusBar.info = undefined;
            this.toolsPanel.graph = undefined;
        }
    };

    /** Create a new tab and open it */
    newFile(file: LocalFile, kind: string[], content?: SerialJSO) {
        // TODO: have a more efficient way to get kind.
        this.pluginService.getPluginByKind(kind).then((plugin) => {
            const model = new CoreModel(plugin, content);

            let tabNumber = this.tabBar.newTab(file);

            const graph = new GraphController(model, plugin);
            const context = new TabContext(tabNumber, graph, file, this.pluginService);

            graph.changed.asObservable().subscribe(this.makeChangeNotifier(context));

            this.tabs.set(tabNumber, context);
            this.selectedTab(tabNumber);
        });
    }

    onClose = (e: any): any => {
        // Save what files are open
        const openFiles = [...this.tabs.values()].map((context) => context.file.getPath()).filter((path) => path !== undefined) as string[];
        localStorage.setItem("openFiles", JSON.stringify(openFiles));

        // TODO: Figure out WTF Electron is doing
        // const isDirty = [...this.tabs.values()].map((context) => context.file.dirty).reduce((dirty, accum) => (dirty || accum), false);
        // if (isDirty) {
        //     return confirm('You have unsaved files, are you sure you wish to quit?');
        // }
    }


    private makeChangeNotifier(context: TabContext) {
        return (change: UndoableEvent) => {
            context.compileProgram().then(this.onNewProgram);
        };
    }

    private onNewProgram = (program: Program) => {
        // this.testComponent.program = program;
        // this.inputPanel.program = program;
    }


    promptNewFile() {
        this.pluginService.pluginData.then((pluginData) => {
            let [_, result] = this.windowService.createModal("sinap-new-file", ModalType.MODAL, pluginData);
            result.then((result: NewFileResult) => {
                this.newFile(new UntitledFile(result.name), result.kind);
            });
        });
    }

    saveFile() {
        if (this._context) {
            this._context.save().then(() => {
                this.changeDetectorRef.detectChanges();
            });
        }
    }

    requestOpenFile() {
        this.fileService.requestFiles()
            .then((files: LocalFile[]) => {
                files.forEach(this.openFile);
            }).catch((e) => {
                // User cancelled, do nothing
                console.log(e);
            });
    }

    openFile = (file: LocalFile) => {
        const entry = [...this.tabs.entries()].find(([_, context]) => file.equals(context.file));
        if (entry) {
            this.tabBar.active = entry[0];
        } else {
            file.readData().then((content) => {
                const pojo = JSON.parse(content);
                const kind = pojo.kind;
                this.newFile(file, kind, pojo);
            });
        }
    }




    // selectElement(...elements: CoreElement[]) {
    //     // TODO: Fix everything
    //     if (this._context) {
    //         const f = (element: CoreElement) => {
    //             for (let bridge of this._context!.graph.bridges.entries()) {
    //                 if (bridge.core.uuid === element as any /*element.uuid*/) {
    //                     if (bridge.drawable instanceof DrawableElement) {
    //                         toSelect.push(bridge.drawable);
    //                     }
    //                 }
    //             };
    //         };

    //         const toSelect: DrawableElement[] = [];
    //         elements.forEach(f);

    //         this._context.graph.drawable.clearSelection();
    //         this._context.graph.drawable.select(...toSelect);
    //     }
    // }

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




    /* ---------- TabBarDelegate ---------- */
    deletedTab(i: number) {
        this.tabs.delete(i);
    }

    selectedTab(i: number) {
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


    /* ---------- MenuEventListener ---------- */
    menuEvent(e: MenuEvent) {
        switch (e.action) {
            case MenuEventAction.NEW_FILE:
                this.promptNewFile();
                break;
            case MenuEventAction.OPEN_FILE:
                this.requestOpenFile();
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
                if (this._context) {
                    this.tabBar.deleteTab(this._context.index);
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
                if (!this.focusIsChildOf("bottom-panels") && this._context) {
                    this._context.undo();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.REDO:
                if (!this.focusIsChildOf("bottom-panels") && this._context) {
                    this._context.redo();
                    e.preventDefault();
                }
                break;
        }
    }
    /* --------------------------------------- */


    /* ---------- Resizable Panels ---------- */
    private resizing(element: Element, event: ResizeEvent) {
        if (element.id === "left-panels-group") {
            if (event.rectangle.width !== undefined) {
                this.leftPanelsGroup.nativeElement.style.width = Math.max(event.rectangle.width, 250) + "px";

                if (this.leftPanelsGroup.nativeElement.clientWidth + this.editorPanel.nativeElement.clientWidth >= window.innerWidth) {
                    this.leftPanelsGroup.nativeElement.style.width = (window.innerWidth - this.editorPanel.nativeElement.clientWidth - 1) + "px";
                }
            }
        } else if (element.id === "bottom-panels") {
            if (event.rectangle.height !== undefined) {
                // 55 = height of tab bar plus height of status bar
                this.bottomPanels.nativeElement.style.height = Math.min(Math.max(event.rectangle.height, 175), window.innerHeight - 55) + "px";
            }
        }
    }
    /* -------------------------------------- */
}
