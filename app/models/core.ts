import { PropertiedEntity, PropertyList } from "../components/properties-panel/properties-panel.component";
import * as Type from "./types";

export interface PluginData {
    propertyList: PropertyList;
    type: string;
}
export interface Plugin {
    kind: string;
    validator: {
        isValidEdge(t: string, src: string, dst: string): boolean;
    }

    nodeTypes: string[];
    edgeTypes: string[];

    graphPluginData(): PluginData;
    nodePluginData(type: string): PluginData;
    edgePluginData(type: string): PluginData;
}

class Element implements PropertiedEntity {
    public pluginProperties: PropertyList;
    public drawableProperties: PropertyList;
    public entityName = "duh";

    constructor(public pluginData: PluginData, private drawablePropertyMap: Map<string, [string, Type.Type]>) {
        this.drawableProperties = new MappedPropertyList(drawablePropertyMap, this);
        this.pluginProperties = pluginData.propertyList;
    }
}

export class Graph extends Element {
    public nodes: Node[] = [];
    public edges: Edge[] = [];
    public pluginData: PluginData;

    createNode(type: string) {
        const node = new Node(this.plugin.nodePluginData(type));
        this.nodes.push(node);
        return node;
    }
    createEdge(type: string, src: Node, dest: Node, like?: Edge) {
        const edge = new Edge(this.plugin.edgePluginData(type), src, dest);
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
    canCreateEdge(type: string, src: Node, dest: Node, like?: Edge) {
        return this.plugin.validator.isValidEdge(type, src.pluginData.type, dest.pluginData.type);
    }

    public backgroundColor = "#ffffff";

    constructor(public plugin: Plugin) {
        super(plugin.graphPluginData(), new Map<string, [string, Type.Type]>([
            ["Background", ["backgroundColor", Type.Color]],
        ]));
    }
}

export class Node extends Element {
    public label = "q0";
    public shape = "circle";
    public color = "#ff7";
    public borderColor = "#000";
    public borderStyle = "solid";
    public borderWidth = 1;
    public position = { x: 0, y: 0 };

    constructor(pluginData: PluginData) {
        super(pluginData, new Map<string, [keyof Node, Type.Type]>([
            ["Label", ["label", Type.String]],
            ["Shape", ["shape", Type.Shape]],
            ["Color", ["color", Type.Color]],
            ["Border Color", ["borderColor", Type.Color]],
            ["Border Style", ["borderStyle", Type.LineStyles]],
            ["Border Width", ["borderWidth", Type.Number]],
            ["Position", ["position", Type.Point]],
        ]));
    }
}

export class Edge extends Element {
    public showSourceArrow = false;
    public showDestinationArrow = true;
    public label = "";
    public color = "#000";
    public lineStyle = "solid";
    public lineWidth = 1;
    public constructor(pluginData: PluginData, public source: Node, public destination: Node) {
        super(pluginData, new Map<string, [keyof Edge, Type.Type]>([
            ["Source Arrow", ["showSourceArrow", Type.Boolean]],
            ["Destination Arrow", ["showDestinationArrow", Type.Boolean]],
            ["Label", ["label", Type.String]],
            ["Color", ["color", Type.Color]],
            ["Line Style", ["lineStyle", Type.LineStyles]],
            ["Line Width", ["lineWidth", Type.Number]],
            ["Source", ["source", Type.Node]],
            ["Destination", ["destination", Type.Node]],
        ]));
    }
}


// HELPER CLASSES /////////////////////////////////////////////////////////////

class MappedPropertyList implements PropertyList {
    properties: [string, Type.Type][] = [];
    constructor(private propertyMap: Map<string, [string, Type.Type]>, private backerObject: any) {
        for (let ent of propertyMap.entries()) {
            this.properties.push([ent[0], ent[1][1]]);
        }
    }
    private key(property: string) {
        const key = this.propertyMap.get(property);
        if (!key) {
            throw "reading a bad key from this property list";
        }
        return key[0];
    }

    get(property: string) {
        return this.backerObject[this.key(property)];
    }
    set(property: string, value: any) {
        this.backerObject[this.key(property)] = value;
    }
}