import { log } from "@proto-kit/common";
import { TestingAppChain } from "@proto-kit/sdk";
import { Balances } from "../src/balances";
import { GameToken, UserKey } from "../src/GameToken";
import {
    DRM,
    DeviceIdentifier,
    DeviceSession,
    DeviceSessionInput,
    DeviceKey,
    SessionKey,
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

    const publisherPrivateKey = PrivateKey.random();
    const publisher = publisherPrivateKey.toPublicKey();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    const AliceDeviceRaw = mockIdentifiers[0];
    const AliceDeviceIdentifiers = Identifiers.fromRaw(AliceDeviceRaw);

    const bobPrivateKey = PrivateKey.random();
    const bob = bobPrivateKey.toPublicKey();

    const BobDeviceRaw = mockIdentifiers[1];
    const BobDeviceIdentifiers = Identifiers.fromRaw(BobDeviceRaw);

    const tokenId = TokenId.from(0);

    it("start appchain,create then buy game", async () => {
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

        // create game
        appChain.setSigner(publisherPrivateKey);
        appChain.setSigner(publisherPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");
        const createGameTx = await appChain.transaction(publisher, () => {
            gameToken.createNewGame(
                publisher,
                UInt64.from(100),
                UInt64.from(0),
                UInt64.from(240),
                UInt64.from(4)
            );
        });
        await createGameTx.sign();
        await createGameTx.send();

        const creatingBlock = await appChain.produceBlock();
        const gameId = await appChain.query.runtime.GameToken.totalGameNumber.get();
        expect(creatingBlock?.transactions[0].status.toBoolean()).toBe(true);
        expect(gameId?.toString()).toBe("1");
        const publisherOfGame = await appChain.query.runtime.GameToken.publisher.get(
            UInt64.from(gameId || 1)
        );
        expect(publisherOfGame?.toString()).toBe(publisher.toString());

        // buy game
        appChain.setSigner(alicePrivateKey);
        const buyGameTx = await appChain.transaction(alice, () => {
            gameToken.buyGame(UInt64.from(1));
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const buyBlock = await appChain.produceBlock();
        const aliceUserKey = new UserKey({ gameId: UInt64.from(1), address: alice });
        const aliceHasBoughtGame = await appChain.query.runtime.GameToken.users.get(aliceUserKey);
        const aliceBalanceKey = new BalancesKey({ tokenId, address: alice });
        const aliceBalance = await appChain.query.runtime.Balances.balances.get(aliceBalanceKey);
        const publisherBalanceKey = new BalancesKey({ tokenId, address: publisher });
        const publisherBalance =
            await appChain.query.runtime.Balances.balances.get(publisherBalanceKey);
        expect(aliceBalance?.toString()).toBe("900");
        expect(publisherBalance?.toString()).toBe("100");
        expect(buyBlock?.transactions[0].status.toBoolean()).toBe(true);
        expect(aliceHasBoughtGame?.toString()).toBe("true");
    }, 10000000);

    it("alice should add device", async () => {
        const drm = appChain.runtime.resolve("DRM");
        await DeviceIdentifier.compile();

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(AliceDeviceIdentifiers);

        const tx = await appChain.transaction(alice, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(1), UInt64.from(1));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const aliceDeviceKey = new DeviceKey({ gameId: UInt64.from(1), address: alice });
        const AliceDevices = await appChain.query.runtime.DRM.devices.get(aliceDeviceKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(AliceDevices?.device_1.toString()).toBe(AliceDeviceIdentifiers.hash().toString());
    }, 10000000);

    it("bob should not add device because he has not bought the game", async () => {
        const drm = appChain.runtime.resolve("DRM");
        appChain.setSigner(bobPrivateKey);

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(BobDeviceIdentifiers);

        const tx = await appChain.transaction(bob, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(1), UInt64.from(1));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const bobDeviceKey = new DeviceKey({ gameId: UInt64.from(1), address: bob });
        const BobDevices = await appChain.query.runtime.DRM.devices.get(bobDeviceKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(BobDevices).toBe(undefined);
    });

    it("alice can add another device", async () => {
        const drm = appChain.runtime.resolve("DRM");
        appChain.setSigner(alicePrivateKey);

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(BobDeviceIdentifiers);

        const tx = await appChain.transaction(alice, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(1), UInt64.from(2));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        const aliceDeviceKey = new DeviceKey({ gameId: UInt64.from(1), address: alice });
        const AliceDevices = await appChain.query.runtime.DRM.devices.get(aliceDeviceKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(AliceDevices?.device_1.toString()).toBe(AliceDeviceIdentifiers.hash().toString());
        expect(AliceDevices?.device_2.toString()).toBe(BobDeviceIdentifiers.hash().toString());
    });

    it("alice should not add more than 4 devices", async () => {
        const drm = appChain.runtime.resolve("DRM");

        const deviceIdentifier = await DeviceIdentifier.proofForDevice(BobDeviceIdentifiers);

        const tx = await appChain.transaction(alice, () => {
            drm.addOrChangeDevice(deviceIdentifier, UInt64.from(1), UInt64.from(5));
        });

        await tx.sign();
        await tx.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
    });

    it("alice should create device session with arbitrary wallet", async () => {
        const drm = appChain.runtime.resolve("DRM");

        const arbitraryKey = PrivateKey.random();
        const arbitraryWallet = arbitraryKey.toPublicKey();

        appChain.setSigner(arbitraryKey);

        await DeviceSession.compile();

        const publicInput = new DeviceSessionInput({
            gameId: UInt64.from(1),
            currentSessionKey: UInt64.from(1),
            newSessionKey: UInt64.from(555),
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
        const sessionKey = new SessionKey({
            gameId: UInt64.from(1),
            identifierHash: AliceDeviceIdentifiers.hash(),
        });
        const session = await appChain.query.runtime.DRM.sessions.get(sessionKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(session?.toString()).toBe("555");
    }, 10000000);
});
