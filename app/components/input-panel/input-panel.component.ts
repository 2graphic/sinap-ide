/**
 * @file `input-panel.component.ts`
 *
 * @author Daniel James
 *   <daniel.s.james@icloud.com>
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html}
 */

import { Component, ElementRef, ViewChild, AfterViewChecked, EventEmitter } from "@angular/core";
import { Program, Plugin } from "sinap-core";
import { Value, Type } from "sinap-types";
import { PanelComponent, TitlebarButton, TitleBarItems, TitlebarSpacer } from "../dynamic-panel/dynamic-panel";

export class InputPanelData {
    constructor() { }

    private _program?: Program;

    results: ProgramResult[] = [];
    selected: ProgramResult;
    selectedState: State;

    inputForPlugin?: Value.Value;

    get program() {
        return this._program;
    }

    set program(value: Program | undefined) {
        this._program = value;
        this.programChanged.emit(value);
    }

    readonly programChanged
    = new EventEmitter<Program | undefined>();
}

@Component({
    selector: "sinap-input-panel",
    templateUrl: "./input-panel.component.html",
    styleUrls: ["./input-panel.component.scss"]
})
export class InputPanelComponent implements AfterViewChecked, PanelComponent<InputPanelData>, TitleBarItems {
    private _data: InputPanelData;
    private shouldScroll = false;

    titlebarItems = [
        new TitlebarSpacer(),
        new TitlebarButton(`${require('../../images/play.svg')}`, "Step", false, false, () => this.step()),
        new TitlebarButton(`${require('../../images/play-finish.svg')}`, "Finish", false, false, () => this.stepFinish()),
        new TitlebarButton(`${require('../../images/play-all.svg')}`, "Step to Completion", false, false, () => this.stepToCompletion())
    ];

    set data(value: InputPanelData) {
        this._data = value;
        value.programChanged.asObservable().subscribe(p => {
            this.setupInput();
        });
        this.setupInput();
    }

    ngAfterViewChecked() {
        if (this.shouldScroll) {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
            this.shouldScroll = false;
        }
    };

    @ViewChild('log') log: ElementRef;

    private isErrorType(t: Type.Type) {
        return false; // TODO
    }

    private isObjectValue(v: Value.Value): v is Value.CustomObject {
        return v instanceof Value.CustomObject;
    }

    private selectState(state: State) {
        this._data.selectedState = state;
        // TODO
    }

    private scrollToBottom() {
        this.shouldScroll = true;
    }

    private setupInput() {
        if (this._data.program) {
            const plugin = ((this._data.program as any).plugin as Plugin);
            const type = plugin.argumentTypes[0];

            this._data.inputForPlugin = this._data.program.environment.make(type);
        }
    }

    private selectResult(c: ProgramResult) {
        this._data.selected = c;
        this.scrollToBottom();
    }

    private step(): boolean {
        if (this._data.selected && (this._data.selected.steps < this._data.selected.output.states.length)) {
            this.selectState(this._data.selected.output.states[this._data.selected.steps++]);
            this.scrollToBottom();
            return true;
        }

        return false;
    }

    private stepFinish() {
        if (this._data.selected) {
            this._data.selected.steps = this._data.selected.output.states.length - 1;
            this.selectState(this._data.selected.output.states[this._data.selected.steps++]);
            this.scrollToBottom();
        }
    }

    /**
     * Calls this.step() every 750 milliseconds as long as this.step() returns true.
     */
    private stepToCompletion() {
        let g: () => void;
        let f = () => {
            setTimeout(() => {
                g();
            }, 750);
        };

        g = () => {
            if (this.step()) {
                f();
            }
        };

        g();
    }

    private onSubmit(input: Value.Value) {
        const output = this.run(input);

        if (output && output.result) {
            const states = output.steps.map(s => new State(s));
            const result = new ProgramResult(input, new Output(states, output.result));

            console.log(result);

            this._data.selected = result;
            this._data.results.unshift(result);

            if (result.output.states.length > 0) {
                this._data.selectedState = result.output.states[0];
                result.steps++;
                this.selectState(result.output.states[0]);
            }

            this.setupInput();
            this.scrollToBottom();
        } else {
            // TODO
        }
    }

    private run(input: Value.Value) {
        if (this._data.program) {
            return this._data.program.run([input]);
        } else {
            console.log("no graph to run!");
        }

        return undefined;
    }
}

class Output {
    constructor(public readonly states: State[], public readonly result: Value.Value) { };
}

class State {
    message: Value.Value | undefined;
    state: Value.Value;

    constructor(value: Value.Value) {
        this.message = this.getMessage(value);
        this.state = this.stripMessage(value);
    }

    /**
     * Returns a new object value that doesn't have a message property.
     */
    private stripMessage(state: Value.Value) {
        // TODO
        return state;
    }

    private getMessage(state: Value.Value) {
        if (state instanceof Value.CustomObject && state.type.members.has("message")) {
            return state.get("message");
        }

        return undefined;
    }
}

class ProgramResult {
    constructor(public readonly input: Value.Value, public readonly output: Output) { };
    public steps = 0;

    public getStates() {
        return this.output.states.slice(0, this.steps);
    }
}
