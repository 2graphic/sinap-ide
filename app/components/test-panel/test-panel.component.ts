// // File: test-panel.component.ts
// // Created by: Daniel James
// // Date created: December 8, 2016


// import { Component, Input } from "@angular/core";
// import { Program, CoreValue, valueWrap, PluginTypeEnvironment, FakeObjectType, Type } from "sinap-core";

// @Component({
//     selector: "sinap-test-panel",
//     templateUrl: "./test-panel.component.html",
//     styleUrls: ["./test-panel.component.scss"]
// })
// export class TestPanelComponent {
//     private _program?: Program;

//     set program(program: Program | undefined) {
//         this._program = program;

//         if (program && this.autoplay) {
//             this.runTests();
//         }
//     }

//     get program() {
//         return this._program;
//     }

//     private tests: Test[] = [];
//     private selected = new Set<Test>();

//     /**
//      * Whether changes to the graph should automatically run through all tests.
//      */
//     private autoplay: Boolean = true;



//     private runTests() {
//         this.tests.forEach((test) => {
//             this.runTest(test);
//         });
//     }

//     private runTest(test: Test) {
//         if (this.program) {
//             try {
//                 let out = this.program.run([test.input]);
//                 test.output = out.result;
//             } catch (e) {
//                 console.log(e);
//                 test.output = valueWrap(this.program.plugin.typeEnvironment, e, false);
//             }
//         }
//     }

//     private runSelectedTests(tests: Set<Test>) {
//         tests.forEach((test) => {
//             this.runTest(test);
//         });
//     }

//     private testChanged(test: Test) {
//         if (this.autoplay) {
//             this.runTest(test);
//         }
//     }

//     private newTest() {
//         if (this.program) {
//             const test = {
//                 input: this.getInput(this.program),
//                 expected: this.getExpected(this.program),
//                 output: new CoreValue(this.program.plugin.typeEnvironment.getStringType(), "Not ran")
//             };

//             // test.input.changed.asObservable().subscribe(this.testChanged.bind(this, test));

//             this.tests.push(test);
//             this.runTest(test);
//         }
//     }

//     private getInput(program: Program) {
//         let type = program.runArguments[0][0];

//         if (type.name === "InputType") {
//             const members = new Map<string, Type>();
//             members.set("a", program.plugin.typeEnvironment.getBooleanType());
//             members.set("b", program.plugin.typeEnvironment.getBooleanType());
//             return new CoreValue(new FakeObjectType(program.plugin.typeEnvironment, members), {
//                 "a": false,
//                 "b": false
//             });
//         } else {
//             return new CoreValue(type, "");
//         }
//     }

//     private getExpected(program: Program) {
//         if (program.plugin.pluginKind[1] === "Digital Logic") {
//             const members = new Map<string, Type>();
//             members.set("Cout", program.plugin.typeEnvironment.getBooleanType());
//             members.set("S", program.plugin.typeEnvironment.getBooleanType());
//             return new CoreValue(new FakeObjectType(program.plugin.typeEnvironment, members), {
//                 "Cout": false,
//                 "S": false
//             });
//         } else {
//             return new CoreValue(program.plugin.typeEnvironment.getBooleanType(), true);
//         }
//     }

//     private areEqual(a: any, b: any) {
//         if (typeof a === "object" && typeof b === "object") {
//             for (let p in a) {
//                 if (b.hasOwnProperty(p)) {
//                     if (a[p] !== b[p]) {
//                         return false;
//                     }
//                 }
//             }

//             return true;
//         } else {
//             return a === b;
//         }
//     }

//     private select(test: Test) {
//         if (this.selected.has(test)) {
//             this.selected.delete(test);
//         } else {
//             this.selected.add(test);
//         }
//     }

//     private toggleAutoplay() {
//         this.autoplay = !this.autoplay;
//         if (this.autoplay && this.program) {
//             this.runTests();
//         }
//     }

//     private removeSelected() {
//         this.selected.forEach((test) => {
//             let index = this.tests.indexOf(test);
//             if (index >= 0) {
//                 this.tests.splice(index, 1);
//             }
//         });

//         this.selected = new Set();
//     }

// }

// interface Test {
//     input: CoreValue<PluginTypeEnvironment>;
//     expected: CoreValue<PluginTypeEnvironment>;
//     output: CoreValue<PluginTypeEnvironment>;
// }
