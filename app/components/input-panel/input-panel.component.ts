// File: input-panel.component.ts
//

import { Component, ElementRef, ViewChild, AfterViewChecked } from "@angular/core";
import { Type, Program, CoreValue, isObjectType, Plugin, FakeObjectType, WrappedScriptType, PluginTypeEnvironment, CoreObjectValue, CorePrimitiveValue, CoreElement, makeValue } from "sinap-core";
import { GraphController } from "../../models/graph-controller";

@Component({
    selector: "sinap-input-panel",
    templateUrl: "./input-panel.component.html",
    styleUrls: ["./input-panel.component.scss"]
})
export class InputPanelComponent implements AfterViewChecked {
    public program?: Program;
    private graph?: GraphController;

    set info(info: [Program, GraphController] | undefined) {
        if (info) {
            const [program, graph] = info;
            this.program = program;
            this.graph = graph;
        } else {
            this.program = undefined;
            this.graph = undefined;
        }
        
        this.setupInput();
    }

    public delegate: InputPanelDelegate;

    private results: ProgramResult[] = [];
    private selected: ProgramResult;
    private selectedState: State;

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
        try {
            return t.isAssignableTo(t.env.lookupPluginType("Error"));
        } catch (e) {
            // TODO:
            return false;
        }
    }

    private selectState(state: State) {
        this.selectedState = state;
        // this.delegate.selectNode(state.state.value.active);
    }

    private scrollToBottom() {
        this.shouldScroll = true;
    }

    private getStringType(program: Program) {
        return program.plugin.typeEnvironment.getStringType();
    }

    private setupInput() {
        if (this.program && this.graph) {
            let type = this.program.runArguments[0][0];
            let initialValue: any | undefined = undefined;

            // TODO: improve this
            if (type instanceof WrappedScriptType && type.env.lookupGlobalType("Map").type.symbol === type.type.symbol) {
                const types = (type as any).typeArguments as Type<PluginTypeEnvironment>[];
                const keyType = types[0];
                const valueType = types[1];

                const map = new Map<CoreValue<PluginTypeEnvironment>, CoreValue<PluginTypeEnvironment>>();

                if (keyType.isAssignableTo(keyType.env.lookupPluginType("Node"))) {
                    [...this.graph.bridges.values()].map((b) => b.core).forEach((core) => {
                        if (core.type.types.values().next().value.isAssignableTo(keyType)) {
                            map.set(core, makeValue(valueType, undefined, true));
                        }
                    });
                }

                initialValue = map;
            }

            this.inputForPlugin = makeValue(type, initialValue, true);
        }
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

    private stepFinish() {
        if (this.selected) {
            this.selected.steps = this.selected.output.states.length - 1;
            this.selectState(this.selected.output.states[this.selected.steps++]);
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

    private onSubmit(input: CoreValue<PluginTypeEnvironment>) {
        console.log(input, this.inputForPlugin);
        const output = this.run(input);
        if (output) {
            const states = output.states.map(s => new State(s));
            const result = new ProgramResult(input, new Output(states, output.result));
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

class Output {
    constructor(public readonly states: State[], public readonly result: CoreValue<PluginTypeEnvironment>) { };
}

class State {
    message: CoreValue<PluginTypeEnvironment> | undefined;
    state: CoreValue<PluginTypeEnvironment>;

    constructor(value: CoreValue<PluginTypeEnvironment>) {
        this.message = this.getMessage(value);
        this.stripMessage(value);
        this.state = value;
    }

    /**
     * Returns a new object value that doesn't have a message property.
     */
    private stripMessage(state: CoreValue<PluginTypeEnvironment>) {
        if (state instanceof CoreObjectValue) {
            state.type.members.delete("message");
        }
    }

    private getMessage(state: CoreValue<PluginTypeEnvironment>) {
        if (state instanceof CoreObjectValue) {
            try {
                return state.get("message");
            } catch (e) {
                console.log(e);
                return undefined;
            }
        }

        return undefined;
    }
}

class ProgramResult {
    constructor(public readonly input: CoreValue<PluginTypeEnvironment>, public readonly output: Output) { };
    public steps = 0;

    public getStates() {
        return this.output.states.slice(0, this.steps);
    }
}
