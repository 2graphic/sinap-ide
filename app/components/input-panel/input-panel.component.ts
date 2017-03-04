// File: input-panel.component.ts
//

import { Component, ElementRef, ViewChild, AfterViewChecked } from "@angular/core";
import { Type, Program, CoreValue, isObjectType, Plugin, FakeObjectType, PluginTypeEnvironment, CoreObjectValue, CorePrimitiveValue, CoreElement } from "sinap-core";

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
    private selectedState: CoreValue<PluginTypeEnvironment>;

    private inputForPlugin?: CoreValue<PluginTypeEnvironment>;

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
    private isErrorType(t: Type<PluginTypeEnvironment>) {
        return t.isAssignableTo((t.env as any).lookupPluginType("Error"));
    }

    private selectState(state: CoreValue<PluginTypeEnvironment>) {
        this.selectedState = state;
        if (state instanceof CoreObjectValue && state.type.members.has("active")) {
            let active = state.get("active");

            if (active instanceof CoreElement) {
                this.delegate.selectElement(active);
            }
        }
    }

    private scrollToBottom() {
        this.shouldScroll = true;
    }

    private setupInput() {
        if (this.program) {
            this.inputForPlugin = this.program.makeValue(this.program.runArguments[0][0], undefined, true);
        }
    }

    /**
     * Returns a new object value that doesn't have a message property.
     */
    private stripMessage(state: CoreValue<PluginTypeEnvironment>) {
        return state;
        // if (isObjectType(state.type)) {
        //     const members = new Map(state.type.members);
        //     members.delete("message");
        //     return new CoreValue<PluginTypeEnvironment>(new FakeObjectType(state.type.env, members), state.value);
        // } else {
        //     return state;
        // }
    }

    getMessage(state: CoreValue<PluginTypeEnvironment>) {
        if (state instanceof CoreObjectValue) {
            return state.type.members.has("message") ? state.get("message") : undefined;
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

    private onSubmit(input: CoreValue<PluginTypeEnvironment>) {
        console.log(input, this.inputForPlugin);
        const output = this.run(input);
        console.log(input, output);



        if (output) {
            let result = new ProgramResult(input, output);
            console.log(result);

            this.selected = result;
            this.results.unshift(result);

            if (result.output.states.length > 0) {
                this.selectedState = result.output.states[0];
                result.steps++;
            }

            this.setupInput();
            this.scrollToBottom();
        }
    }

    private run(input: CoreValue<PluginTypeEnvironment>) {
        if (this.program) {
            return this.program.run([input]);
        } else {
            console.log("no graph to run!");
        }

        return undefined;
    }
}

export interface InputPanelDelegate {
    selectElement(element: CoreElement): void;
}

interface Output {
    states: CoreValue<PluginTypeEnvironment>[];
    result: CoreValue<PluginTypeEnvironment>;
}

class ProgramResult {
    constructor(public readonly input: CoreValue<PluginTypeEnvironment>, public readonly output: Output) { };
    public steps = 0;

    public getStates() {
        return this.output.states.slice(0, this.steps);
    }
}
