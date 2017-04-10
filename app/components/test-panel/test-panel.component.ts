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
        new TitlebarButton(`${require('../../images/plus.svg')}`, "Add test", false, false, () => this.newTest()),
        new TitlebarButton(`${require('../../images/minus.svg')}`, "Remove Selected Tests", false, false, () => this.removeSelected()),
        new TitlebarSpacer(),
        new TitlebarButton(`${require('../../images/autoplay.svg')}`, "Autorun is off", false, false, () => this.toggleAutoplay()),
        new TitlebarSpacer(),
        new TitlebarButton(`${require('../../images/play-all.svg')}`, "Run all tests", false, false, () => this.runTests()),
        new TitlebarButton(`${require('../../images/play.svg')}`, "Run selected tests", false, false, () => this.runSelectedTests()),
    ];

    set data(value: TestPanelData) {
        this._data = value;
        value.programChanged.asObservable().subscribe(p => {
            if (p && this._data.autoplay)
                this.runTests();
        });
        value.selectedChanged.asObservable().subscribe(d => {
            (this.titlebarItems[2] as TitlebarButton).isDisabled = d.selectedSize === 0;
            (this.titlebarItems[7] as TitlebarButton).isDisabled = d.selectedSize === 0;
        });
        value.autoplayChanged.asObservable().subscribe(v => {
            (this.titlebarItems[4] as TitlebarButton).isToggled = v;
            (this.titlebarItems[4] as TitlebarButton).title = "Autorun is " + v ? "on" : "off";
        });
        (this.titlebarItems[2] as TitlebarButton).isDisabled = value.selectedSize === 0;
        (this.titlebarItems[7] as TitlebarButton).isDisabled = value.selectedSize === 0;
        (this.titlebarItems[4] as TitlebarButton).isToggled = value.autoplay;
        (this.titlebarItems[4] as TitlebarButton).title = "Autorun is " + value.autoplay ? "on" : "off";
        if (value.program && value.autoplay)
            this.runTests();
    }

    private runTests() {
        this._data.tests.forEach((test) => {
            this.runTest(test);
        });
    }

    private runTest(test: Test) {
        if (this._data.program) {
            const p = this._data.program;

            this._data.program.run([test.input]).then((out) => {
                // TODO: This should really be a .then.catch case (not optional result and error on out)
                if (out.result) {
                    test.output = out.result;
                } else {
                    test.output = new Value.Literal(new Type.Literal(out.error ? out.error.value.toString() : "Error"), p.model.environment);
                }
            });
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
                input: this.getInput(this._data.program),
                expected: this.getExpected(this._data.program),
                output: new Value.Literal(new Type.Literal("Not ran yet."), this._data.program.model.environment)
            };

            test.input.environment.listen(this.testChanged.bind(this, test), () => true, test.input);

            this._data.tests.push(test);
            this.runTest(test);
        }
    }

    private getInput(program: Program) {
        return program.model.environment.make(program.plugin.types.arguments[0]);
    }

    private getExpected(program: Program) {
        return program.model.environment.make(program.plugin.types.result);
    }

    private areEqual(a: Value.Value, b: Value.Value) {
        return a.deepEqual(b);
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

}

interface Test {
    input: Value.Value;
    expected: Value.Value;
    output: Value.Value;
}
