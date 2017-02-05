import { Injectable, Inject } from '@angular/core';
import { PropertiedEntity, PropertyList, PropertiedEntityLists } from "../components/properties-panel/properties-panel.component";
import * as Core from '../models/core'
import { PluginService } from '../services/plugin.service'

function isPropertiedEntity(src: any): src is PropertiedEntity {
    return !!(src && src.drawableProperties && src.pluginProperties && src.entityName);
}

class Store {
    private entities: PropertiedEntity[] = [];
    transformed: any[] = [];

    add(pe: PropertiedEntity) {
        this.entities.push(pe);
        this.transformed.push(null);
        return this.entities.length - 1;
    }

    get(idx: number) {
        return this.transformed[idx];
    }

    set(idx: number, value: any) {
        return this.transformed[idx] = value;
    }

    transformer(key: string, value: any): any {
        const index = this.entities.indexOf(value);
        if (index != -1) {
            return { "pointerTo": index };
        }
        if (isPropertiedEntity(value)) {
            return serialize(value, this);
        }
        return value;
    }
}

function serialize(entity: PropertiedEntity, store: Store): any {
    const index = store.add(entity);

    const result: { [a: string]: any; } = { 'entityKind': entity.entityKind };

    for (const key of ['drawableProperties', 'pluginProperties'] as (keyof PropertiedEntityLists)[]) {
        const list: any = {};

        for (const pair of entity[key].properties) {
            const element = entity[key].get(pair[0]);
            if (element) {
                list[pair[0]] = (JSON.parse(JSON.stringify(element, (k, v) => store.transformer(k, v))))
            }
        }

        result[key] = list;
    }

    store.set(index, result);
    return { "pointerTo": index };
}

@Injectable()
export class SerializerService {
    constructor( @Inject(PluginService) private pluginService: PluginService) { }

    private serializeElement(element: Core.Element): any {
        let result: any = {};
        function serializePropList(props: PropertyList): any {
            let result: any = {};
            for (const [key, type] of props.properties) {
                result[key] = props.get(key);
            }
            return result;
        }
        result.drawableProperties = serializePropList(element.drawableProperties);
        result.pluginProperties = serializePropList(element.pluginProperties);
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
        });
        result.nodes = nodes;
        result.edges = edges;
        result.plugin = entity.plugin.kind;
        return result;
    }

    public deserialize(graph: any): Promise<Core.Graph> {
        return this.pluginService.getPlugin(graph.plugin)
            .then((plugin) => {
                const result = new Core.Graph(plugin);
                return result;
            });
    }
}
