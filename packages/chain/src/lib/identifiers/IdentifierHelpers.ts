import { Bool, CircuitString, Field } from "o1js";
import { MacAddressField } from "./Identifiers.js";

export class UUID {
    constructor(public uuid: string) {
        if (!this.isValid()) {
            throw new Error("Invalid UUID");
        }
        this.uuid = uuid.replace(/-/g, "").toUpperCase();
    }

    isValid(): boolean {
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        return uuidRegex.test(this.uuid);
    }

    toBigNumber(): string {
        return BigInt("0x" + this.uuid).toString(10);
    }

    public toField(): Field {
        const bigint = this.toBigNumber();
        return Field(bigint);
    }

    public static fromStringToField(uuid: string): Field {
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(uuid)) throw new Error("Invalid UUID");
        uuid = uuid.replace(/-/g, "").toUpperCase();
        const bigint = BigInt("0x" + uuid).toString(10);
        return Field(bigint);
    }
}

export class CPUID {
    constructor(public cpuid: string) {
        if (!this.isValid()) {
            throw new Error("Invalid CPUID");
        }
        this.cpuid = cpuid.toUpperCase();
    }

    isValid(): boolean {
        const cpuidRegex = /^[0-9A-F]{16}$/;
        return cpuidRegex.test(this.cpuid);
    }

    toBigNumber(): string {
        return BigInt("0x" + this.cpuid).toString(10);
    }

    public toField(): Field {
        const bigint = this.toBigNumber();
        return Field(bigint);
    }

    public static fromStringToField(cpuid: string): Field {
        const cpuidRegex = /^[0-9A-F]{16}$/;
        if (!cpuidRegex.test(cpuid)) throw new Error("Invalid CPUID");
        cpuid = cpuid.toUpperCase();
        const bigint = BigInt("0x" + cpuid).toString(10);
        return Field(bigint);
    }
}

export class Serial {
    constructor(public serial: string) {
        serial = serial.toUpperCase();
    }

    toCircuitString(): CircuitString {
        return CircuitString.fromString(this.serial);
    }
    static assertEqual(a: Serial, b: Serial) {
        const aStr = a.toCircuitString();
        const bStr = b.toCircuitString();
        return aStr.assertEquals(bStr);
    }

    public static fromStringToCircuitString(serial: string): CircuitString {
        serial = serial.toUpperCase();
        return CircuitString.fromString(serial);
    }
}

export class MacAddress {
    constructor(public macAddress: string) {
        if (!this.isValid()) {
            throw new Error("Invalid MAC Address");
        }
        this.macAddress = this.macAddress.replace(/:/g, "").replace(/-/g, "").toUpperCase();
    }

    isValid(): boolean {
        const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macAddressRegex.test(this.macAddress);
    }

    public toBigNumber(): string {
        return BigInt("0x" + this.macAddress).toString(10);
    }

    public toField(): Field {
        const bigint = this.toBigNumber();
        return Field(bigint);
    }

    static fromStringArrayToMacAddressField(macAddress: string[]): MacAddressField {
        const [ethernet, wifi] = macAddress.map((mac) => {
            const macAddress = new MacAddress(mac);
            return macAddress.toField();
        });
        return new MacAddressField({ ethernet, wifi });
    }
}
