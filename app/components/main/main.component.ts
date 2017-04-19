/**
 * @file `main.component.ts`
 *   Created on October 10, 2016
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @author Daniel James
 *   <daniel.s.james@icloud.com>
 *
 * @description
 *   This is the main application component. It is used as the main UI container
 *   for presenting content to the user.
 */


import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewChild, ChangeDetectorRef, ElementRef, EventEmitter } from "@angular/core";
import { Program, Plugin, Model, readFile, NodePromise } from "sinap-core";

import { GraphEditorComponent } from "../graph-editor/graph-editor.component";

import { DynamicPanelComponent, DynamicPanelItem, DynamicTestPanelComponent } from "../dynamic-panel/dynamic-panel";
import { PropertiesPanelComponent, PropertiesPanelData } from "../properties-panel/properties-panel.component";
import { FilesPanelComponent, FilesPanelData } from "../files-panel/files-panel.component";
import { ToolsPanelComponent, ToolsPanelData } from "../tools-panel/tools-panel.component";
import { InputPanelComponent } from "../input-panel/input-panel.component";
import { TestPanelComponent } from "../test-panel/test-panel.component";

import { StatusBarComponent } from "../status-bar/status-bar.component";
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component";
import { NewFileResult } from "../new-file/new-file.component";

import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { MenuEventAction } from "../../models/menu";
import { ModalInfo, ModalType } from './../../models/modal-window';

import { PluginService } from "../../services/plugin.service";
import { WindowService } from "../../modal-windows/services/window.service";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service";

import { TabContext } from "./tab-context";
import { PROPERTIES_ICON, TOOLS_ICON, FILES_ICON, INPUT_ICON, TEST_ICON } from "./icons";

import { ResizeEvent } from 'angular-resizable-element';
import { requestSaveFile, requestFiles, fileStat, compareFiles, writeData, getPath } from "../../util";

const remote = require('electron').remote;
const dialog = remote.dialog;

import * as path from "path";

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
    providers: [MenuService, PluginService, WindowService]
})
export class MainComponent implements OnInit, AfterViewInit, AfterViewChecked, MenuEventListener, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private changeDetectorRef: ChangeDetectorRef) {
        window.addEventListener("beforeunload", this.onClose);

