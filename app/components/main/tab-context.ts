// File: tab-context.ts
// Created by: Daniel James
// Date created: October 10, 2016
//

import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { Program, Plugin } from "sinap-core";
import { StatusBarInfo } from "../../components/status-bar/status-bar.component";
import { InputPanelData, ProgramInfo } from "../input-panel/input-panel.component";
import { TestPanelData } from "../test-panel/test-panel.component";
import { writeData } from "../../util";
import { SINAP_FILE_FILTER } from "../../constants";

import { remote } from 'electron';
const { dialog, app } = remote;

import * as path from "path";

/**
 * Stores the state of each open tab.
 */
export class TabContext {
    private constructor(public graph: GraphController, private plugin: Plugin, private kind: string[], public file?: string, tempName?: string) {
        this.statusBarInfo = {
            title: kind.length > 0 ? kind[kind.length - 1] : "",
            items: []
        };
        if (file) {
            this.name = path.basename(file, ".sinap");
        } else if (tempName) {
            this.name = tempName;
        } else {
            this.name = "Untitled";
        }

        this.compileProgram();

        graph.changed.asObservable().subscribe(this.addUndoableEvent);
    };

    static getUnsavedTabContext(graph: GraphController, plugin: Plugin, kind: string[], name?: string) {
        return new TabContext(graph, plugin, kind, undefined, name);
    }

    static getSavedTabContext(graph: GraphController, plugin: Plugin, kind: string[], file: string) {
        // TODO: Move file loading here
        return new TabContext(graph, plugin, kind, file);
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
        const program = this.plugin.makeProgram(this.graph.core);
        const validation = program.validate();
        if (validation) {
            this.statusBarInfo.items = [validation.value.toString()];
        } else {
            this.statusBarInfo.items = [];
        }
        this.inputPanelData.program = program;
        this.testPanelData.program = program;

        return program;
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
            kind: this.graph.plugin.pluginInfo.pluginKind,
            graph: this.graph.core.serialize()
        }, null, 4);
    }

    public save() {
        const data = this.getRawData();

        return new Promise((resolve, reject) => {
            const saved = () => {
                this._unsaved = false;
                resolve();
            };

            const failedToSave = (e: Error) => {
                dialog.showErrorBox("Unable to Save", `Error occurred while saving to file:\n${this.file}.`);
                reject(e);
            };

            if (this.file) {
                writeData(this.file, data).then(saved).catch(failedToSave);
            } else {
                this.chooseFile().then((file) => {
                    writeData(file, data).then(saved).catch(failedToSave);
                });
            }
        });
    }

    private chooseFile(): Promise<string> {
        return new Promise((resolve) => {
            dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
                defaultPath: this.name,
                filters: SINAP_FILE_FILTER
            }, (name) => {
                if (name) {
                    this.file = name;
                    this.name = path.basename(name, ".sinap");
                    resolve(this.file);
                }
            });
        });
    }
}