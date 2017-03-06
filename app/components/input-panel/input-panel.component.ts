// File: input-panel.component.ts
//

import { Component, ElementRef, ViewChild, AfterViewChecked } from "@angular/core";
import { Type, Program, CoreValue, isObjectType, Plugin, FakeObjectType } from "sinap-core";

@Component({
    selector: "sinap-input-panel",
    templateUrl: "./input-panel.component.html",
    styleUrls: ["./input-panel.component.scss"]
})
export class InputPanelComponent implements AfterViewChecked {
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
    private selectedState: CoreValue;

    private inputForPlugin?: CoreValue;

    private shouldScroll = false;
    ngAfterViewChecked() {
        if (this.shouldScroll) {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
            this.shouldScroll = false;
        }
    };

    @ViewChild('log') log: ElementRef;

    private isObjectType = isObjectType;
    private isErrorType(t: Type) {
        return t.isAssignableTo((t.env as any).lookupPluginType("Error"));
    }

    private selectState(state: CoreValue) {
        this.selectedState = state;
        if (isObjectType(state.type) && state.value.active) {
            this.delegate.selectNode(state.value.active);
        }
    }

    private scrollToBottom() {
        this.shouldScroll = true;
    }

    private getStringType(program: Program) {
        return program.plugin.typeEnvironment.getStringType();
    }

    private getInputType() {
        if (this.program) {
            return this.getStringType(this.program);
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
        if (isObjectType(state.type)) {
            const members = new Map(state.type.members);
            members.delete("message");
            return new CoreValue(new FakeObjectType(state.type.env, members), state.value);
        } else {
            return state;
        }
    }

    getMessage(state: CoreValue) {
        if (this.program) {
            if (isObjectType(state.type)) {
                const type = state.type.members.get("message");
                if (type) {
                    return new CoreValue(type, state.value.message);
                }
            } else {
                return new CoreValue(this.getStringType(this.program), "");
            }
        }

        return undefined;
    }

    private selectResult(c: ProgramResult) {
        this.selected = c;
        this.scrollToBottom();
    }

    private step(): boolean {
        if (this.selected && (this.selected.steps < this.selected.output.states.length)) {
            this.selectState(this.selected.output.states[this.selected.steps++]);
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

    private onSubmit(input: CoreValue) {
        const output = this.run(input);

        if (output) {
            let result = new ProgramResult(input, output);
            console.log(result);

            this.selected = result;
            this.results.unshift(result);

            if (result.output.states.length > 0) {
                this.selectedState = result.output.states[0];
                result.steps++;
                this.selectState(result.output.states[0]);
            }

            this.setupInput();
            this.scrollToBottom();
        }
    }

    private run(input: CoreValue) {
        if (this.program) {
            return this.program.run([input]);
        } else {
            console.log("no graph to run!");
        }

        return undefined;
    }
}

export interface InputPanelDelegate {
    selectNode(n: any): void;
}

interface Output {
    states: CoreValue[];
    result: CoreValue;
}

class ProgramResult {
    constructor(public readonly input: CoreValue, public readonly output: Output) { };
    public steps = 0;

    public getStates() {
        return this.output.states.slice(0, this.steps);
    }
}