        // Restore previously opened files.
        try {
            const openFilesJSON = localStorage.getItem("openFiles");
            if (openFilesJSON) {
                const openFilenames = JSON.parse(openFilesJSON) as string[];
                const selectedFile = localStorage.getItem("selectedFile");

                const promises = openFilenames.map((f) => {
                    return this.openFile(f);
                });

                if (selectedFile) {
                    Promise.all(promises).then(() => {
                        const found = [...this.tabs.entries()].find(([_, context]) => context.file !== undefined && compareFiles(selectedFile, context.file));
                        if (found) {
                            this.tabBar.active = found[0];
                        } else {
                            console.log("Unable to select previously selected file: ", selectedFile);
                        }
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    private propertiesPanelData = new PropertiesPanelData();
    // TODO: Keep this in sync with the directory for a loaded file, and remember last opened directory.
    private filesPanelData = new FilesPanelData("./examples");
    private toolsPanelData = new ToolsPanelData();

    private tabs = new Map<number, TabContext>();

    // Setup references to child components. These are setup by angular once ngAfterViewInit is called.
    @ViewChild(TabBarComponent) private tabBar: TabBarComponent;
    @ViewChild(StatusBarComponent) private statusBar: StatusBarComponent;
    @ViewChild(GraphEditorComponent) private graphEditor: GraphEditorComponent;
    @ViewChild("graphEditorContainer") private graphEditorContainer: ElementRef;
    @ViewChild("dynamicSidePanel") dynamicSidePanel: DynamicPanelComponent;
    @ViewChild("dynamicBottomPanel") dynamicBottomPanel: DynamicPanelComponent;

    sidePanels: DynamicPanelItem[];
    bottomPanels: DynamicPanelItem[];

    get maxSidePanelWidth() {
        return window.innerWidth / 2;
    }

    get minSidePanelWidth() {
        return 275;
    }

    get maxBottomPanelHeight() {
        return window.innerHeight - 55;
    }

    get minBottomPanelHeight() {
        return 175;
    }

    ngOnInit(): void {
        this.filesPanelData.openFile.asObservable().subscribe(this.openFile);
        this.sidePanels = [
            new DynamicPanelItem(FilesPanelComponent, this.filesPanelData, FILES_ICON.name, FILES_ICON.path)
        ];

        this.bottomPanels = [];

        this.tabBar.delegate = this;
        this.menu.addEventListener(this);
    }

    ngAfterViewInit() {
        this.dynamicSidePanel.width = 300;
        this.dynamicBottomPanel.height = 225;
    }

    ngAfterViewChecked() {
        // TODO: Let HTML resize this for us.
        this.graphEditor.height =
            this.graphEditorContainer.nativeElement.offsetHeight;
    }

    private _context?: TabContext;
    private set context(context: TabContext | undefined) {
        this._context = context;
        if (context) {
            context.compileProgram();

            this.toolsPanelData.graph = context.graph;
            this.filesPanelData.selectedFile = context.file;
            this.statusBar.info = context.statusBarInfo;

            context.graph.selectionChanged.asObservable().subscribe(evt => this.propertiesPanelData.selectedElements = evt);
            this.propertiesPanelData.selectedElements = context.graph.selectedElements;

            if (this.toolsPanelData.shouldDisplay && this.sidePanels.length < 3) {
                this.sidePanels = [
                    new DynamicPanelItem(PropertiesPanelComponent, this.propertiesPanelData, PROPERTIES_ICON.name, PROPERTIES_ICON.path),
                    new DynamicPanelItem(FilesPanelComponent, this.filesPanelData, FILES_ICON.name, FILES_ICON.path),
                    new DynamicPanelItem(ToolsPanelComponent, this.toolsPanelData, TOOLS_ICON.name, TOOLS_ICON.path)
                ];
            } else if (!this.toolsPanelData.shouldDisplay && this.sidePanels.length !== 2) {
                this.sidePanels = [
                    new DynamicPanelItem(PropertiesPanelComponent, this.propertiesPanelData, PROPERTIES_ICON.name, PROPERTIES_ICON.path),
                    new DynamicPanelItem(FilesPanelComponent, this.filesPanelData, FILES_ICON.name, FILES_ICON.path),
                ];
            }

            this.bottomPanels = [
                new DynamicPanelItem(InputPanelComponent, context.inputPanelData, INPUT_ICON.name, INPUT_ICON.path),
                new DynamicPanelItem(TestPanelComponent, context.testPanelData, TEST_ICON.name, TEST_ICON.path),
            ];
        } else {
            // Clear state
            this.filesPanelData.selectedFile = undefined;
            this.statusBar.info = undefined;
            this.toolsPanelData.graph = undefined;
            this.propertiesPanelData.selectedElements = undefined;
            this.sidePanels = [
                new DynamicPanelItem(FilesPanelComponent, this.filesPanelData, FILES_ICON.name, FILES_ICON.path)
            ];
            this.bottomPanels = [];
        }
    };

    /** Create a new tab and open it */
    newFile(kind: string[], file?: string, name?: string, content?: any) {
        // TODO: have a more efficient way to get kind.
        return this.pluginService.getPluginByKind(kind).then((plugin) => {
            const model = content ? Model.fromSerial(content, plugin) : new Model(plugin);

            const graph = new GraphController(model, plugin);
            const context = file ? TabContext.getSavedTabContext(graph, plugin, kind, file) :
                TabContext.getUnsavedTabContext(graph, plugin, kind, name);

            let tabNumber = this.tabBar.newTab(context);
            this.tabs.set(tabNumber, context);

            graph.changed.asObservable().subscribe(this.makeChangeNotifier(context));
            this.selectedTab(tabNumber);
        });
    }

    onClose = (e: any): any => {
        // Save what files are open
        const openFiles = ([...this.tabs.values()]
            .map((context) => context.file)
            .filter((path) => path !== undefined) as string[])
            .map((f) => getPath(f));
        localStorage.setItem("openFiles", JSON.stringify(openFiles));

        // Save what file is open
        localStorage.removeItem("selectedFile");
        if (this._context) {
            if (this._context.file) {
                localStorage.setItem("selectedFile", getPath(this._context.file));
            }
        }

        // TODO: Figure out WTF Electron is doing
        // const isDirty = [...this.tabs.values()].map((context) => context.file.dirty).reduce((dirty, accum) => (dirty || accum), false);
        // if (isDirty) {
        //     return confirm('You have unsaved files, are you sure you wish to quit?');
        // }
    }


    private makeChangeNotifier(context: TabContext) {
        return (change: UndoableEvent) => {
            context.compileProgram();
        };
    }

    async launchPluginManager() {
        const [info, result] = this.windowService.createModal("plugin-manager", ModalType.MODAL);
        await result;
        await this.pluginService.reload();
    }

    promptNewFile() {
        this.pluginService.pluginData.then((pluginData) => {
            let [_, result] = this.windowService.createModal("sinap-new-file", ModalType.MODAL, pluginData);
            result.then((result: NewFileResult) => {
                this.newFile(result.kind, undefined, result.name);
            });
        });
    }

    saveFile(context: TabContext) {
        // file should NOT be null.
        context.save().then(() => {
            this.changeDetectorRef.detectChanges();
        });
    }

    saveAsFile() {
        if (this._context) {
            const c = this._context;
            requestSaveFile(c.file).then(file => {
                if (file === c.file) {
                    this.saveFile(c);
                } else {
                    this.closeFile(file);
                    this.saveToFile(c, file).then(() => this.openFile(file));
                }
            }).catch(e => console.log(e));
        }
    }

    saveToFile(context: TabContext, file: string) {
        return writeData(context.getRawData(), file);
    }

    requestOpenFile() {
        requestFiles().then(files => files.forEach(file => this.openFile(file))).catch(e => console.log(e));
    }

    openFile = (file: string) => {
        return new Promise((resolve, reject) => {
            const entry = [...this.tabs.entries()].find(([_, context]) => context.file !== undefined && compareFiles(file, context.file));
            if (entry) {
                this.tabBar.active = entry[0];
                resolve();
            } else {
                readFile(file).then((content) => {
                    const pojo = JSON.parse(content);
                    this.newFile(pojo.kind, file, undefined, pojo.graph).then(() => resolve()).catch(reject);
                }).catch((e) => {
                    reject(e);
                });
            }
        });
    }

    closeFile(file: string) {
        const entry = [...this.tabs.entries()].find(([_, context]) => file === context.file);
        if (entry) {
            this.tabBar.deleteTab(entry[0]);
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




    /* ---------- TabBarDelegate ---------- */
    canDeleteTab(i: number) {
        const toDelete = this.tabs.get(i);
        if (!toDelete || !toDelete.unsaved) {
            return Promise.resolve(true);
        } else {
            return new Promise((resolve) => {
                dialog.showMessageBox(remote.BrowserWindow.getFocusedWindow(), {
                    type: "question",
                    buttons: ["Save", "Don't Save", "Cancel"],
                    defaultId: 2,
                    cancelId: 2,
                    message: "Save file before closing?",
                    detail: toDelete.file
                }, (choice) => {
                    if (choice === 0) {
                        toDelete.save().then(() => resolve(true)).catch(() => resolve(false));
                    } else resolve(choice === 1);
                });
            });

        }
    }

    deletedTab(i: number) {
        const toDelete = this.tabs.get(i);
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
                if (this._context) {
                    this.saveFile(this._context);
                }
                break;
            case MenuEventAction.SAVE_AS_FILE:
                this.saveAsFile();
                break;
            case MenuEventAction.DELETE:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph)
                        this.graphEditor.graph.deleteSelected();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.SELECT_ALL:
                // TODO:
                // Windows seems to be intercepting this call altogether
                // regardless of what has focus; i.e., this code never gets
                // executed when the user presses `ctrl+a`. Selecting the menu
                // item on Windows, however, does trigger this event.
                // console.log(e);
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph)
                        this.graphEditor.graph.selectAll();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.CLOSE:
                if (this._context) {
                    const found = [...this.tabs.entries()].find((v) => v[1] === this._context);
                    if (found) {
                        this.tabBar.deleteTab(found[0]);
                    }
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
                if (!this.focusIsChildOf("bottom-panel-group") && this._context) {
                    this._context.undo();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.REDO:
                if (!this.focusIsChildOf("bottom-panel-group") && this._context) {
                    this._context.redo();
                    e.preventDefault();
                }
                break;
<<<<<<< HEAD
            case MenuEventAction.CUT:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph)
                        this.graphEditor.saveSelection(true);
                    e.preventDefault();
                }
                break;
            case MenuEventAction.COPY:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph)
                        this.graphEditor.saveSelection();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.PASTE:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph)
                        this.graphEditor.cloneSelection();
                    e.preventDefault();
                }
=======
            case MenuEventAction.MANAGE_PLUGINS:
                this.launchPluginManager();
>>>>>>> master
                break;
        }
    }
    /* --------------------------------------- */


    /* ---------- Zoom Slider ---------- */


    private updateZoom(value: number) {
        if (this._context) {
            this._context.graph.drawable.scale = value;
        }
    }


    /* -------------------------------------- */
}
