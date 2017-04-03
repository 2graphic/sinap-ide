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
import { Type, Program, CoreValue, isObjectType, Plugin, FakeObjectType } from "sinap-core";
import { PanelComponent, TitlebarButton, TitleBarItems, TitlebarSpacer } from "../dynamic-panel/dynamic-panel";

export class InputPanelData {
    constructor() { }

    private _program?: Program;

    results: ProgramResult[] = [];
    selected: ProgramResult;
    selectedState: State;

    inputForPlugin?: CoreValue;

    shouldScroll = false;

    isObjectType = isObjectType;

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
        if (this._data.shouldScroll) {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
            this._data.shouldScroll = false;
        }
    };

    @ViewChild('log') log: ElementRef;

    private isErrorType(t: Type) {
        return t.isAssignableTo((t.env as any).lookupPluginType("Error"));
    }

    private selectState(state: State) {
        this._data.selectedState = state;
        // this._data.delegate.selectNode(state.state.value.active);
    }

    private scrollToBottom() {
        this._data.shouldScroll = true;
    }

    private getStringType(program: Program) {
        return program.plugin.typeEnvironment.getStringType();
    }

    private setupInput() {
        if (this._data.program) {
            let type = this._data.program.runArguments[0][0];

            if (type.name === "InputType") {
                const members = new Map<string, Type>();
                members.set("a", this._data.program.plugin.typeEnvironment.getBooleanType());
                members.set("b", this._data.program.plugin.typeEnvironment.getBooleanType());
                this._data.inputForPlugin = new CoreValue(new FakeObjectType(this._data.program.plugin.typeEnvironment, members), {
                    "a": false,
                    "b": false
                });
            } else {
                this._data.inputForPlugin = new CoreValue(type, "");
            }
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

    private onSubmit(input: CoreValue) {
        const output = this.run(input);
        if (output) {
            const states = output.states.map(s => new State(s));
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
        }
    }

    private run(input: CoreValue) {
        if (this._data.program) {
            return this._data.program.run([input]);
        } else {
            console.log("no graph to run!");
        }

        return undefined;
    }
}

class Output {
    constructor(public readonly states: State[], public readonly result: CoreValue) { };
}

class State {
    message: CoreValue | undefined;
    state: CoreValue;

    constructor(value: CoreValue) {
        this.message = this.getMessage(value);
        this.state = this.stripMessage(value);
    }

    /**
     * Returns a new object value that doesn't have a message property.
     */
    private stripMessage(state: CoreValue) {
        if (isObjectType(state.type)) {
            const members = new Map(state.type.members);
            members.delete("message");
            return new CoreValue(new FakeObjectType(state.type.env, members), state.value);
        } else {
            return state;
        }
    }

    private getMessage(state: CoreValue) {
        if (isObjectType(state.type)) {
            const type = state.type.members.get("message");
            if (type) {
                return new CoreValue(type, state.value.message);
            }
        }

        return undefined;
    }
}

class ProgramResult {
    constructor(public readonly input: CoreValue, public readonly output: Output) { };
    public steps = 0;

    public getStates() {
        return this.output.states.slice(0, this.steps);
    }
}
