import { Plugin, Program, Model, ElementUnion, ElementType, InterpreterInfo, drawableGraphType, drawableEdgeType, drawableNodeType, PluginInfo } from 'sinap-core';
import { Type, Value } from 'sinap-types';

const pluginInfo = {
    packageJson: {},
    interpreterInfo: new InterpreterInfo('', 'mock', ''),
    pluginKind: [
        "Formal Languages",
        "DFA"
    ],
    name: 'Mock DFA Plugin',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nMorbi sagittis diam enim, vitae placerat orci vulputate ac. Etiam ac diam dolor. Vivamus scelerisque, orci id tempor imperdiet, nibh arcu egestas risus, nec pulvinar massa diam quis dui. Quisque fermentum aliquam nulla vitae accumsan. Phasellus sed ex nisi. Nunc dolor arcu, pulvinar sodales magna sit amet, porttitor tempus purus. Phasellus sapien eros, varius vel mi sit amet, fermentum condimentum ligula.',
};

const stringType = new Type.Primitive("string");
const booleanType = new Type.Primitive("boolean");
const nodeType = new Type.CustomObject("DFANode", null, new Map<string, Type.Type>([
    ["label", stringType],
    ["isAcceptState", booleanType],
    ["isStartState", booleanType],
    ["children", "placeholder" as any],
]), undefined, new Map([
    ["isAcceptState", "Accept State"],
    ["isStartState", "Start State"],
]));

const nodeUnion = new Type.Union([nodeType]);

const edgeType = new Type.CustomObject("DFAEdge", null, new Map<string, Type.Type>([
    ["label", stringType],
    ["source", nodeUnion],
    ["destination", nodeUnion],
]));

const edgeUnion = new Type.Union([edgeType]);

const stateType = new Type.CustomObject("State", null, new Map<string, Type.Type>([
    ["currentNode", nodeType],
    ["inputLeft", stringType],
]));


nodeType.members.set("children", new Value.ArrayType(edgeType));
const graphType = new Type.CustomObject("DFAGraph", null, new Map<string, Type.Type>([
    ["nodes", new Value.ArrayType(nodeUnion)],
    ["edges", new Value.ArrayType(edgeUnion)],
]));

export const DFA_PLUGIN: Plugin = {
    pluginInfo: pluginInfo,
    types: {
        state: stateType,
        nodes: new ElementUnion(new Set([new ElementType(nodeType, drawableNodeType)])),
        edges: new ElementUnion(new Set([new ElementType(edgeType, drawableEdgeType)])),
        graph: new ElementType(graphType, drawableGraphType),
        rawNodes: [nodeType],
        rawEdges: [edgeType],
        rawGraph: graphType,
        arguments: [stringType],
        result: booleanType,
    },
    makeProgram: async (fromModel: Model): Promise<Program> => {
        const model = Model.fromSerial(fromModel.serialize(), DFA_PLUGIN);

        const nodes = new Value.ArrayObject(new Value.ArrayType(DFA_PLUGIN.types.nodes), model.environment);
        const edges = new Value.ArrayObject(new Value.ArrayType(DFA_PLUGIN.types.edges), model.environment);

        for (const node of model.nodes) {
            nodes.push(node);
            node.set("children", new Value.ArrayObject(node.type.members.get("children") as Value.ArrayType, model.environment));
        }

        for (const edge of model.edges) {
            edges.push(edge);
            const sourceBox = edge.get("source") as Value.Union;
            const source = sourceBox.value as Value.CustomObject;
            const sourceChildren = source.get("children") as Value.ArrayObject;
            sourceChildren.push(edge);
        }

        model.graph.set("nodes", nodes);
        model.graph.set("edges", edges);

        function start(graph: Value.CustomObject, input: Value.Primitive): Value.CustomObject {
            const nodes = graph.get("nodes") as Value.ArrayObject;
            const startStates = [...nodes].filter(v => ((v as Value.CustomObject).get("isStartState") as Value.Primitive).value);
            if (startStates.length !== 1) {
                throw new Error(`must have exactly 1 start state, found: ${startStates.length}`);
            }

            const state = new Value.CustomObject(stateType, model.environment);
            state.set("currentNode", startStates[0]);
            state.set("inputLeft", input);
            return state;
        }

        function step(state: Value.CustomObject): Value.Value {
            const currentNodeV = state.get("currentNode") as Value.CustomObject;
            const inputLeftV = state.get("inputLeft") as Value.Primitive;
            const inputLeft = inputLeftV.value as string;
            if (inputLeft.length === 0) {
                return currentNodeV.get("isAcceptState");
            }

            const nextToken = inputLeft[0];

            const possibleEdgesV = currentNodeV.get("children") as Value.ArrayObject;

            const possibleEdges = [...possibleEdgesV]
                .filter(v => ((v as Value.CustomObject).get("label") as Value.Primitive).value === nextToken);

            if (possibleEdges.length === 0) {
                return new Value.Primitive(booleanType, model.environment, false);
            }
            if (possibleEdges.length > 1) {
                throw new Error(`must have 0 or 1 possible edges, found: ${possibleEdges.length}`);
            }

            const newState = new Value.CustomObject(stateType, model.environment);
            newState.set("currentNode", ((possibleEdges[0] as Value.CustomObject).get("destination") as Value.Union).value);
            newState.set("inputLeft", new Value.Primitive(stringType, model.environment, inputLeft.substr(1)));
            return newState;
        }

        const program: Program = {
            plugin: DFA_PLUGIN,
            validate: () => {
                try {
                    start(model.graph, new Value.Primitive(stringType, model.environment, ''));
                } catch (err) {
                    return Value.makePrimitive(model.environment, err);
                }
                return null;
            },
            model,
            run: async (a: Value.Value[]): Promise<{ steps: Value.CustomObject[], result?: Value.Value, error?: Value.Primitive }> => {
                let state: Value.CustomObject | Value.Value;
                const steps: Value.CustomObject[] = [];
                try {
                    state = start(model.graph, a[0] as any);
                } catch (err) {
                    return { steps, error: Value.makePrimitive(model.environment, err) };
                }

                while (state.type.equals(stateType)) {
                    steps.push(state as Value.CustomObject);
                    try {
                        state = step(state as Value.CustomObject);
                    } catch (err) {
                        return { steps, error: Value.makePrimitive(model.environment, err) };
                    }
                }


                return { steps, result: state };
            },
        };

        return program;
    },
};
