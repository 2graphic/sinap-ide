// File: test-panel.component.ts
// Created by: Daniel James
// Date created: December 8, 2016


import { Component, Input, Output } from "@angular/core";
import { Program } from "../../models/plugin";

@Component({
    selector: "sinap-test-panel",
    templateUrl: "./test-panel.component.html",
    styleUrls: ["./test-panel.component.css", "../../styles/bottom-panel.component.css"]
})
export class TestPanelComponent {
    private tests: Test[] = [{
        input: "101",
        expected: true,
        output: null
    }];

    private selected = new Set<Test>();

    // Whether changes to the graph should automatically run through all tests.
    private autoplay: Boolean = true;

    // Keep track of last ran program
    private program: Program | null = null;

    runTests(program?: Program) {
        if (program) {
            this.program = program;
        }


        if (this.program) {
            let program = this.program;

            this.tests.forEach((test) => {
                this.runTestWithProgram(test, program);
            });
        }
    }

    testChanged(test: Test) {
        if (this.autoplay && this.program) {
            this.runTestWithProgram(test, this.program);
        }
    }

    newTest() {
        this.tests.push({
            input: "",
            expected: false,
            output: null
        });
    }

    private select(test: Test) {
        if (this.selected.has(test)) {
            this.selected.delete(test);
        } else {
            this.selected.add(test);
        }
    }

    private toggleAutoplay() {
        this.autoplay = !this.autoplay;
        if (this.autoplay && this.program) {
            this.runTests();
        }
    }

    private removeSelected() {
        this.selected.forEach((test) => {
            let index = this.tests.indexOf(test);
            if (index >= 0) {
                this.tests.splice(index, 1);
            }
        });

        this.selected = new Set();
    }

    private runSelectedTests() {
        if (this.program) {
            let program = this.program;
            this.selected.forEach((test) => {
                this.runTestWithProgram(test, program);
            });
        }
    }

    private runTestWithProgram(test: Test, program: Program) {
        program.run(test.input).then((output) => {
            console.log(test, output);
            test.output = output as boolean;
        }).catch((error) => {
            test.output = null;
        });
    }
}

interface Test {
    input: string;
    expected: boolean;
    output: boolean | null;
}