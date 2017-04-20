/**
 * @file `test-panel.component.ts`
 *   Created on December 8, 2016
 *
 * @author Daniel James
 *   <daniel.s.james@icloud.com>
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html}
 */

import { Component, Input, EventEmitter } from "@angular/core";
import { Program } from "sinap-core";
import { Value, Type } from "sinap-types";
import { PanelComponent, TitlebarButton, TitleBarItems, TitlebarSpacer } from "../dynamic-panel/dynamic-panel";
import { getInput } from "../../util";

export class TestPanelData {
    private _program?: Program;
    /**
     * Whether changes to the graph should automatically run through all tests.
     */
    private _autoplay: boolean = true;
    private readonly _selected = new Set<Test>();

    tests: Test[] = [];

    readonly autoplayChanged = new EventEmitter<boolean>();

    readonly selectedChanged = new EventEmitter<TestPanelData>();

    get autoplay() {
        return this._autoplay;
    }

    set autoplay(value: boolean) {
        this._autoplay = value;
        this.autoplayChanged.emit(value);
    }

    get program() {
        return this._program;
    }

    set program(value: Program | undefined) {
        this._program = value;
        this.programChanged.emit(value);
    }

    get selectedSize() {
        return this._selected.size;
    }

    get selected(): Iterable<Test> {
        return this._selected;
    }

    isSelected(value: Test) {
        return this._selected.has(value);
    }

    removeSelected(value: Test) {
        this._selected.delete(value);
        this.selectedChanged.emit(this);
    }

    addSelected(value: Test) {
        this._selected.add(value);
        this.selectedChanged.emit(this);
    }

    clearSelected() {
        this._selected.clear();
        this.selectedChanged.emit(this);
    }

    readonly programChanged
    = new EventEmitter<Program | undefined>();
}

@Component({
    selector: "sinap-test-panel",
    templateUrl: "./test-panel.component.html",
    styleUrls: ["./test-panel.component.scss"]
})
export class TestPanelComponent implements PanelComponent<TestPanelData>, TitleBarItems {
    private _data: TestPanelData;

    titlebarItems = [
        new TitlebarSpacer(),
        new TitlebarButton("add", "Add test", false, () => this.newTest()),
        new TitlebarButton("delete", "Remove Selected Tests", false, () => this.removeSelected()),
        new TitlebarSpacer(),
        new TitlebarButton("timer", "Autorun is on", false, () => this.toggleAutoplay()),
        new TitlebarSpacer(),
        new TitlebarButton("play_arrow", "Run selected tests", false, () => this.runSelectedTests()),
    ];

    set data(value: TestPanelData) {
        this._data = value;
        value.programChanged.asObservable().subscribe(p => {
            if (p && this._data.autoplay)
                this.runTests();
        });
        value.selectedChanged.asObservable().subscribe(d => {
            (this.titlebarItems[2] as TitlebarButton).isDisabled = d.selectedSize === 0;
            (this.titlebarItems[6] as TitlebarButton).isDisabled = d.selectedSize === 0;
        });
        value.autoplayChanged.asObservable().subscribe(v => {
            (this.titlebarItems[4] as TitlebarButton).icon = v ? "timer" : "timer_off";
            (this.titlebarItems[4] as TitlebarButton).title = "Autorun is " + (v ? "on" : "off");
        });
        value.selectedChanged.emit(value);
        value.autoplayChanged.emit(value.autoplay);
        if (value.program && value.autoplay)
            this.runTests();
    }

    private runTests() {
        this._data.tests.forEach((test) => {
            this.runTest(test);
        });
    }

    private async runTest(test: Test) {
        if (this._data.program) {
            const p = this._data.program;

            const out = await p.run([test.input]);
            // TODO: This should really be a .then.catch case (not optional result and error on out)
            if (out.result) {
                test.output = out.result;
            } else {
                test.output = new Value.Literal(new Type.Literal(out.error ? out.error.value.toString() : "Error"), p.model.environment);
            }
        }
    }

    private runSelectedTests() {
        for (const test of this._data.selected)
            this.runTest(test);
    }

    private testChanged(test: Test) {
        if (this._data.autoplay) {
            this.runTest(test);
        }
    }

    private newTest() {
        if (this._data.program) {
            const test = {
                input: getInput(this._data.program),
                expected: this.getExpected(this._data.program),
                output: undefined
            };

            test.input.environment.listen(this.testChanged.bind(this, test), () => true, test.input);

            this._data.tests.push(test);
            this.runTest(test);
        }
    }

    private getExpected(program: Program) {
        return program.model.environment.make(program.plugin.types.result);
    }

    private select(test: Test) {
        if (this._data.isSelected(test)) {
            this._data.removeSelected(test);
        } else {
            this._data.addSelected(test);
        }
    }

    private toggleAutoplay() {
        this._data.autoplay = !this._data.autoplay;
        if (this._data.autoplay && this._data.program) {
            this.runTests();
        }
    }

    private removeSelected() {
        for (const test of this._data.selected) {
            const index = this._data.tests.indexOf(test);
            if (index >= 0)
                this._data.tests.splice(index, 1);
        }

        this._data.clearSelected();
    }

    private allSelected() {
        return this._data.selectedSize === this._data.tests.length;
    }

    private selectAll() {
        const toggle = !this.allSelected();
        this._data.clearSelected();
        if (toggle) {
            this._data.tests.forEach((t) => this._data.addSelected(t));
        }
    }

    private getTestIcon(test: Test) {
        if (test.output) {
            if (test.expected.deepEqual(test.output)) {
                return ["check_circle", "green"];
            } else {
                return ["error", "red"];
            }
        }

        return ["timer", "black"];
    }

}

interface Test {
    input: Value.Value;
    expected: Value.Value;
    output?: Value.Value;
}
