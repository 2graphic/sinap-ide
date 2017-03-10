// // File: input-panel.component.ts
// //

// import { Component, ElementRef, ViewChild, AfterViewChecked } from "@angular/core";
// import { Type, Program, CoreValue, isObjectType, Plugin, FakeObjectType, PluginTypeEnvironment, CoreObjectValue, CorePrimitiveValue, CoreElement } from "sinap-core";

// @Component({
//     selector: "sinap-input-panel",
//     templateUrl: "./input-panel.component.html",
//     styleUrls: ["./input-panel.component.scss"]
// })
// export class InputPanelComponent implements AfterViewChecked {
//     public _program?: Program;

//     set program(program: Program | undefined) {
//         this._program = program;
//         this.setupInput();
//     }

//     get program() {
//         return this._program;
//     }

//     public delegate: InputPanelDelegate;

//     private results: ProgramResult[] = [];
//     private selected: ProgramResult;
//     private selectedState: State;

//     private inputForPlugin?: CoreValue<PluginTypeEnvironment>;

//     private shouldScroll = false;
//     ngAfterViewChecked() {
//         if (this.shouldScroll) {
//             let el: Element = this.log.nativeElement;
//             el.scrollTop = el.scrollHeight;
//             this.shouldScroll = false;
//         }
//     };

//     @ViewChild('log') log: ElementRef;

//     private isObjectType = isObjectType;
//     private isErrorType(t: Type<PluginTypeEnvironment>) {
//         return t.isAssignableTo((t.env as any).lookupPluginType("Error"));
//     }

//     private selectState(state: State) {
//         this.selectedState = state;
//         this.delegate.selectNode(state.state.value.active);
//     }

//     private scrollToBottom() {
//         this.shouldScroll = true;
//     }

//     private getStringType(program: Program) {
//         return program.plugin.typeEnvironment.getStringType();
//     }

//     private setupInput() {
//         if (this.program) {
//             let type = this.program.runArguments[0][0];

//             if (type.name === "InputType") {
//                 const members = new Map<string, Type>();
//                 members.set("a", this.program.plugin.typeEnvironment.getBooleanType());
//                 members.set("b", this.program.plugin.typeEnvironment.getBooleanType());
//                 this.inputForPlugin = new CoreValue(new FakeObjectType(this.program.plugin.typeEnvironment, members), {
//                     "a": false,
//                     "b": false
//                 });
//             } else {
//                 this.inputForPlugin = new CoreValue(type, "");
//             }
//         }
//     }

//     private selectResult(c: ProgramResult) {
//         this.selected = c;
//         this.scrollToBottom();
//     }

//     private step(): boolean {
//         if (this.selected && (this.selected.steps < this.selected.output.states.length)) {
//             this.selectState(this.selected.output.states[this.selected.steps++]);
//             this.scrollToBottom();
//             return true;
//         }

//         return false;
//     }

//     private stepFinish() {
//         if (this.selected) {
//             this.selected.steps = this.selected.output.states.length - 1;
//             this.selectState(this.selected.output.states[this.selected.steps++]);
//             this.scrollToBottom();
//         }
//     }

//     /**
//      * Calls this.step() every 750 milliseconds as long as this.step() returns true.
//      */
//     private stepToCompletion() {
//         let g: () => void;
//         let f = () => {
//             setTimeout(() => {
//                 g();
//             }, 750);
//         };

//         g = () => {
//             if (this.step()) {
//                 f();
//             }
//         };

//         g();
//     }

//     private onSubmit(input: CoreValue<PluginTypeEnvironment>) {
//         console.log(input, this.inputForPlugin);
//         const output = this.run(input);
//         if (output) {
//             const states = output.states.map(s => new State(s));
//             const result = new ProgramResult(input, new Output(states, output.result));
//             console.log(result);

//             this.selected = result;
//             this.results.unshift(result);

//             if (result.output.states.length > 0) {
//                 this.selectedState = result.output.states[0];
//                 result.steps++;
//                 this.selectState(result.output.states[0]);
//             }

//             this.setupInput();
//             this.scrollToBottom();
//         }
//     }

//     private run(input: CoreValue<PluginTypeEnvironment>) {
//         if (this.program) {
//             return this.program.run([input]);
//         } else {
//             console.log("no graph to run!");
//         }

//         return undefined;
//     }
// }

// export interface InputPanelDelegate {
//     selectElement(element: CoreElement): void;
// }

// class Output {
//     constructor(public readonly states: State[], public readonly result: CoreValue) { };
// }

// class State {
//     message: CoreValue | undefined;
//     state: CoreValue;

//     constructor(value: CoreValue) {
//         this.message = this.getMessage(value);
//         this.state = this.stripMessage(value);
//     }

//     /**
//      * Returns a new object value that doesn't have a message property.
//      */
//     private stripMessage(state: CoreValue) {
//         if (isObjectType(state.type)) {
//             const members = new Map(state.type.members);
//             members.delete("message");
//             return new CoreValue(new FakeObjectType(state.type.env, members), state.value);
//         } else {
//             return state;
//         }
//     }

//     private getMessage(state: CoreValue) {
//         if (isObjectType(state.type)) {
//             const type = state.type.members.get("message");
//             if (type) {
//                 return new CoreValue(type, state.value.message);
//             }
//         }

//         return undefined;
//     }
// }

// class ProgramResult {
//     constructor(public readonly input: CoreValue<PluginTypeEnvironment>, public readonly output: Output) { };
//     public steps = 0;

//     public getStates() {
//         return this.output.states.slice(0, this.steps);
//     }
// }
