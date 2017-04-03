import { Type, Value } from "sinap-types";

export class PrimitiveTypeComponent {
    private _value: Value.Primitive;

    public readonly: boolean = true;
    public disabled: boolean = false;

    set value(v: Value.Value) {
        if (v instanceof Value.Primitive) {
            this._value = v;
        } else {
            console.log(v, " is not a Primitive.");
        }
    }

    get value() {
        return this._value;
    }
}