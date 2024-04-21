// TODO: remove after the issue https://github.com/o1-labs/o1js/issues/1549 is fixed
import { Provable, FlexibleProvable, Field } from "o1js";

type GenericHashInput<Field> = { fields?: Field[]; packed?: [Field, number][] };
function createHashInput<Field>() {
    type HashInput = GenericHashInput<Field>;
    return {
        get empty() {
            return {};
        },
        append(input1: HashInput, input2: HashInput): HashInput {
            return {
                fields: (input1.fields ?? []).concat(input2.fields ?? []),
                packed: (input1.packed ?? []).concat(input2.packed ?? []),
            };
        },
    };
}

type Constructor<T> = new (...args: any) => T;
type AnyConstructor = Constructor<any>;
type HashInput = GenericHashInput<Field>;
const HashInput = createHashInput<Field>();
type NonMethodKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonMethods<T> = Pick<T, NonMethodKeys<T>>;

export abstract class CircuitValue {
    constructor(...props: any[]) {
        // if this is called with no arguments, do nothing, to support simple super() calls
        if (props.length === 0) return;

        let fields = this.constructor.prototype._fields;
        if (fields === undefined) return;
        if (props.length !== fields.length) {
            throw Error(
                `${this.constructor.name} constructor called with ${props.length} arguments, but expected ${fields.length}`
            );
        }
        for (let i = 0; i < fields.length; ++i) {
            let [key] = fields[i];
            (this as any)[key] = props[i];
        }
    }

    static fromObject<T extends AnyConstructor>(
        this: T,
        value: NonMethods<InstanceType<T>>
    ): InstanceType<T> {
        return Object.assign(Object.create(this.prototype), value);
    }

    static sizeInFields(): number {
        const fields: [string, any][] = (this as any).prototype._fields;
        return fields.reduce((acc, [_, typ]) => acc + typ.sizeInFields(), 0);
    }

    static toFields<T extends AnyConstructor>(this: T, v: InstanceType<T>): Field[] {
        const res: Field[] = [];
        const fields = this.prototype._fields;
        if (fields === undefined || fields === null) {
            return res;
        }
        for (let i = 0, n = fields.length; i < n; ++i) {
            const [key, propType] = fields[i];
            const subElts: Field[] = propType.toFields((v as any)[key]);
            subElts.forEach((x) => res.push(x));
        }
        return res;
    }

    static toAuxiliary(): [] {
        return [];
    }

    static toInput<T extends AnyConstructor>(this: T, v: InstanceType<T>): HashInput {
        let input: HashInput = { fields: [], packed: [] };
        let fields = this.prototype._fields;
        if (fields === undefined) return input;
        for (let i = 0, n = fields.length; i < n; ++i) {
            let [key, type] = fields[i];
            if ("toInput" in type) {
                input = HashInput.append(input, type.toInput(v[key]));
                continue;
            }
            // as a fallback, use toFields on the type
            // TODO: this is problematic -- ignores if there's a toInput on a nested type
            // so, remove this? should every provable define toInput?
            let xs: Field[] = type.toFields(v[key]);
            input.fields!.push(...xs);
        }
        return input;
    }

    toFields(): Field[] {
        return (this.constructor as any).toFields(this);
    }

    toJSON(): any {
        return (this.constructor as any).toJSON(this);
    }

    toConstant(): this {
        return (this.constructor as any).toConstant(this);
    }

    equals(x: this) {
        return Provable.equal(this, x);
    }

    assertEquals(x: this) {
        Provable.assertEqual(this, x);
    }

    isConstant() {
        return this.toFields().every((x) => x.isConstant());
    }

    static fromFields<T extends AnyConstructor>(this: T, xs: Field[]): InstanceType<T> {
        const fields: [string, any][] = (this as any).prototype._fields;
        if (xs.length < fields.length) {
            throw Error(
                `${this.name}.fromFields: Expected ${fields.length} field elements, got ${xs?.length}`
            );
        }
        let offset = 0;
        const props: any = {};
        for (let i = 0; i < fields.length; ++i) {
            const [key, propType] = fields[i];
            const propSize = propType.sizeInFields();
            const propVal = propType.fromFields(xs.slice(offset, offset + propSize), []);
            props[key] = propVal;
            offset += propSize;
        }
        return Object.assign(Object.create(this.prototype), props);
    }

    static check<T extends AnyConstructor>(this: T, v: InstanceType<T>) {
        const fields = (this as any).prototype._fields;
        if (fields === undefined || fields === null) {
            return;
        }
        for (let i = 0; i < fields.length; ++i) {
            const [key, propType] = fields[i];
            const value = (v as any)[key];
            if (propType.check === undefined) throw Error("bug: CircuitValue without .check()");
            propType.check(value);
        }
    }

    static toConstant<T extends AnyConstructor>(this: T, t: InstanceType<T>): InstanceType<T> {
        const xs: Field[] = (this as any).toFields(t);
        return (this as any).fromFields(xs.map((x) => x.toConstant()));
    }

    static toJSON<T extends AnyConstructor>(this: T, v: InstanceType<T>) {
        const res: any = {};
        if ((this as any).prototype._fields !== undefined) {
            const fields: [string, any][] = (this as any).prototype._fields;
            fields.forEach(([key, propType]) => {
                res[key] = propType.toJSON((v as any)[key]);
            });
        }
        return res;
    }

    static fromJSON<T extends AnyConstructor>(this: T, value: any): InstanceType<T> {
        let props: any = {};
        let fields: [string, any][] = (this as any).prototype._fields;
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw Error(`${this.name}.fromJSON(): invalid input ${value}`);
        }
        if (fields !== undefined) {
            for (let i = 0; i < fields.length; ++i) {
                let [key, propType] = fields[i];
                if (value[key] === undefined) {
                    throw Error(`${this.name}.fromJSON(): invalid input ${value}`);
                } else {
                    props[key] = propType.fromJSON(value[key]);
                }
            }
        }
        return Object.assign(Object.create(this.prototype), props);
    }

    static empty<T extends AnyConstructor>(): InstanceType<T> {
        const fields: [string, any][] = (this as any).prototype._fields ?? [];
        let props: any = {};
        fields.forEach(([key, propType]) => {
            props[key] = propType.empty();
        });
        return Object.assign(Object.create(this.prototype), props);
    }
}

export function arrayProp<T>(elementType: FlexibleProvable<T>, length: number) {
    return function (target: any, key: string) {
        if (!target.hasOwnProperty("_fields")) {
            target._fields = [];
        }
        target._fields.push([key, Provable.Array(elementType, length)]);
    };
}
