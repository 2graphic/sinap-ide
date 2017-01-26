import { Component, ElementRef, ViewChild } from "@angular/core";

@Component({
    selector: "repl",
    templateUrl: "./repl.component.html",
    styleUrls: ["../../styles/bottom-panel.component.css", "./repl.component.css"]
})
export class REPLComponent {
    public delegate: REPLDelegate;
    private results: Command[] = [];

    @ViewChild('input') input: ElementRef;

    private onSubmit(input: String) {
        if (!this.delegate) {
            throw new Error("REPLDelegate not set.");
        }

        let handleResult = (result: any) => {
            this.results.unshift({
                input: input,
                result: result
            });
        };

        this.delegate.run(input).then(handleResult).catch(handleResult);
    }
}

export interface REPLDelegate {
    run(input: String): Promise<String>;
}

interface Command {
    input: String;
    result: String;
}
