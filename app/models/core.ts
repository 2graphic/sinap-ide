// File: core.ts
// Created by: Sheyne Anderson
// Date created: January 22, 2017
//
//

import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";
import { LineStyles, Shapes } from "../components/graph-editor/graph-editor.component";
import { Object as SinapObject } from "./object";
import * as Type from "../types/types";


export interface PluginData {
    object: SinapObject;
    kind: string;
}
export interface Plugin {
    kind: string;
    validator: {
        isValidEdge(t: string, src: string, dst: string): boolean;
    }

    nodeTypes: Iterable<string>;
    edgeTypes: Iterable<string>;

    graphPluginData(kind: string): PluginData;
    nodePluginData(kind: string): PluginData;
    edgePluginData(kind: string): PluginData;
}

class Element implements PropertiedEntity {
    drawablePropertyTypes: [string, string, Type.Type][];
    public pluginProperties: MaskingPropertyList;
    public drawableProperties: MappedPropertyList;

    public get entityKind() {
        return this.pluginData.kind;
    }

    constructor(public pluginData: PluginData) {
        this.drawableProperties = new MappedPropertyList(this.drawablePropertyTypes, this);
        this.pluginProperties = new MaskingPropertyList(pluginData.object, this.drawableProperties);
    }
}

export class Graph extends Element {
    @DrawableProperty("Nodes", Type.parseType("List<Node>"))
    public nodes: Node[] = [];

    @DrawableProperty("Edges", Type.parseType("List<Edge>"))
    public edges: Edge[] = [];

    public pluginData: PluginData;

    createNode(kind: string) {
        const node = new Node(this.plugin.nodePluginData(kind));
        this.nodes.push(node);
        return node;
    }
    createEdge(kind: string, src: Node, dest: Node, like?: Edge) {
        const edge = new Edge(this.plugin.edgePluginData(kind), src, dest);
        // TODO: copy attributes from `like`
        this.edges.push(edge);
        return edge;
    }
    removeNode(node: Node) {
        this.nodes.splice(this.nodes.indexOf(node as Node), 1);
    }
    removeEdge(edge: Edge) {
        this.edges.splice(this.edges.indexOf(edge as Edge), 1);
    }
    canCreateEdge(kind: string, src: Node, dest: Node, like?: Edge) {
        return this.plugin.validator.isValidEdge(kind, src.pluginData.kind, dest.pluginData.kind);
    }

    @DrawableProperty("Background", Type.Color)
    backgroundColor = "#ffffff";

    @DrawableProperty("Example Tuple", Type.parseType("(String, Number)"))
    exampleTuple = ["hello", 10];

    constructor(public plugin: Plugin) {
        // TODO: fix that this is obviously special cased
        super(plugin.graphPluginData("DFAGraph"));
    }
}

export class Node extends Element {
    @DrawableProperty("Label", Type.String)
    label = "q0";

    @DrawableProperty("Shape", Type.Shape)
    shape: Shapes = "circle";

    @DrawableProperty("Color", Type.Color)
    color = "#ff7";

    @DrawableProperty("Border Color", Type.Color)
    borderColor = "#000";

    @DrawableProperty("Border Style", Type.LineStyles)
    borderStyle: LineStyles = "solid";

    @DrawableProperty("Border Width", Type.Number)
    borderWidth = 1;

    @DrawableProperty("Position", Type.Point)
    position = { x: 0, y: 0 };

    constructor(pluginData: PluginData) {
        super(pluginData);
    }
}

export class Edge extends Element {
    @DrawableProperty("Source Arrow", Type.Boolean)
    showSourceArrow = false;

    @DrawableProperty("Destination Arrow", Type.Boolean)
    showDestinationArrow = true;

    @DrawableProperty("Label", Type.String)
    label = "";

    @DrawableProperty("Color", Type.Color)
    color = "#000";

    @DrawableProperty("Line Style", Type.LineStyles)
    lineStyle: LineStyles = "solid";

    @DrawableProperty("Line Width", Type.Number)
    lineWidth = 1;

    @DrawableProperty("Source", Type.Node)
    source: Node;

    @DrawableProperty("Destination", Type.Node)
    destination: Node;

    constructor(pluginData: PluginData, source: Node, destination: Node) {
        super(pluginData);
        this.source = source;
        this.destination = destination;
    }
}


// HELPER CLASSES /////////////////////////////////////////////////////////////

function DrawableProperty(name: string, type: Type.Type) {
    return (target: Element, propertyKey: string | Symbol) => {
        if (propertyKey instanceof Symbol) {
            propertyKey = propertyKey.toString();
        }
        if (!target.drawablePropertyTypes) {
            target.drawablePropertyTypes = [];
        }
        target.drawablePropertyTypes.push([name, propertyKey, type]);
    };
}


export class MappedPropertyList implements PropertyList {
    properties: [string, Type.Type][] = [];
    propertyMap = new Map<string, string>();
    constructor(properties: [string, string, Type.Type][], public backerObject: any) {
        for (let [prettyName, backName, t] of properties) {
            this.properties.push([prettyName, t]);
            this.propertyMap.set(prettyName, backName);
        }
    }

    has(property: string) {
        return this.propertyMap.has(property);
    }

    key(property: string) {
        const key = this.propertyMap.get(property);
        if (!key) {
            throw "this property list doesn't have a key for '" + property + "'";
        }
        return key;
    }

    get(property: string) {
        return this.backerObject[this.key(property)];
    }

    set(property: string, value: any) {
        this.backerObject[this.key(property)] = value;
    }

    hide(mask: Set<string>) {
        const masked = new Set<string>();
        for (let i = this.properties.length - 1; i >= 0; i--) {
            const prop = this.propertyMap.get(this.properties[i][0]);
            if (prop && mask.has(prop)) {
                masked.add(prop);
                this.properties.splice(i, 1);
            }
        }
        return masked;
    }
}

class MaskingPropertyList implements PropertyList {
    maskedElements: Set<string>;
    constructor(public wrapped: MappedPropertyList, private maskedList: MappedPropertyList) {
        this.maskedElements = maskedList.hide(new Set(wrapped.propertyMap.values()));
    }

    get properties() {
        return this.wrapped.properties;
    }

    keyAndBacker(property: string): [string, any] {
        const backName = this.wrapped.key(property);
        if (!backName) {
            throw "this property list doesn't have a key for '" + property + "'";
        }
        if (this.maskedElements.has(backName)) {
            return [backName, this.maskedList.backerObject];
        }
        return [backName, this.wrapped.backerObject];
    }

    get(property: string) {
        const [key, backer] = this.keyAndBacker(property);
        return backer[key];
    }
    set(property: string, value: any) {
        const [key, backer] = this.keyAndBacker(property);
        backer[key] = value;
    }
}