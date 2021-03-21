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
import { Program, Plugin, Model, NodePromise } from "sinap-core";
import { GraphEditorComponent } from "../graph-editor/graph-editor.component";
import { DynamicPanelComponent, DynamicPanelItem, DynamicTestPanelComponent } from "../dynamic-panel/dynamic-panel";
import { PropertiesPanelComponent, PropertiesPanelData } from "../properties-panel/properties-panel.component";
import { FilesPanelComponent, FilesPanelData } from "../files-panel/files-panel.component";
import { ToolsPanelComponent, ToolsPanelData } from "../tools-panel/tools-panel.component";
import { InputPanelComponent } from "../input-panel/input-panel.component";
import { TestPanelComponent } from "../test-panel/test-panel.component";
import { StatusBarComponent } from "../status-bar/status-bar.component";
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component";
import { NewFileResult, NewFileComponent, NewFileComponentInfo } from '../new-file/new-file.component';
import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { PluginService } from "../../services/plugin.service";
import { TabContext } from "./tab-context";
import { PROPERTIES_ICON, TOOLS_ICON, FILES_ICON, INPUT_ICON, TEST_ICON } from "./icons";
import { ComponentInfo } from "../dynamic-component/dynamic-component.component";
import {MenuService, MenuEventAction, MenuEventListener, MenuEvent} from '../../services/menu.service';
import { FileInfo } from "../../services/file-info";
import { FileService } from "../../services/file.service";

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
})
export class MainComponent implements OnInit, AfterViewInit, AfterViewChecked, MenuEventListener, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private fileService: FileService, private changeDetectorRef: ChangeDetectorRef) {
        window.addEventListener("beforeunload", this.onClose);

        document.body.ondrop = (ev) => {
            // TODO: fix drag and drop files
        };

