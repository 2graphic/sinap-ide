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

import { ResizeEvent } from 'angular-resizable-element';

export class ProgramInfo {
    constructor(public readonly program: Program, public readonly graph: GraphController) { };
}

export class InputPanelData {
    constructor() { }

    private _programInfo?: ProgramInfo;

    results: ProgramResult[] = [];
    selected: ProgramResult;
    selectedState: State;
    isDebugging = true;

    leftPanelWidth = 300;

    inputForPlugin?: Value.Value;

    get programInfo() {
        return this._programInfo;
    }

    set programInfo(value: ProgramInfo | undefined) {
        this._programInfo = value;
        this.programChanged.emit(value);
    }

    readonly programChanged
    = new EventEmitter<ProgramInfo | undefined>();
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
    private syncButton = new TitlebarButton("sync", "Step to Completion", false, this.stepToCompletion.bind(this));

    private updateButtons() {
        if (this._data.selected && this._data.isDebugging === true) {
            [this.stepForwardButton, this.stepLastButton, this.syncButton].forEach((b) => b.isDisabled = (this._data.selected.steps === this._data.selected.totalSteps));
            [this.stepFirstButton, this.stepBackwardButton].forEach((b) => b.isDisabled = (this._data.selected.steps === 0));
        } else {
            [this.stepFirstButton, this.stepBackwardButton, this.stepForwardButton, this.stepLastButton, this.syncButton].forEach((b) => b.isDisabled = true);
        }
    }

    titlebarItems = [
        this.toolbarSpacer,
        this.stepFirstButton,
        this.stepBackwardButton,
        this.stepForwardButton,
        this.stepLastButton,
        new TitlebarSpacer(),
        this.syncButton
    ];

    set data(value: InputPanelData) {
        this._data = value;
        value.programChanged.asObservable().subscribe(p => {
            this.setupInput();
        });
        this.setupInput();
        this.updateButtons();
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
        this._data.selectedState = state;
        if (this._data.programInfo) {
            if (state.state instanceof Value.CustomObject && state.state.type.members.has("active")) {
                const active = state.state.get("active");
                if (active instanceof Value.ArrayObject || active instanceof Value.SetObject) {
                    this._data.programInfo.graph.selectElements(...active.simpleRepresentation as ElementValue[]);
                } else if (active.type instanceof ElementType) {
                    this._data.programInfo.graph.selectElements(active as ElementValue);
                }
            }
        }

        this.updateButtons();
    }

    private scrollToBottom() {
        this.shouldScroll = true;
    }

    private setupInput() {
        if (this._data.programInfo) {
            const program = this._data.programInfo.program;
            const plugin = ((this._data.programInfo.program as any).plugin as Plugin);
            const type = plugin.types.arguments[0];

            let inputForPlugin: Value.Value | undefined = undefined;

            if ([...plugin.types.nodes.types.values()].find((t) => Type.isSubtype!(type, t.pluginType))) {
                inputForPlugin = program.model.nodes.values().next().value;
            }


            this._data.inputForPlugin = inputForPlugin ? inputForPlugin : this._data.programInfo.program.model.environment.make(type);

            console.log("Input for plugin", this._data.inputForPlugin);
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

    private step(): boolean {
        if (this._data.selected && (this._data.selected.steps < this._data.selected.output.states.length)) {
            this.selectState(this._data.selected.output.states[this._data.selected.steps++]);
            this.scrollToBottom();
            this.updateButtons();
            return true;
        }

        return false;
    }

    private stepFinish() {
        if (this._data.selected) {
            this._data.selected.steps = this._data.selected.output.states.length - 1;
            this.selectState(this._data.selected.output.states[this._data.selected.steps++]);
            this.scrollToBottom();
            this.updateButtons();
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

    private async onSubmit() {
        let input = this.inputComponent.value!;

        let inputDifferent: Value.Value | undefined;
        if (this._data.programInfo) {
            inputDifferent = this._data.programInfo.program.model.environment.values.get(input.uuid);
        }
        if (inputDifferent) {
            input = inputDifferent;
        }

        const output = await this.run(input);
        const states = output.steps.map(s => new State(s));
        const result = new ProgramResult(input, new Output(states, output.result));

        console.log("Run result", result);

        this._data.selected = result;
        this._data.results.unshift(result);
        this.updateButtons();
        this.setupInput();
        this.scrollToBottom();
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

    public get totalSteps() {
        return this.output.states.length;
    }
}
