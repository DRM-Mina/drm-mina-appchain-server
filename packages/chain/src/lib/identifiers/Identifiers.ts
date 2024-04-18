import { CircuitString, Field, Poseidon, Struct } from "o1js";
import { CPUID, MacAddress, Serial, UUID } from "./IdentifierHelpers";

export interface RawIdentifiers {
    cpuId: string;
    systemSerial: string;
    systemUUID: string;
    baseboardSerial: string;
    macAddress: string[];
    diskSerial: string;
}

export class MacAddressField extends Struct({
    ethernet: Field,
    wifi: Field,
}) {
    constructor(macAddress: { ethernet: Field; wifi: Field }) {
        macAddress.ethernet.assertNotEquals(Field(0));
        macAddress.wifi.assertNotEquals(Field(0));
        super(macAddress);
    }
}

export class Identifiers extends Struct({
    cpuId: Field,
    systemSerial: CircuitString,
    systemUUID: Field,
    baseboardSerial: CircuitString,
    macAddress: MacAddressField,
    diskSerial: CircuitString,
}) {
    constructor(
        public cpuId: Field,
        public systemSerial: CircuitString,
        public systemUUID: Field,
        public baseboardSerial: CircuitString,
        public macAddress: MacAddressField,
        public diskSerial: CircuitString
    ) {
        super({
            cpuId,
            systemSerial,
            systemUUID,
            baseboardSerial,
            macAddress,
            diskSerial,
        });
    }

    static fromRaw(raw: RawIdentifiers): Identifiers {
        const cpuId = CPUID.fromStringToField(raw.cpuId);
        const systemSerial = Serial.fromStringToCircuitString(raw.systemSerial);
        const systemUUID = UUID.fromStringToField(raw.systemUUID);
        const baseboardSerial = Serial.fromStringToCircuitString(raw.baseboardSerial);
        const macAddress = MacAddress.fromStringArrayToMacAddressField(raw.macAddress);
        const diskSerial = Serial.fromStringToCircuitString(raw.diskSerial);

        return new Identifiers(
            cpuId,
            systemSerial,
            systemUUID,
            baseboardSerial,
            macAddress,
            diskSerial
        );
    }

    toFields() {
        return [
            this.cpuId,
            this.systemSerial.hash(),
            this.systemUUID,
            this.baseboardSerial.hash(),
            this.macAddress.ethernet,
            this.macAddress.wifi,
            this.diskSerial.hash(),
        ];
    }

    hash() {
        return Poseidon.hash(this.toFields());
    }
}
