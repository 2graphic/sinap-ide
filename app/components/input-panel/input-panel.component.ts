// File: input-panel.component.ts
//

import { Component, ElementRef, ViewChild } from "@angular/core";
import { Type, Program, CoreValue, ObjectType, Plugin } from "sinap-core";
import { Output, isOutput } from "./../../services/plugin.service";

@Component({
    selector: "sinap-input-panel",
    templateUrl: "./input-panel.component.html",
    styleUrls: ["./input-panel.component.scss"]
})
export class InputPanelComponent {
    public _program?: Program;

    set program(program: Program | undefined) {
        this._program = program;
        this.setupInput();
    }

    get program() {
        return this._program;
    }

    public delegate: InputPanelDelegate;

    private results: ProgramResult[] = [];
    private selected: ProgramResult;
    private selectedState: any;

    private inputForPlugin?: CoreValue;

    @ViewChild('log') log: ElementRef;

    private selectState(state: CoreValue) {
        this.selectedState = state;
        if (state.type instanceof ObjectType && state.data.active) {
            this.delegate.selectNode(state.data.active);
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
        }, 0);
    }

    private getStringType() {
        return ((this.program as any).plugin as Plugin).typeEnvironment.getStringType();
    }

    private getInputType() {
        if (this.program) {
            return this.getStringType();
        }

        throw "No program";
    }

    private setupInput() {
        this.inputForPlugin = new CoreValue(this.getInputType(), "");
    }

    /**
     * Returns a new object value that doesn't have a message property.
     */
    private stripMessage(state: CoreValue) {
        return state;
    }

    getMessage(state: CoreValue) {
        if (this.program && state.type instanceof ObjectType) {
            return new CoreValue(state.type.members.get("message") as Type, state.data.message);
        }

        return new CoreValue(this.getStringType(), "");
    }

    isObjectType(state: CoreValue) {
        return (state.type instanceof ObjectType);
    }

    private selectResult(c: ProgramResult) {
        this.selected = c;
        this.scrollToBottom();
    }

    private step(): boolean {
        if (this.selected && (this.selected.steps < this.selected.output.states.length)) {
            this.selectState(this.selected.output.states[this.selected.steps]);
            this.selected.steps++;
            this.scrollToBottom();
            return true;
        }

        return false;
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

    private getStates(selected: ProgramResult) {
        return selected.output.states.slice(0, selected.steps);
    }

    private onSubmit(input: CoreValue) {
        let handleOutput = (output: Output | Error) => {
            let result: ProgramResult;

            if (isOutput(output)) {
                result = new ProgramResult(input, output);
            } else {
                let states: CoreValue[] = [];

                if (output.stack) {
                    states = output.stack.split("\n").map((frame) => {
                        return new CoreValue(this.getStringType(), frame);
                    });
                    states.shift();
                    states.reverse();
                }
                result = new ProgramResult(input, new Output(states, new CoreValue(this.getStringType(), output.message)));
                result.steps = states.length;
            }

            this.selected = result;
            this.results.unshift(result);

            if (result.output.states.length > 0) {
                this.selectedState = result.output.states[result.output.states.length - 1];
            }
        };

        try {
            let r = this.run(input);
            handleOutput(r);
        } catch (e) {
            handleOutput(e);
        }

        this.setupInput();
        this.scrollToBottom();
    }

    private run(input: CoreValue): Output {
        if (this.program) {
            return this.program.run([input]);
        } else {
            throw new Error("No Graph to Run");
        }
    }
}

export interface InputPanelDelegate {
    selectNode(n: any): void;
}

class ProgramResult {
    constructor(public readonly input: CoreValue, public readonly output: Output) { };
    public steps = 0;
}
