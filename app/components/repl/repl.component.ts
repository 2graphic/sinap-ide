import { Component, ElementRef, ViewChild } from "@angular/core";
import { Output } from "../../services/plugin.service";

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

    @ViewChild('input') input: ElementRef;
    @ViewChild('log') log: ElementRef;

    private selectState(a: any) {
        this.selectedState = a;
        this.delegate.selectNode(a.active);
    }

    private selectCommand(c: Command) {
        this.selected = c;
        setTimeout(() => {
            let el: Element = this.log.nativeElement;
            el.scrollTop = el.scrollHeight;
        }, 0);
    }

    private step(): boolean {
        if (this.selected && !this.selected.error) {
            if (this.selected.steps < this.selected.output.states.length) {
                this.selectState(this.selected.output.states[this.selected.steps]);
                this.selected.steps++;
                setTimeout(() => {
                    let el: Element = this.log.nativeElement;
                    el.scrollTop = el.scrollHeight;
                }, 0);
                return true;
            } else {
                return false;
            }
        }

        return false;
    }

    private stepToCompletion() {
        let g: () => void;
        let f = () => {
            setTimeout(() => {
                g();
            }, 750)
        };

        g = () => {
            if (this.step()) {
                f();
            }
        }

        g();
    }

    private getStates(selected: Command) {
        return selected.output.states.slice(0, selected.steps);
    }

    private onSubmit(input: String) {
        if (!input) {
            input = "";
        }
        if (!this.delegate) {
            throw new Error("REPLDelegate not set.");
        }

        let handleResult = (output: any) => {
            let command: Command;

            // Better way of figuring out type of Proxy
            if (output.stack) {
                command = {
                    input: input,
                    output: {
                        states: [],
                        result: output.message
                    },
                    error: output,
                    steps: 0
                };
            } else {
                command = {
                    input: input,
                    output: output,
                    steps: 0
                };
            }

            this.selected = command;
            this.results.unshift(command);

            if (command.output.states.length > 0) {
                this.selectedState = command.output.states[command.output.states.length - 1];
            }

            console.log(command);
        };

        this.delegate.run(input).then((output) => {
            console.log(output);
            handleResult(output);
        }).catch((e) => {
            handleResult(e);
        });
    }
}

export interface REPLDelegate {
    run(input: String): Promise<Output>;
    selectNode(n: any): void;
}

interface Command {
    input: String;
    output: Output;
    error?: Error;
    steps: number;
}
