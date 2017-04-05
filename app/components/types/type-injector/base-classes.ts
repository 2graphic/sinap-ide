import { Type, Value } from "sinap-types";

export class BaseTypeComponent<T> {
    private _value: T;

    public readonly: boolean = true;
    public disabled: boolean = false;
}