// File: tab-context.ts
// Created by: Daniel James
// Date created: October 10, 2016
//

import { GraphController, UndoableEvent } from "../../models/graph-controller";
import { Program } from "sinap-core";
import { PluginService } from "../../services/plugin.service";
import { LocalFile } from "../../services/files.service";
import { StatusBarInfo } from "../../components/status-bar/status-bar.component";
import { DynamicPanelItem } from "../dynamic-panel/dynamic-panel";
import { InputPanelDelegate, InputPanelData } from "../input-panel/input-panel.component";
import { TestPanelData } from "../test-panel/test-panel.component";

/**
 * Stores the state of each open tab.
 */
export class TabContext implements InputPanelDelegate {
    constructor(public readonly index: number, public graph: GraphController, public file: LocalFile, private pluginService: PluginService) {
        this.statusBarInfo = {
            title: this.graph.plugin.pluginKind[this.graph.plugin.pluginKind.length - 1],
            items: []
        };

        graph.changed.asObservable().subscribe(this.addUndoableEvent);
    };

    private readonly undoHistory: UndoableEvent[] = [];
    private readonly redoHistory: UndoableEvent[] = [];
    private stack = this.undoHistory;
    private isRedoing = false;

    public inputPanelData: InputPanelData = new InputPanelData(this);
    public testPanelData: TestPanelData = new TestPanelData();
    public panels: DynamicPanelItem[];

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
        let cachedProgram: Promise<Program>;

        return () => {
            if (!cachedProgram || this.dirty) {
                return (cachedProgram = this.pluginService.getProgram(this.graph.plugin, this.graph.core).then((program) => {
                    this.statusBarInfo.items = program.validate();
                    this.inputPanelData.program = program;
                    this.testPanelData.program = program;
                    return program;
                }));
            } else {
                return cachedProgram;
            }
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

    selectNode(a: any) {
        // TODO: Fix everything
        let f = (element: any) => {
            for (let n of this.graph.drawable.nodes) {
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

        this.graph.drawable.clearSelection();
        this.graph.drawable.select(...toSelect);
    }
}