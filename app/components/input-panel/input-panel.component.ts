// File: input-panel.component.ts
//

import { Component, ElementRef, ViewChild } from "@angular/core";
import { Output, Value } from "../../services/plugin.service";
import { Program } from "./../../services/plugin.service";
import { Type } from "sinap-core";

@Component({
    selector: "sinap-input-panel",
    templateUrl: "./input-panel.component.html",
    styleUrls: ["./input-panel.component.scss"]
})
export class InputPanelComponent {
    public program?: Program;
    public delegate: InputPanelDelegate;

    private results: ProgramResult[] = [];
    private selected: ProgramResult;
    private selectedState: any;

    private inputForPlugin = new Value("string", "");

    @ViewChild('log') log: ElementRef;

    private selectState(state: Value) {
        this.selectedState = state;
        if (state.type === "object" && state.value.active) {
            this.delegate.selectNode(state.value.active.value);
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
        }, 0);
    }

    /**
     * Returns a new object value that doesn't have a message property.
     */
    private stripMessage(state: Value) {
        if (state.type === "object") {
            let r = new Value("object", {});
            Object.keys(state.value).forEach((key) => {
                if (key !== "message") {
                    r.value[key] = state.value[key];
                }
            });

            return r;
        }

        return state;
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

    private onSubmit(input: Value) {
        let handleOutput = (output: Output | Error) => {
            let result: ProgramResult;

            if (output instanceof Output) {
                result = new ProgramResult(input, output);
            } else {
                let states = <Value[]> [];

                if (output.stack) {
                    states = output.stack.split("\n").map((frame) => {
                        return new Value("string", frame);
                    });
                    states.shift();
                    states.reverse();
                }
                result = new ProgramResult(input, new Output(states, new Value("error", output.message)));
                result.steps = states.length;
            }

            this.selected = result;
            this.results.unshift(result);

            if (result.output.states.length > 0) {
                this.selectedState = result.output.states[result.output.states.length - 1];
            }
        };

        try {
            let r = this.run(input.value);
            handleOutput(r);
        } catch (e) {
            handleOutput(e);
        }

        this.inputForPlugin = new Value("string", "");
        this.scrollToBottom();
    }

    private run(input: any): Output {
        if (this.program) {
            return this.program.run(input);
        } else {
            throw new Error("No Graph to Run");
        }
    }
}

export interface InputPanelDelegate {
    selectNode(n: any): void;
}

class ProgramResult {
    constructor(public readonly input: Value, public readonly output: Output) { };
    public steps = 0;
}
