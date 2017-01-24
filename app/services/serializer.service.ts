import { Injectable } from '@angular/core';
import { PropertiedEntity, PropertyList, PropertiedEntityLists } from "../components/properties-panel/properties-panel.component";
import * as Core from '../models/core'

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
    constructor() { }

    public serialize(entity: PropertiedEntity): [{ "pointerTo": number }, any[]] {
        const store = new Store();
        return [serialize(entity, store), store.transformed];
    }

    public deserialize(a: [{ "pointerTo": number }, any[]], plugin: Plugin): PropertiedEntity {
        const [initialPointer, store] = a;
        store[initialPointer.pointerTo];


        return {} as PropertiedEntity;
    }
}
