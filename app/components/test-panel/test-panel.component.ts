// File: test-panel.component.ts
// Created by: Daniel James
// Date created: December 8, 2016


import { Component, Input, Output } from "@angular/core";
import { Program } from "../../models/plugin";

@Component({
    selector: "sinap-test-panel",
    templateUrl: "./test-panel.component.html",
    styleUrls: ["./test-panel.component.scss"]
})
export class TestPanelComponent {
    private _program: Program | null = null;

    set program(program: Program | null) {
        this._program = program;

        if (program && this.autoplay) {
            this.runTests();
        }
    }

    get program() {
        return this._program;
    }

    private tests: Test[] = [];
    private selected = new Set<Test>();

    /**
     * Whether changes to the graph should automatically run through all tests.
     */
    private autoplay: Boolean = true;



    private runTests() {
        this.tests.forEach((test) => {
            this.runTest(test);
        });
    }

    private runTest(test: Test) {
        if (this.program) {
            this.program.run(test.input).then((output) => {
                console.log(test, output);
                test.output = output as boolean;
            }).catch((error) => {
                test.output = null;
            });
        }
    }

    private runSelectedTests(tests: Set<Test>) {
        tests.forEach((test) => {
            this.runTest(test);
        });
    }

    private testChanged(test: Test) {
        if (this.autoplay) {
            this.runTest(test);
        }
    }

    private newTest() {
        this.tests.push({
            input: "",
            expected: true,
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

}

interface Test {
    input: string;
    expected: boolean;
    output: boolean | null;
}