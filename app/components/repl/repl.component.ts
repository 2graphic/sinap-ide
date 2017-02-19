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

    @ViewChild('input') input: ElementRef;

    private onSubmit(input: String) {
        if (!input) {
            input = "";
        }
        if (!this.delegate) {
            throw new Error("REPLDelegate not set.");
        }

        let handleResult = (result: any) => {
            this.results.unshift({
                input: input,
                result: result
            });
        };

        this.delegate.run(input).then((output) => {
            handleResult(output.result);
        }).catch((e) => {
            handleResult(e.toString());
        });
    }
}

export interface REPLDelegate {
    run(input: String): Promise<Output>;
}

interface Command {
    input: String;
    result: String;
}