        // TODO: Restore previously opened files.
    }

    private propertiesPanelData = new PropertiesPanelData();
    private filesPanelData = new FilesPanelData();
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
        this.filesPanelData.openFile.asObservable().subscribe(file => {
            if (file) {
                this.openFile(file);
            }
        });
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

    private modal?: ComponentInfo<any>;

    private _context?: TabContext;
    private set context(context: TabContext | undefined) {
        this._context = context;
        if (context) {
            this.toolsPanelData.graph = context.internalGraph;
            this.filesPanelData.selectedFile = context.file;
            this.statusBar.info = context.statusBarInfo;

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
    newFile(kind: string[], file?: FileInfo, name?: string, content?: any) {
        // TODO: have a more efficient way to get kind.
        return this.pluginService.getPluginByKind(kind).then((plugin) => {
            const model = content ? Model.fromSerial(content, plugin) : new Model(plugin);

            const graph = new GraphController(model, plugin);
            const context = file ? TabContext.getSavedTabContext(graph, plugin, kind, this.propertiesPanelData, this.fileService, file) :
                TabContext.getUnsavedTabContext(graph, plugin, kind, this.propertiesPanelData, this.fileService, name);

            let tabNumber = this.tabBar.newTab(context);
            this.tabs.set(tabNumber, context);

            this.selectedTab(tabNumber);
        });
    }

    onClose = (e: any): any => {
        // Save what files are open
        const openFiles = ([...this.tabs.values()]
            .map((context) => context.file)
            .filter((path) => path !== undefined) as FileInfo[]);

        // TODO: Ask to save dirty files before closing
        // const isDirty = [...this.tabs.values()].map((context) => context.file.dirty).reduce((dirty, accum) => (dirty || accum), false);
        // if (isDirty) {
        //     return confirm('You have unsaved files, are you sure you wish to quit?');
        // }
    }

    launchPluginManager() {
    }

    promptNewFile() {
        const alreadyOpen = [...this.tabs.entries()].find(([, tab]) => tab instanceof NewFileComponentInfo);
        if (alreadyOpen) {
            this.tabBar.active = alreadyOpen[0];
        } else {
            this.pluginService.pluginData.then((pluginData) => {
                const modal = new NewFileComponentInfo("New File", NewFileComponent);
                this.modal = modal;

                modal.onResult = (result?: NewFileResult) => {
                    this.modal = undefined;
                    if (result) {
                        this.newFile(result.kind, undefined, result.name);
                    }
                };
            });
        }
    }

    saveFile(context: TabContext) {
        // file should NOT be null.
        context.save().then(() => {
            this.changeDetectorRef.detectChanges();
        });
    }

    saveAsFile() {
        // TODO: 
    }

    requestOpenFile() {
        // TODO: 
    }

    openFile = (file: FileInfo) => {
        return new Promise((resolve, reject) => {
            const entry = [...this.tabs.entries()].find(([_, context]) => context.file !== undefined && file == context.file);
            if (entry) {
                this.tabBar.active = entry[0];
                resolve();
            } else {
                file.open().then((content) => {
                    const pojo = JSON.parse(content);
                    this.newFile(pojo.kind, file, undefined, pojo.graph).then(() => resolve()).catch(reject);
                }).catch((e) => {
                    reject(e);
                });
            }
        });
    }

    closeFile(file: FileInfo) {
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
            return Promise.resolve(confirm("Close file without saving?"));
        }
    }

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
                e.event.preventDefault();
                break;
            case MenuEventAction.OPEN_FILE:
                this.requestOpenFile();
                e.event.preventDefault();
                break;
            case MenuEventAction.SAVE_FILE:
                if (this._context) {
                    this.saveFile(this._context);
                    e.event.preventDefault();
                }
                break;
            case MenuEventAction.SAVE_AS_FILE:
                this.saveAsFile();
                break;
            case MenuEventAction.DELETE:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph) {
                        this.graphEditor.graph.deleteSelected();
                        e.event.preventDefault();
                    }
                }
                break;
            case MenuEventAction.SELECT_ALL:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph) {
                        this.graphEditor.graph.selectAll();
                        e.event.preventDefault();
                    }
                }
                break;
            case MenuEventAction.CLOSE:
                if (this._context) {
                    const found = [...this.tabs.entries()].find((v) => v[1] === this._context);
                    if (found) {
                        this.tabBar.deleteTab(found[0]);
                    }
                    e.event.preventDefault();
                }
                break;
            case MenuEventAction.PREVIOUS_TAB:
                this.tabBar.selectPreviousTab();
                e.event.preventDefault();
                break;
            case MenuEventAction.NEXT_TAB:
                this.tabBar.selectNextTab();
                e.event.preventDefault();
                break;
            case MenuEventAction.UNDO:
                if (!this.focusIsChildOf("bottom-panel-group") && this._context) {
                    this._context.undo();
                    e.event.preventDefault();
                }
                break;
            case MenuEventAction.REDO:
                if (!this.focusIsChildOf("bottom-panel-group") && this._context) {
                    this._context.redo();
                    e.event.preventDefault();
                }
                break;
            case MenuEventAction.CUT:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph) {
                        this.graphEditor.saveSelection(true);
                        e.event.preventDefault();
                    }
                }
                break;
            case MenuEventAction.COPY:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph) {
                        this.graphEditor.saveSelection();
                        e.event.preventDefault();
                    }
                }
                break;
            case MenuEventAction.PASTE:
                if (this.focusIsChildOf("graph-editor-container")) {
                    if (this.graphEditor.graph) {
                        this.graphEditor.cloneSelection();
                        e.event.preventDefault();
                    }
                }
                break;
            case MenuEventAction.MANAGE_PLUGINS:
                this.launchPluginManager();
                e.event.preventDefault();
                break;
            case MenuEventAction.REFRESH_PLUGINS:
                this.pluginService.reload();
                e.event.preventDefault();
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

    private isFullscreen() {
        return this.dynamicBottomPanel.isCollapsed && this.dynamicSidePanel.isCollapsed;
    }

    private toggleFullscreen() {
        const hide = !this.isFullscreen();

        this.dynamicSidePanel.isCollapsed = hide;
        this.dynamicBottomPanel.isCollapsed = hide;
    }


    /* -------------------------------------- */
}
