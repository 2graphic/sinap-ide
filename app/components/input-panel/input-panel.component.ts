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
import { Program, Plugin, ElementType, ElementValue } from "sinap-core";
import { Value, Type } from "sinap-types";
import { PanelComponent, TitlebarButton, TitleBarItems, TitlebarSpacer } from "../dynamic-panel/dynamic-panel";
import { TypeInjectorComponent } from "../types/type-injector/type-injector.component";
import { GraphController } from "../../models/graph-controller";
import { getInput } from "../../util";

import { ResizeEvent } from 'angular-resizable-element';

export class ProgramInfo {
    constructor(public readonly program: Program, public readonly graph: GraphController) { };
}

export class InputPanelData {
    constructor() { }

    private _programInfo?: ProgramInfo;
    public currentGraph: GraphController;

    results: ProgramResult[] = [];
    selected: ProgramResult;
    selectedState: State;

    leftPanelWidth = 300;

    inputForPlugin?: Value.Value;

    get programInfo() {
        return this._programInfo;
    }

    set program(program: Program | undefined) {
        if (program) {
            const graph = new GraphController(program.model, program.plugin);
            graph.drawable.isReadonly = true;
            this._programInfo = new ProgramInfo(program, graph);
        } else {
            this._programInfo = undefined;
        }

        this.programChanged.emit(this._programInfo);
    }

    startDebugging(g: GraphController) {
        const found = this.selected.programInfo.graph === g ? this.selected : this.results.find(r => r.programInfo.graph === g);
        if (found) {
            this.selected = found;
            this.setDebugging.emit(true);
            return true;
        } else {
            return false;
        }
    }

    readonly programChanged
    = new EventEmitter<ProgramInfo | undefined>();

    readonly setDebugging
    = new EventEmitter<boolean>();
}

@Component({
    selector: "sinap-input-panel",
    templateUrl: "./input-panel.component.html",
    styleUrls: ["./input-panel.component.scss"]
})
export class InputPanelComponent implements AfterViewChecked, PanelComponent<InputPanelData>, TitleBarItems {
    private _data: InputPanelData;
    private shouldScroll = false;

    private toolbarSpacer = new TitlebarSpacer(240);
    private stepFirstButton = new TitlebarButton("first_page", "Finish", false, this.stepFirst.bind(this));
    private stepBackwardButton = new TitlebarButton("arrow_back", "Step", false, this.stepBackward.bind(this));
    private stepForwardButton = new TitlebarButton("arrow_forward", "Step", false, this.step.bind(this));
    private stepLastButton = new TitlebarButton("last_page", "Finish", false, this.stepFinish.bind(this));
    private debugStopButton = new TitlebarButton("stop", "Stop Debugging", false, this.stopDebugging.bind(this));

    private updateButtons() {
        [this.stepFirstButton, this.stepBackwardButton, this.stepForwardButton, this.stepLastButton, this.debugStopButton].forEach((b) => b.isDisabled = true);

        if (this._data.selected && this._data.selected.isDebugging === true) {
            this.debugStopButton.isDisabled = false;
            [this.stepForwardButton, this.stepLastButton].forEach((b) => b.isDisabled = (this._data.selected.steps === this._data.selected.totalSteps));
            [this.stepFirstButton, this.stepBackwardButton].forEach((b) => b.isDisabled = (this._data.selected.steps === 0));
        }
    }

    titlebarItems = [
        this.toolbarSpacer,
        this.stepFirstButton,
        this.stepBackwardButton,
        this.stepForwardButton,
        this.stepLastButton,
        new TitlebarSpacer(),
        this.debugStopButton
    ];

    set data(value: InputPanelData) {
        this._data = value;
        value.programChanged.asObservable().subscribe(p => {
            this.setupInput();
        });
        value.setDebugging.asObservable().subscribe(b => {
            b === true ? this.startDebugging(false) : this.stopDebugging();
        });
        this.setupInput();
        this.updateButtons();
        this.scrollToBottom();
    }

    ngAfterViewChecked() {
        if (this.shouldScroll) {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
            this.shouldScroll = false;
        }
    };

    @ViewChild('log') log: ElementRef;
    @ViewChild('inputComponent') inputComponent: TypeInjectorComponent;

    private isErrorType(t: Type.Type) {
        return false; // TODO
    }

    private isObjectValue(v: Value.Value): v is Value.CustomObject {
        return v instanceof Value.CustomObject;
    }

