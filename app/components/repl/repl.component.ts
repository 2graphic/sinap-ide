// File: repl.component.ts
//

import { Component, ElementRef, ViewChild } from "@angular/core";
import { Output, Value } from "../../services/plugin.service";
import { Type } from "sinap-core";

@Component({
    selector: "repl",
    templateUrl: "./repl.component.html",
    styleUrls: ["./repl.component.scss"]
})
export class REPLComponent {
    public delegate: REPLDelegate;
    private results: Command[] = [];
    private selected: Command;
    private selectedState: any;

    private inputForPlugin = new Value("string", "");

    @ViewChild('log') log: ElementRef;

    private selectState(state: Value) {
        this.selectedState = state;
        if (state.type == "object" && state.value.active) {
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
        if (state.type == "object") {
            let r = new Value("object", {});
            Object.keys(state.value).forEach((key) => {
                if (key != "message") {
                    r.value[key] = state.value[key];
                }
            });

            return r;
        }

        return state;
    }

    private selectCommand(c: Command) {
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

    private getStates(selected: Command) {
        return selected.output.states.slice(0, selected.steps);
    }

    private onSubmit(input: Value) {
        if (!this.delegate) {
            throw new Error("REPLDelegate not set.");
        }

        let handleResult = (output: Output | Error) => {
            let command: Command;

            if (output instanceof Output) {
                command = new Command(input, output);
            } else {
                let states = <Value[]>[];

                if (output.stack) {
                    states = output.stack.split("\n").map((frame) => {
                        return new Value("string", frame);
                    });
                    states.shift();
                    states.reverse();
                }
                command = new Command(input, new Output(states, new Value("error", output.message)));
                command.steps = states.length;
            }

            this.selected = command;
            this.results.unshift(command);

            if (command.output.states.length > 0) {
                this.selectedState = command.output.states[command.output.states.length - 1];
            }
        };

        this.delegate.run(input.value).then((output) => {
            handleResult(output);
        }).catch((e) => {
            handleResult(e);
        });

        this.inputForPlugin = new Value("string", "");
        this.scrollToBottom();
    }
}

export interface REPLDelegate {
    run(input: String): Promise<Output>;
    selectNode(n: any): void;
}
class Command {
    constructor(public readonly input: Value, public readonly output: Output) { };
    public steps = 0;
}
