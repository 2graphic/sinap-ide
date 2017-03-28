// File: test-panel.component.ts
// Created by: Daniel James
// Date created: December 8, 2016


import { Component, Input } from "@angular/core";
import { GraphController } from "../../models/graph-controller";
import { Program, CoreValue, valueWrap, PluginTypeEnvironment, FakeObjectType, Type, makeValue, deepListen, WrappedScriptType, CoreMapValue } from "sinap-core";

@Component({
    selector: "sinap-test-panel",
    templateUrl: "./test-panel.component.html",
    styleUrls: ["./test-panel.component.scss"]
})
export class TestPanelComponent {
    public program?: Program;
    private graph?: GraphController;

    set info(info: [Program, GraphController] | undefined) {
        if (info) {
            const [program, graph] = info;
            this.program = program;
            this.graph = graph;

            if (this.autoplay) {
                this.runTests();
            }
        } else {
            this.program = undefined;
            this.graph = undefined;
        }
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
        if (this.program && this.graph) {
            const test = {
                input: this.getInput(this.program, this.graph),
                expected: this.getExpected(this.program, this.graph),
                output: makeValue<PluginTypeEnvironment>(this.program.plugin.typeEnvironment.getStringType(), "Not ran", false)
            };

            // deepListen(test.input, () => {
            //     // TODO: fix this (change notification after change has been made with previous value, booleans)
            //     setTimeout(this.testChanged.bind(this, test), 0);
            // });

            this.tests.push(test);
            this.runTest(test);
        }
    }

    private getInput(program: Program, graph: GraphController) {
        const type = program.runArguments[0][0];

        // TODO: improve this
        if (type instanceof WrappedScriptType && type.env.lookupGlobalType("Map").type.symbol === type.type.symbol) {
            const types = (type as any).typeArguments as Type<PluginTypeEnvironment>[];
            const keyType = types[0];
            const valueType = types[1];

            const map = new Map<CoreValue<PluginTypeEnvironment>, CoreValue<PluginTypeEnvironment>>();

            if (keyType.isAssignableTo(keyType.env.lookupPluginType("Node"))) {
                [...graph.bridges.values()].map((b) => b.core).forEach((core) => {
                    if (core.type.types.values().next().value.isAssignableTo(keyType)) {
                        map.set(core, makeValue(valueType, undefined, true));
                    }
                });
            }

            let mapValue = makeValue(type, new Map(), false) as CoreMapValue<PluginTypeEnvironment>;
            map.forEach((v, k) => {
                mapValue.map.set(k, v);
            });

            return mapValue;
        }

        return makeValue(type, undefined, true);
    }

    private getExpected(program: Program, graph: GraphController) {
        // TODO: fix
        const type = program.runReturn[0];

        // TODO: improve this
        if (type instanceof WrappedScriptType && type.env.lookupGlobalType("Map").type.symbol === type.type.symbol) {
            const types = (type as any).typeArguments as Type<PluginTypeEnvironment>[];
            const keyType = types[0];
            const valueType = types[1];

            const map = new Map<CoreValue<PluginTypeEnvironment>, CoreValue<PluginTypeEnvironment>>();

            if (keyType.isAssignableTo(keyType.env.lookupPluginType("Node"))) {
                [...graph.bridges.values()].map((b) => b.core).forEach((core) => {
                    const elementType = core.type.types.values().next().value;
                    if (elementType.isIdenticalTo(keyType) && elementType.name === keyType.name) {
                        map.set(core, makeValue(valueType, undefined, true));
                    }
                });
            }

            let mapValue = makeValue(type, new Map(), false) as CoreMapValue<PluginTypeEnvironment>;
            map.forEach((v, k) => {
                mapValue.map.set(k, v);
            });

            return mapValue;
        }

        return makeValue(type, undefined, true);
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
