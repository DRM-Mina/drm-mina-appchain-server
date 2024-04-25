import { Experimental, Field, Provable, PublicKey, Struct } from "o1js";
import { Identifiers } from "../lib/identifiers/Identifiers";
import { RuntimeModule, runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { UInt64 } from "@proto-kit/library";
import { GameToken, UserKey } from "./GameToken";
import { inject } from "tsyringe";

export class DeviceSessionInput extends Struct({
    gameId: UInt64,
    currentSessionKey: UInt64,
    newSessionKey: UInt64,
}) {}

export class DeviceSessionOutput extends Struct({
    gameId: UInt64,
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
                const gameId = publicInput.gameId;

                return {
                    gameId: gameId,
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

export class DeviceKey extends Struct({
    gameId: UInt64,
    address: PublicKey,
}) {
    public static from(gameId: UInt64, address: PublicKey) {
        return new DeviceKey({ gameId, address });
    }
}

export class SessionKey extends Struct({
    gameId: UInt64,
    identifierHash: Field,
}) {
    public static from(gameId: UInt64, identifierHash: Field) {
        return new SessionKey({ gameId, identifierHash });
    }
}

@runtimeModule()
export class DRM extends RuntimeModule<{}> {
    // Mapping from game id and user address to their device identifiers
    @state() public devices = StateMap.from<DeviceKey, Devices>(DeviceKey, Devices);

    // Mapping from game id and device identifier to their session key
    @state() public sessions = StateMap.from<SessionKey, UInt64>(SessionKey, UInt64);

    public constructor(@inject("GameToken") private gameToken: GameToken) {
        super();
    }

    /**
     * Add or change device
     * @param deviceProof proof of DeviceIdentifier program
     * @param gameId game id
     * @param deviceIndex index of the device (1-4)
     */
    @runtimeMethod()
    public addOrChangeDevice(
        deviceProof: DeviceIdentifierProof,
        gameId: UInt64,
        deviceIndex: UInt64
    ) {
        deviceProof.verify();

        const sender = this.transaction.sender.value;
        const userKey = UserKey.from(UInt64.from(gameId), sender);

        assert(this.gameToken.users.get(userKey).isSome, "You need to buy the game");

        assert(this.gameToken.users.get(userKey).value, "You need to buy the game");

        const number_of_devices_allowed = this.gameToken.number_of_devices_allowed
            .get(UInt64.from(gameId))
            .orElse(UInt64.from(4));

        assert(
            UInt64.from(deviceIndex).lessThanOrEqual(number_of_devices_allowed),
            "You do not have that slot to add a device"
        );

        const deviceIdentifierHash = deviceProof.publicOutput;
        const deviceKey = DeviceKey.from(UInt64.from(gameId), sender);

        const userDevices = this.devices.get(deviceKey).value;

        const device_1 = Provable.if(
            UInt64.from(deviceIndex).equals(UInt64.from(1)),
            deviceIdentifierHash,
            userDevices.device_1
        );

        const device_2 = Provable.if(
            UInt64.from(deviceIndex).equals(UInt64.from(2)),
            deviceIdentifierHash,
            userDevices.device_2
        );

        const device_3 = Provable.if(
            UInt64.from(deviceIndex).equals(UInt64.from(3)),
            deviceIdentifierHash,
            userDevices.device_3
        );

        const device_4 = Provable.if(
            UInt64.from(deviceIndex).equals(UInt64.from(4)),
            deviceIdentifierHash,
            userDevices.device_4
        );

        const newDevices = new Devices({
            device_1: device_1,
            device_2: device_2,
            device_3: device_3,
            device_4: device_4,
        });

        this.devices.set(deviceKey, newDevices);

        const sessionKey = SessionKey.from(UInt64.from(gameId), deviceIdentifierHash);

        this.sessions.set(sessionKey, UInt64.from(1));
    }

    /**
     * Create new session different from the current one
     * @param deviceSessionProof proof of DeviceSession program
     */
    @runtimeMethod()
    public createSession(deviceSessionProof: DeviceSessionProof) {
        deviceSessionProof.verify();

        const deviceHash = deviceSessionProof.publicOutput.hash;

        const currentSessionKey = deviceSessionProof.publicInput.currentSessionKey;

        const newSessionKey = deviceSessionProof.publicOutput.newSessionKey;

        const gameId = deviceSessionProof.publicOutput.gameId;
        const sessionKey = SessionKey.from(UInt64.from(gameId), deviceHash);

        assert(this.sessions.get(sessionKey).isSome, "Device not found");

        const currentSession = UInt64.from(this.sessions.get(sessionKey).value);

        assert(currentSession.greaterThanOrEqual(UInt64.from(Field(1))), "Device not active");

        assert(currentSession.equals(currentSessionKey), "Invalid proof");

        assert(currentSession.equals(newSessionKey).not(), "Session already used");

        this.sessions.set(sessionKey, newSessionKey);
    }
}
