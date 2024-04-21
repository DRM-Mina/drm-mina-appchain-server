import { log } from "@proto-kit/common";
import { TestingAppChain } from "@proto-kit/sdk";
import { Balances } from "../src/balances";
import { GameToken } from "../src/GameToken";
import {
    DRM,
    DeviceIdentifier,
    DeviceIdentifierProof,
    DeviceSession,
    DeviceSessionInput,
} from "../src/DRM";
import { PrivateKey } from "o1js";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { mockIdentifiers } from "./mock";
import { Identifiers } from "../src/lib/identifiers/Identifiers";

log.setLevel("ERROR");

describe("DRM Module", () => {
    const appChain = TestingAppChain.fromRuntime({
        Balances,
        GameToken,
        DRM,
    });
    appChain.configurePartial({
        Runtime: {
            Balances: {},
            GameToken: {},
            DRM: {},
        },
    });

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    const AliceDeviceRaw = mockIdentifiers[0];
    const AliceDeviceIdentifiers = Identifiers.fromRaw(AliceDeviceRaw);

    const bobPrivateKey = PrivateKey.random();
    const bob = bobPrivateKey.toPublicKey();

    const BobDeviceRaw = mockIdentifiers[1];
    const BobDeviceIdentifiers = Identifiers.fromRaw(BobDeviceRaw);

    const tokenId = TokenId.from(0);

    it("start appchain and buy gane", async () => {
        await appChain.start();
        appChain.setSigner(alicePrivateKey);
        const balances = appChain.runtime.resolve("Balances");
        const tx1 = await appChain.transaction(alice, () => {
            balances.addBalance(tokenId, alice, UInt64.from(1000));
        });

        await tx1.sign();
        await tx1.send();
        await appChain.produceBlock();
        const key = new BalancesKey({ tokenId, address: alice });
        const balance = await appChain.query.runtime.Balances.balances.get(key);
        expect(balance?.toString()).toBe("1000");

        const gameToken = appChain.runtime.resolve("GameToken");
        const buyGameTx = await appChain.transaction(alice, () => {
            gameToken.buyGame();
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const aliceHasBoughtGame = await appChain.query.runtime.GameToken.users.get(alice);
        // expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(aliceHasBoughtGame?.toString()).toBe("true");
    }, 10000000);

    it("should add device", async () => {
        const drm = appChain.runtime.resolve("DRM");
        await DeviceIdentifier.compile();

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(AliceDeviceIdentifiers);

        const tx = await appChain.transaction(alice, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(1));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const AliceDevices = await appChain.query.runtime.DRM.devices.get(alice);

        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(AliceDevices?.device_1.toString()).toBe(AliceDeviceIdentifiers.hash().toString());
    }, 10000000);

    it("should not add bob's device because he has not bought the game", async () => {
        const drm = appChain.runtime.resolve("DRM");

        appChain.setSigner(bobPrivateKey);
        const deviceIdentifier = await DeviceIdentifier.proofForDevice(BobDeviceIdentifiers);

        const tx = await appChain.transaction(bob, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(1));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const BobDevices = await appChain.query.runtime.DRM.devices.get(bob);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(BobDevices).toBe(undefined);
    });

    it("alice can add bob's device", async () => {
        const drm = appChain.runtime.resolve("DRM");
        appChain.setSigner(alicePrivateKey);

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(BobDeviceIdentifiers);

        const tx = await appChain.transaction(alice, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(2));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const AliceDevices = await appChain.query.runtime.DRM.devices.get(alice);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(AliceDevices?.device_1.toString()).toBe(AliceDeviceIdentifiers.hash().toString());
        expect(AliceDevices?.device_2.toString()).toBe(BobDeviceIdentifiers.hash().toString());
    });

    it("should not add more than 4 devices", async () => {
        const drm = appChain.runtime.resolve("DRM");

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(BobDeviceIdentifiers);

        const tx = await appChain.transaction(alice, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(5));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const BobDevices = await appChain.query.runtime.DRM.devices.get(bob);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(BobDevices).toBe(undefined);
    });

    it("alice should create device session with arbitrary wallet", async () => {
        const drm = appChain.runtime.resolve("DRM");

        const arbitraryKey = PrivateKey.random();
        const arbitraryWallet = arbitraryKey.toPublicKey();

        appChain.setSigner(arbitraryKey);

        await DeviceSession.compile();
        const publicInput = new DeviceSessionInput({
            currentSessionKey: UInt64.from(1),
            newSessionKey: UInt64.from(2),
        });

        const deviceSession = await DeviceSession.proofForSession(
            publicInput,
            AliceDeviceIdentifiers
        );

        const tx = await appChain.transaction(arbitraryWallet, () => {
            drm.createSession(deviceSession);
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const session = await appChain.query.runtime.DRM.device_sessions.get(
            AliceDeviceIdentifiers.hash()
        );
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(session?.toString()).toBe("2");
    }, 10000000);
});
