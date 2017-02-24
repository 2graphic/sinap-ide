// // File: test-panel.component.ts
// // Created by: Daniel James
// // Date created: December 8, 2016


// import { Component, Input } from "@angular/core";
// import { Program } from "sinap-core";
// import { Output, isOutput } from "../../services/plugin.service";

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
//                 let out = this.program.run(test.input.value);
//                 test.output = out.result;
//             } catch (e) {
//                 test.output = new Value("string", "Error");
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
//         const test = {
//             input: new Value("string", ""),
//             expected: new Value("boolean", true),
//             output: new Value("string", "Not ran")
//         }

//         test.input.changed.asObservable().subscribe(this.testChanged.bind(this, test));

//         this.tests.push(test);
//         this.runTest(test);
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
//     input: Value;
//     expected: Value;
//     output: Value;
// }
