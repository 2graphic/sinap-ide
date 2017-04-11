import { Type, Value } from "sinap-types";

export class BaseTypeComponent<T> {
    public value: T;

    public readonly: boolean = true;
    public disabled: boolean = false;
}