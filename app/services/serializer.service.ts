import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList, PropertiedEntityLists } from "../components/properties-panel/properties-panel.component";
import * as Core from '../models/core'
import { PluginService } from '../services/plugin.service'

const fileFormatVersion = 'sinap-file-format-version';
const currentFormatVersion = '0.0.3';

@Injectable()
export class SerializerService {
    constructor( @Inject(PluginService) private pluginService: PluginService) { }

    private serializeElement(element: Core.Element): any {
        let result: any = {};
        const badKeys = ['Nodes', 'Edges', 'Children', 'Source', 'Destination'];
        function serializePropList(props: PropertyList): any {
            let result: any = {};
            for (const [key, type] of props.properties) {
                if (badKeys.indexOf(key) < 0) {
                    result[key] = props.get(key);
                }
            }
            return result;
        }
        result.drawableProperties = serializePropList(element.drawableProperties);
        result.pluginProperties = serializePropList(element.pluginProperties);
        result.entityKind = element.entityKind;
        return result;
    }

    public serialize(entity: Core.Graph): any {
        const result: any = this.serializeElement(entity);
        const nodeMap = new Map<Core.Node, number>();
        let nodes: any[] = [];
        for (const node of entity.nodes) {
            const result = this.serializeElement(node);
            nodeMap.set(node, nodes.length);
            nodes.push(result);
        }
        const edges = entity.edges.map((edge) => {
            let result = this.serializeElement(edge)
            result.source = nodeMap.get(edge.source);
            result.destination = nodeMap.get(edge.destination);
            return result;
        });
        result.nodes = nodes;
        result.edges = edges;
        let realResult: any = {
            'graph': result,
            'plugin': entity.plugin.kind
        };
        realResult[fileFormatVersion] = currentFormatVersion;
        return result;
    }

    public deserialize(pojo: any): Promise<Core.Graph> {
        if (pojo[fileFormatVersion] != currentFormatVersion) {
            console.log(pojo);
            console.log(pojo[fileFormatVersion]);
            return Promise.reject("invalid file format version");
        }
        return this.pluginService.getPlugin(pojo.plugin)
            .then((plugin) => {
                const result = new Core.Graph(plugin);
                function propsFromPojo(element: Core.Element, source: any) {
                    function insertProps(propList: PropertyList, sourceProps: any) {
                        for (const prop in sourceProps) {
                            propList.set(prop, sourceProps[prop]);
                        }
                    }
                    insertProps(element.drawableProperties, source.drawableProperties);
                    insertProps(element.pluginProperties, source.pluginProperties);
                }

                const graph = pojo.graph;
                propsFromPojo(result, graph);

                const nodes = graph.nodes.map((nodePojo: any): Core.Node => {
                    const node = result.createNode(nodePojo.entityKind);
                    propsFromPojo(node, nodePojo);
                    return node;
                });

                for (const edgePojo of graph.edges) {
                    const source = nodes[edgePojo.source];
                    const destination = nodes[edgePojo.destination];
                    const edge = result.createEdge(edgePojo.entityKind, source, destination);
                    propsFromPojo(edge, edgePojo);
                }

                return result;
            });
    }
}
