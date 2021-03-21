// File: tab-context.ts
// Created by: Daniel James
// Date created: October 10, 2016
//

import { GraphController, UndoableEvent, Bridge } from "../../models/graph-controller";
import { Program, Plugin } from "sinap-core";
import { StatusBarInfo } from "../../components/status-bar/status-bar.component";
import { InputPanelData, ProgramInfo } from "../input-panel/input-panel.component";
import { PropertiesPanelData } from "../properties-panel/properties-panel.component";
import { TestPanelData } from "../test-panel/test-panel.component";
import { FileInfo } from "../../services/file-info";
import { FileService } from '../../services/file.service';

/**
 * Stores the state of each open tab.
 */
export class TabContext {
    private _graph: GraphController;

    private constructor(
        public internalGraph: GraphController,
        private plugin: Plugin, private kind: string[],
        private propertiesPanel: PropertiesPanelData,
        private fileService: FileService,
        public file?: FileInfo, tempName?: string,
    ) {
        this.statusBarInfo = {
            title: kind.length > 0 ? kind[kind.length - 1] : "",
            items: []
        };
        if (file) {
            this.name = file.name;
        } else if (tempName) {
            this.name = tempName;
        } else {
            this.name = "Untitled";
        }

        this.compileProgram();

        this.graph = internalGraph;

        internalGraph.changed.asObservable().subscribe(this.addUndoableEvent);
        internalGraph.selectionChanged.asObservable().subscribe((a) => {
            this.selected(a, internalGraph);
        });
        this.inputPanelData.setDebugging.asObservable().subscribe(this.setDebugging);
        this.inputPanelData.currentGraph = internalGraph;
    };

    public get graph() {
        return this._graph;
    }

    public set graph(g: GraphController) {
        this.propertiesPanel.isReadonly = (g === this.internalGraph) ? false : true;

        if (this._graph !== g) {
            this.propertiesPanel.selectedElements = g.selectedElements;

            this._graph = g;

            if (g !== this.internalGraph && !this.inputPanelData.startDebugging(g)) {
                this._graph = this.internalGraph;
            } else {
                this._graph = g;
            }
        }
    }

    private selected = (selected: Set<Bridge>, selectedGraph: GraphController) => {
        this.propertiesPanel.selectedElements = selected;
        this.graph = selectedGraph;
    }

    public setDebugging = (isDebugging: boolean) => {
        if (isDebugging && this.inputPanelData.selected) {
            this.graph = this.inputPanelData.selected.programInfo.graph;
            this.propertiesPanel.isReadonly = true;
        } else {
            this.graph = this.internalGraph;
            this.propertiesPanel.isReadonly = false;
        }
    }

    public stopDebugging = () => {
        this.inputPanelData.stopDebugging();
    }

    // TODO: no static
    static getUnsavedTabContext(graph: GraphController, plugin: Plugin, kind: string[], propertiesPanel: PropertiesPanelData, fileService: FileService, name?: string) {
        return new TabContext(graph, plugin, kind, propertiesPanel, fileService, undefined, name);
    }

    // TODO: no static 
    static getSavedTabContext(graph: GraphController, plugin: Plugin, kind: string[], propertiesPanel: PropertiesPanelData, fileService: FileService, file: FileInfo) {
        return new TabContext(graph, plugin, kind, propertiesPanel, fileService, file);
    }

    toString() {
        return this.name + (this._unsaved ? " ●" : "");
    }

    private readonly undoHistory: UndoableEvent[][] = [];
    private readonly redoHistory: UndoableEvent[][] = [];
    private name: string;
    private lastUpdated: Date;

    public inputPanelData: InputPanelData = new InputPanelData();
    public testPanelData: TestPanelData = new TestPanelData();

    /** Whether the files this tab represents needs to be saved */
    private _unsaved = false;

    /**
     * The amount of changes to keep in the undo history. (and incidently the redo history)
     */
    private readonly UNDO_HISTORY_LENGTH = 100;

    /**
     * Shown below the graph editor on the blue status bar
     */
    public statusBarInfo: StatusBarInfo;



    /** Compile the graph with the plugin, and retains a cached copy for subsequent calls. */
    public compileProgram() {
        this.plugin.makeProgram(this.internalGraph.core).then((program) => {
            const validation = program.validate();
            if (validation) {
                this.statusBarInfo.items = [validation.value.toString()];
            } else {
                this.statusBarInfo.items = [];
            }
            this.inputPanelData.program = program;
            this.testPanelData.program = program;

            if (this.inputPanelData.programInfo) {
                const g = this.inputPanelData.programInfo.graph;
                g.selectionChanged.asObservable().subscribe((a) => {
                    this.selected(a, g);
                });
            }
        }).catch((e) => console.log(e));
    }


    private hasOverflowedUndo = false;

    public undo() {
        const change = this.undoHistory.pop();
        if (change) {
            const redo = change.reverse().map(c => c.undo());
            this.recompileIfNeccesary(redo);
            this.redoHistory.push(redo);

            if (this.undoHistory.length === 0 && !this.hasOverflowedUndo) {
                this._unsaved = false;
            }
        }

        if (this.undoHistory.length === 0) {
            this.hasOverflowedUndo = false;
        }
    }

    public redo() {
        const change = this.redoHistory.pop();
        if (change) {
            const undo = change.reverse().map(c => c.undo());
            this.recompileIfNeccesary(undo);
            this._unsaved = true;
            this.undoHistory.push(undo);
        }
    }

    private timeoutId: number | undefined = undefined;
    private pendingChanges: UndoableEvent[] = [];

    public addUndoableEvent = (change: UndoableEvent) => {
        if (this.timeoutId !== undefined) clearTimeout(this.timeoutId);

        this.pendingChanges.push(change);

        this.timeoutId = setTimeout(() => {
            this.recompileIfNeccesary(this.pendingChanges);
            this._unsaved = true;

            this.redoHistory.length = 0;

            if (this.undoHistory.length >= this.UNDO_HISTORY_LENGTH) {
                this.hasOverflowedUndo = true;
                return;
            }

            this.undoHistory.push(this.pendingChanges);
            this.pendingChanges = [];
        }, 100) as any;
    }

    private recompileIfNeccesary(changes: UndoableEvent[]) {
        if (changes.reduce((b, c) => c.reloadProgram || b, false)) this.compileProgram();
    }

    public get unsaved(): boolean {
        return this._unsaved;
    }

    public getRawData() {
        return JSON.stringify({
            kind: this.internalGraph.plugin.pluginInfo.pluginKind,
            graph: this.internalGraph.core.serialize()
        }, null, 4);
    }

    public async save(): Promise<void> {
        if (this.file) {
            try {
                const data = this.getRawData();

                this.file.save(data);

                this._unsaved = false;
                this.compileProgram();
            } catch (e) {
                alert(`Error occurred while saving to file.`);
                throw e;
            }
        } else {
            this.file = await this.fileService.getSaveFile();
            this.name = this.file.name;
            return this.save();
        }
    }
}