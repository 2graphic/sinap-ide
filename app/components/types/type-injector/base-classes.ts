import { Type, Value } from "sinap-types";
import { GraphController } from "../../../models/graph-controller";

export class BaseTypeComponent<T> {
    public value: T;

    public readonly: boolean = true;
    public disabled: boolean = false;
    public graph: GraphController;
}