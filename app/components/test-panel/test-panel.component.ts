// File: test-panel.component.ts
// Created by: Daniel James
// Date created: December 8, 2016


import { Component, Input } from "@angular/core";
import { Program, CoreValue, valueWrap, PluginTypeEnvironment, FakeObjectType, Type, makeValue, deepListen } from "sinap-core";

@Component({
    selector: "sinap-test-panel",
    templateUrl: "./test-panel.component.html",
    styleUrls: ["./test-panel.component.scss"]
})
export class TestPanelComponent {
    private _program?: Program;

    set program(program: Program | undefined) {
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
            try {
                let out = this.program.run([test.input]);
                test.output = out.result;
            } catch (e) {
                console.log(e);
                test.output = valueWrap(this.program.plugin.typeEnvironment, e, false);
            }
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
        if (this.program) {
            const test = {
                input: this.getInput(this.program),
                expected: this.getExpected(this.program),
                output: makeValue<PluginTypeEnvironment>(this.program.plugin.typeEnvironment.getStringType(), "Not ran", false)
            };

            deepListen(test.input, () => {
                // TODO: fix this (change notification after change has been made with previous value, booleans)
                setTimeout(this.testChanged.bind(this, test), 0);
            });

            this.tests.push(test);
            this.runTest(test);
        }
    }

    private getInput(program: Program) {
        const type = program.runArguments[0][0];
        return makeValue(type, undefined, true);
    }

    private getExpected(program: Program) {
        // TODO: fix
        const type = program.runReturn[0];
        const value = makeValue<PluginTypeEnvironment>(type, undefined, true);

        return value;
    }

    private areEqual(a: CoreValue<any>, b: CoreValue<any>) {
        return a.deepEqual(b);
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
    input: CoreValue<PluginTypeEnvironment>;
    expected: CoreValue<PluginTypeEnvironment>;
    output: CoreValue<PluginTypeEnvironment>;
}
