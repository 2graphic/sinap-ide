import { MetaType, Type, ClassMetaType, TypeVariable } from "sinap-core";
import { PropertyList } from "../components/properties-panel/properties-panel.component";
import { MappedPropertyList } from "../models/core";


// TODO: convert to BFS so "closer" names will be more likely to be used
function addProperties(props: [string, string, MetaType][], type: ClassMetaType, done: Set<string>) {
    for (const [field, t] of type.fields.entries()) {
        if (!done.has(field)) {
            props.push([type.prettyName(field), field, t]);
            done.add(field);
        }
    }
    for (const sup of type.conformsTo) {
        if (sup instanceof TypeVariable) {
            throw "Invalid type" + type;
        }
        addProperties(props, sup, done);
    }
    return props;
}


export class Object extends MappedPropertyList {
    constructor(readonly type: ClassMetaType, public backer: any = []) {
        super(addProperties([], type, new Set()), backer);
    }
}