import { Component, ElementRef, ViewChild } from "@angular/core";

@Component({
  selector: "repl",
  templateUrl: "./repl.component.html",
  styleUrls: [ "../../styles/bottom-panel.component.css", "./repl.component.css" ]
})
export class REPLComponent {
  public delegate: REPLDelegate;
  private results: Command[] = [];

  @ViewChild('input') input : ElementRef;

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
