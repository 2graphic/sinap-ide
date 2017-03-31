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
import { CoreElement, CoreModel, CoreElementKind, CoreValue, Program, SerialJSO } from "sinap-core";

import { GraphEditorComponent } from "../graph-editor/graph-editor.component";

import { DynamicPanelComponent, DynamicPanelItem, DynamicTestPanelComponent } from "../dynamic-panel/dynamic-panel";
import { PropertiesPanelComponent, PropertiesPanelData } from "../properties-panel/properties-panel.component";
import { FilesPanelComponent, FilesPanelData } from "../files-panel/files-panel.component";
import { ToolsPanelComponent, ToolsPanelData } from "../tools-panel/tools-panel.component";
import { InputPanelComponent, InputPanelDelegate, InputPanelData } from "../input-panel/input-panel.component";
import { TestPanelComponent, TestPanelData } from "../test-panel/test-panel.component";

import { StatusBarComponent } from "../status-bar/status-bar.component";
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
export class MainComponent implements OnInit, AfterViewInit, AfterViewChecked, MenuEventListener, InputPanelDelegate, TabDelegate {
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

    private propertiesPanelData = new PropertiesPanelData();
    // TODO: Keep this in sync with the directory for a loaded file, and remember last opened directory.
    private filesPanelData = new FilesPanelData("./examples");
    private toolsPanelData = new ToolsPanelData();
    private inputPanelData = new InputPanelData(this);
    private testPanelData = new TestPanelData();

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

        this.bottomPanels = [
            new DynamicPanelItem(InputPanelComponent, this.inputPanelData, INPUT_ICON.name, INPUT_ICON.path),
            new DynamicPanelItem(TestPanelComponent, this.testPanelData, TEST_ICON.name, TEST_ICON.path),
        ];

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
            this.graphEditorContainer.nativeElement.offsetHeight
            - this.tabBar.offsetHeight - this.statusBar.offsetHeight;
    }

    private _context?: TabContext;
    private set context(context: TabContext | undefined) {
        this._context = context;
        if (context) {
            context.compileProgram().then(this.onNewProgram);

            this.toolsPanelData.graph = context.graph;
            this.filesPanelData.selectedFile = context.file;
            this.statusBar.info = context.statusBarInfo;

            context.graph.selectionChangedEvent.asObservable().subscribe(evt => this.propertiesPanelData.selectedElements = evt);
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
        } else {
            // Clear state
            this.filesPanelData.selectedFile = null;
            this.statusBar.info = undefined;
            this.toolsPanelData.graph = undefined;
            this.propertiesPanelData.selectedElements = null;
            this.sidePanels = [
                new DynamicPanelItem(FilesPanelComponent, this.filesPanelData, FILES_ICON.name, FILES_ICON.path)
            ];
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
        this.testPanelData.program = program;
        this.inputPanelData.program = program;
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




    selectNode(a: any) {
        // TODO: Fix everything
        if (this._context) {
            let f = (element: any) => {
                for (let n of this._context!.graph.drawable.nodes) {
                    if (n.label === element.label) {
                        toSelect.push(n);
                    }
                }
            };

            const toSelect: any[] = [];
            if (Array.isArray(a)) {
                a.forEach(f);
            } else {
                f(a);
            }

            this._context.graph.drawable.clearSelection();
            this._context.graph.drawable.select(...toSelect);
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
                if (this.focusIsChildOf("editor-panel")) {
                    if (this.graphEditor.graph)
                        this.graphEditor.graph.selectAll();
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


    /* ---------- Zoom Slider ---------- */


    private updateZoom(value: number) {
        if (this._context) {
            this._context.graph.drawable.scale = value;
        }
    }


    /* -------------------------------------- */
}
