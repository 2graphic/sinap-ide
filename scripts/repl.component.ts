import { Component } from "@angular/core";

@Component({
  moduleId: module.id,
  selector: "repl",
  templateUrl: "../html/repl.component.html",
  styleUrls: [ "../styles/bottom-panel.component.css", "../styles/repl.component.css" ]
})
export class REPLComponent {
  public delegate: REPLDelegate;
  private results: Command[] = []

  private onSubmit(input: String) {
    if (!this.delegate) {
      throw new Error("REPLDelegate not set.");
    }

    let result: String;
    try {
      result = this.delegate.run(input);
    } catch (e) {
      result = e;
    }

    this.results.unshift({
      input: input,
      result: result
    });
  }
}

export interface REPLDelegate {
  run(input: String): String;
}

interface Command {
  input: String;
  result: String;
}
