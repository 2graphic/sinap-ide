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
    drawablePropertyTypes: [string, string, Type.Type][];
    public pluginProperties: PropertyList;
    public drawableProperties: PropertyList;
    public entityName = "duh";

    constructor(public pluginData: PluginData) {
        this.drawableProperties = new MappedPropertyList(this.drawablePropertyTypes, this);
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

    @DrawableProperty("Background", Type.Color)
    backgroundColor = "#ffffff";

    constructor(public plugin: Plugin) {
        super(plugin.graphPluginData());
    }
}

export class Node extends Element {
    @DrawableProperty("Label", Type.String)
    label = "q0";

    @DrawableProperty("Shape", Type.Shape)
    shape = "circle";

    @DrawableProperty("Color", Type.Color)
    color = "#ff7";

    @DrawableProperty("Border Color", Type.Color)
    borderColor = "#000";

    @DrawableProperty("Border Style", Type.LineStyles)
    borderStyle = "solid";

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
    lineStyle = "solid";

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
        if (! target.drawablePropertyTypes){
            target.drawablePropertyTypes = [];
        }
        target.drawablePropertyTypes.push([name, propertyKey, type]);
    };
}


export class MappedPropertyList implements PropertyList {
    properties: [string, Type.Type][] = [];
    propertyMap = new Map<string, string>();
    constructor(properties: [string, string, Type.Type][], private backerObject: any) {
        for (let ent of properties) {
            this.properties.push([ent[0], ent[2]]);
            this.propertyMap.set(ent[0], ent[1]);
        }
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
}