    private selectState(state: State) {
        if (this._data.selected) {
            this._data.selectedState = state;
            this.startDebugging(false);
            this.updateButtons();

            if (state.state instanceof Value.CustomObject && state.state.type.members.has("active")) {
                const active = state.state.get("active");
                if (active instanceof Value.ArrayObject || active instanceof Value.SetObject) {
                    this._data.selected.programInfo.graph.selectElements(...active.simpleRepresentation as ElementValue[]);
                } else if (active.type instanceof ElementType) {
                    this._data.selected.programInfo.graph.selectElements(active as ElementValue);
                } else if (active instanceof Value.Union && active.value.type instanceof ElementType) {
                    this._data.selected.programInfo.graph.selectElements(active.value as ElementValue);
                }
            }
        }
    }

    private scrollToBottom() {
        this.shouldScroll = true;
    }

    private setupInput() {
        if (this._data.programInfo) {
            this._data.inputForPlugin = getInput(this._data.programInfo.program);
        }
    }

    private selectResult(c: ProgramResult) {
        this._data.selected = c;
        this.scrollToBottom();
        this.updateButtons();
    }

    private stepFirst() {
        if (this._data.selected) {
            this._data.selected.steps = 0;
            this.scrollToBottom();
            this.updateButtons();
        }
    }

    private stepBackward() {
        if (this._data.selected && (this._data.selected.steps > 0)) {
            this._data.selected.steps--;
            if (this._data.selected.steps > 0) {
                this.selectState(this._data.selected.output.states[this._data.selected.steps - 1]);
            }
            this.scrollToBottom();
            this.updateButtons();
        }
    }

    private step() {
        if (this._data.selected && (this._data.selected.steps < this._data.selected.output.states.length)) {
            this.selectState(this._data.selected.output.states[this._data.selected.steps++]);
            this.scrollToBottom();
            this.updateButtons();
        }
    }

    private stepFinish() {
        if (this._data.selected) {
            this._data.selected.steps = this._data.selected.output.states.length - 1;
            this.selectState(this._data.selected.output.states[this._data.selected.steps++]);
            this.scrollToBottom();
            this.updateButtons();
        }
    }

    private async onSubmit() {
        if (this._data.programInfo && (!this._data.selected || !this._data.selected.isDebugging)) {
            let input = this.inputComponent.value!;

            let inputDifferent: Value.Value | undefined = this._data.programInfo.program.model.environment.values.get(input.uuid);
            if (inputDifferent) {
                input = inputDifferent;
            }

            const output = await this.run(input);
            const states = output.steps.map(s => new State(s));
            const result = new ProgramResult(input, new Output(states, output.result), this._data.programInfo);

            console.log("Run result", result);

            this._data.selected = result;
            this._data.results.unshift(result);
            this.updateButtons();
            this.setupInput();
            this.scrollToBottom();
        }
    }

    private async run(input: Value.Value) {
        if (this._data.programInfo) {
            const output = await this._data.programInfo.program.run([input]);
            if (output.result) {
                return {
                    result: output.result,
                    steps: output.steps
                };
            } else {
                // TODO:
                throw new Error("Daniel should fix this 1");
            }
        }
        throw new Error("Daniel should fix this 2");
    }

    private resizing(evt: ResizeEvent) {
        if (evt.rectangle.width) {
            this._data.leftPanelWidth = Math.max(evt.rectangle.width, 200); // TODO, max value
            this.toolbarSpacer.width = this._data.leftPanelWidth - 60;
        }
    }

    private startDebugging(reset: boolean = true) {
        if (this._data.selected && this._data.selected.isDebugging === false) {
            this._data.selected.isDebugging = true;
            this._data.setDebugging.emit(true);

            if (reset) {
                this._data.selected.steps = Math.min(1, this._data.selected.totalSteps - 1);
                if (this._data.selected.steps) {
                    this.selectState(this._data.selected.getStates()[0]);
                }
            }
        }

        this.updateButtons();
    }

    private stopDebugging() {
        if (this._data.selected && this._data.selected.isDebugging === true) {
            this._data.selected.isDebugging = false;
            this._data.setDebugging.emit(false);
            this.scrollToBottom();
        }

        this.updateButtons();
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
        if (state instanceof Value.CustomObject && (state.type as any)._visibility) {
            (state.type as any)._visibility.set("message", false); // TODO, set visiblity
        }
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
    isDebugging = false;

    constructor(public readonly input: Value.Value, public readonly output: Output, public programInfo: ProgramInfo) { };
    public steps = 0;

    public getStates() {
        return this.output.states.slice(0, this.steps);
    }

    public get totalSteps() {
        return this.output.states.length;
    }
}
