// File: tab-context.ts
// Created by: Daniel James
// Date created: October 10, 2016
//

import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { Program, Plugin } from "sinap-core";
import { LocalFile } from "../../services/files.service";
import { StatusBarInfo } from "../../components/status-bar/status-bar.component";
import { InputPanelData } from "../input-panel/input-panel.component";
import { TestPanelData } from "../test-panel/test-panel.component";

/**
 * Stores the state of each open tab.
 */
export class TabContext {
    constructor(public readonly index: number, public graph: GraphController, public file: LocalFile, private plugin: Plugin, private kind: string[]) {
        this.statusBarInfo = {
            title: kind.length > 0 ? kind[kind.length - 1] : "",
            items: []
        };
        graph.changed.asObservable().subscribe(this.addUndoableEvent);
    };

    private readonly undoHistory: UndoableEvent[] = [];
    private readonly redoHistory: UndoableEvent[] = [];
    private stack = this.undoHistory;
    private isRedoing = false;

    public inputPanelData: InputPanelData = new InputPanelData();
    public testPanelData: TestPanelData = new TestPanelData();

    /** Whether a change has happened since the last time a program was compiled */
    private dirty = true;

    /**
     * The amount of changes to keep in the undo history. (and incidently the redo history)
     */
    private readonly UNDO_HISTORY_LENGTH = 100;

    /**
     * Shown below the graph editor on the blue status bar
     */
    public statusBarInfo: StatusBarInfo;


    /** Compile the graph with the plugin, and retains a cached copy for subsequent calls. */
    public compileProgram = (() => {
        let program: Program;

        return () => {
            if (!program || this.dirty) {
                program = this.plugin.makeProgram(this.graph.core);
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

            return program;
        };
    })();

    public invalidateProgram() {
        this.dirty = true;
    }

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

    public addUndoableEvent = (change: UndoableEvent) => {
        this.file.markDirty();

        this.stack.push(change);
        if (this.stack === this.undoHistory && !this.isRedoing) {
            this.redoHistory.length = 0;
        }


        if (this.undoHistory.length > this.UNDO_HISTORY_LENGTH) {
            this.undoHistory.shift();
        }
    }
}