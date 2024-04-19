import { Experimental, Field, Provable, PublicKey, Struct } from "o1js";
import { Identifiers } from "./lib/identifiers/Identifiers";
import { RuntimeModule, runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { UInt64 } from "@proto-kit/library";
import { GameToken } from "./GameToken";
import { inject } from "tsyringe";

export class DeviceSessionInput extends Struct({
    currentSessionKey: UInt64,
    newSessionKey: UInt64,
}) {}

export class DeviceSessionOutput extends Struct({
    newSessionKey: UInt64,
    hash: Field,
}) {}

export const DeviceSession = Experimental.ZkProgram({
    name: "DeviceSession",
    publicInput: DeviceSessionInput,
    publicOutput: DeviceSessionOutput,
    methods: {
        proofForSession: {
            privateInputs: [Identifiers],
            method(publicInput: DeviceSessionInput, identifiers: Identifiers) {
                const identifiersHash = identifiers.hash();
                const newSessionKey = publicInput.newSessionKey;

                return {
                    newSessionKey: newSessionKey,
                    hash: identifiersHash,
                };
            },
        },
    },
});

export class DeviceSessionProof extends Experimental.ZkProgram.Proof(DeviceSession) {}

export const DeviceIdentifier = Experimental.ZkProgram({
    name: "DeviceIdentifier",
    publicOutput: Field,
    methods: {
        proofForDevice: {
            privateInputs: [Identifiers],
            method(identifiers: Identifiers) {
                // TODO: Implement check for device identifier

                return identifiers.hash();
            },
        },
    },
});

export class DeviceIdentifierProof extends Experimental.ZkProgram.Proof(DeviceIdentifier) {}

export class Devices extends Struct({
    device_1: Field,
    device_2: Field,
    device_3: Field,
    device_4: Field,
}) {}

@runtimeModule()
export class DRM extends RuntimeModule<{}> {
    @state() public devices = StateMap.from<PublicKey, Devices>(PublicKey, Devices);

    @state() public device_sessions = StateMap.from<Field, UInt64>(Field, UInt64);

    public constructor(@inject("GameToken") private gameToken: GameToken) {
        super();
    }

    @runtimeMethod()
    public addOrChangeDevice(deviceProof: DeviceIdentifierProof, deviceIndex: UInt64) {
        deviceProof.verify();

        const sender = this.transaction.sender.value;

        assert(this.gameToken.users.get(sender).isSome, "You need to buy the game");

        assert(this.gameToken.users.get(sender).value, "You need to buy the game");

        const number_of_devices_allowed = this.gameToken.number_of_devices_allowed.get();

        assert(
            deviceIndex.lessThanOrEqual(number_of_devices_allowed.value),
            "You do not have that slot to add a device"
        );

        const deviceIdentifierHash = deviceProof.publicOutput;

        const device_1 = Provable.if(
            deviceIndex.equals(UInt64.from(Field(1))),
            deviceIdentifierHash,
            this.devices.get(sender).value.device_1
        );

        const device_2 = Provable.if(
            deviceIndex.equals(UInt64.from(Field(2))),
            deviceIdentifierHash,
            this.devices.get(sender).value.device_2
        );

        const device_3 = Provable.if(
            deviceIndex.equals(UInt64.from(Field(3))),
            deviceIdentifierHash,
            this.devices.get(sender).value.device_3
        );

        const device_4 = Provable.if(
            deviceIndex.equals(UInt64.from(Field(4))),
            deviceIdentifierHash,
            this.devices.get(sender).value.device_4
        );

        const newDevices = new Devices({
            device_1: device_1,
            device_2: device_2,
            device_3: device_3,
            device_4: device_4,
        });

        this.devices.set(sender, newDevices);

        this.device_sessions.set(deviceIdentifierHash, UInt64.from(Field(1)));
    }

    @runtimeMethod()
    public createSession(deviceSessionProof: DeviceSessionProof) {
        deviceSessionProof.verify();

        const deviceHash = deviceSessionProof.publicOutput.hash;

        const currentSessionKey = deviceSessionProof.publicInput.currentSessionKey;

        const newSessionKey = deviceSessionProof.publicOutput.newSessionKey;

        assert(this.device_sessions.get(deviceHash).isSome, "Device not found");

        assert(
            this.device_sessions.get(deviceHash).value.greaterThanOrEqual(UInt64.from(Field(0))),
            "Device not active"
        );

        assert(
            this.device_sessions.get(deviceHash).value.equals(currentSessionKey),
            "Invalid proof"
        );

        assert(
            this.device_sessions.get(deviceHash).value.equals(newSessionKey).not(),
            "Session already used"
        );

        this.device_sessions.set(deviceHash, newSessionKey);
    }
}
