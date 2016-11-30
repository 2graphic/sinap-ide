import { Component } from "@angular/core";

@Component({
  moduleId: module.id,
  selector: "repl",
  templateUrl: "../html/repl.component.html",
  styleUrls: [ "../styles/repl.component.css" ]
})
export class REPLComponent {
  private delegate: REPLDelegate;
  private results: Command[] = []

  public setDelegate(delegate: REPLDelegate) {
    this.delegate = delegate;
  }

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
