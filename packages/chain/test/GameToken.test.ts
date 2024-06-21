import { TestingAppChain } from "@proto-kit/sdk";
import { GameToken, UserKey } from "../src";
import { PrivateKey } from "o1js";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { Balances } from "../src";
import { log } from "@proto-kit/common";

log.setLevel("ERROR");

describe("GameToken Module", () => {
    const appChain = TestingAppChain.fromRuntime({
        Balances,
        GameToken,
    });
    appChain.configurePartial({
        Runtime: {
            Balances: {},
            GameToken: {},
        },
    });

    const feeReceiverPrivateKey = PrivateKey.random();
    const feeReceiver = feeReceiverPrivateKey.toPublicKey();

    const feeReceiver2PrivateKey = PrivateKey.random();
    const feeReceiver2 = feeReceiver2PrivateKey.toPublicKey();

    const publisherPrivateKey = PrivateKey.random();
    const publisher = publisherPrivateKey.toPublicKey();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    const bobPrivateKey = PrivateKey.random();
    const bob = bobPrivateKey.toPublicKey();

    const tokenId = TokenId.from(0);

    it("start appchain and give balance", async () => {
        await appChain.start();
        appChain.setSigner(alicePrivateKey);
        const balances = appChain.runtime.resolve("Balances");

        const tx1 = await appChain.transaction(alice, () => {
            balances.addBalance(tokenId, alice, UInt64.from(1000));
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();

        const key = new BalancesKey({ tokenId, address: alice });
        const balance = await appChain.query.runtime.Balances.balances.get(key);

        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(balance?.toString()).toBe("1000");
    });

    it("should not set feeAmount if not feeReceiver", async () => {
        appChain.setSigner(feeReceiverPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");

        const tx1 = await appChain.transaction(feeReceiver, () => {
            gameToken.setFeeAmount(UInt64.from(100));
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
    });

    it("initailize feeReceiver and feeAmount", async () => {
        appChain.setSigner(feeReceiverPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");

        const tx1 = await appChain.transaction(feeReceiver, () => {
            gameToken.initFeeReceiver(feeReceiver);
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();

        const feeReceiverKey = await appChain.query.runtime.GameToken.feeReceiver.get();

        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(feeReceiverKey?.toString()).toBe(feeReceiver.toString());

        const tx2 = await appChain.transaction(feeReceiver, () => {
            gameToken.setFeeAmount(UInt64.from(100));
        });

        await tx2.sign();
        await tx2.send();

        const block2 = await appChain.produceBlock();
        const feeAmount = await appChain.query.runtime.GameToken.feeAmount.get();

        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        expect(feeAmount?.toString()).toBe("100");
    });

    it("should not init feeReceiver if already set", async () => {
        appChain.setSigner(bobPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");

        const tx1 = await appChain.transaction(bob, () => {
            gameToken.initFeeReceiver(bob);
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);

        const feeReceiverKey = await appChain.query.runtime.GameToken.feeReceiver.get();
        expect(feeReceiverKey?.toString()).toBe(feeReceiver.toString());
    });

    it("feeReceiver should be able to set feeReceiver", async () => {
        appChain.setSigner(feeReceiverPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");

        const tx1 = await appChain.transaction(feeReceiver, () => {
            gameToken.setFeeReceiver(feeReceiver2);
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();
        const feeReceiverKey = await appChain.query.runtime.GameToken.feeReceiver.get();

        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(feeReceiverKey?.toString()).toBe(feeReceiver2.toString());
    });

    it("should not set feeReceiver if not feeReceiver", async () => {
        appChain.setSigner(feeReceiverPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");

        const tx1 = await appChain.transaction(feeReceiver, () => {
            gameToken.setFeeReceiver(feeReceiver);
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);

        const feeReceiverKey = await appChain.query.runtime.GameToken.feeReceiver.get();
        expect(feeReceiverKey?.toString()).toBe(feeReceiver2.toString());
    });

    it("should not set feeAmount if not feeReceiver", async () => {
        appChain.setSigner(feeReceiverPrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");

        const tx1 = await appChain.transaction(feeReceiver, () => {
            gameToken.setFeeAmount(UInt64.from(200));
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);

        const feeAmount = await appChain.query.runtime.GameToken.feeAmount.get();
        expect(feeAmount?.toString()).toBe("100");
    });

    it("publiher should create game", async () => {
        appChain.setSigner(publisherPrivateKey);

        const balances = appChain.runtime.resolve("Balances");
        const tx1 = await appChain.transaction(publisher, () => {
            balances.addBalance(tokenId, publisher, UInt64.from(100));
        });

        await tx1.sign();
        await tx1.send();

        const balanceBlock = await appChain.produceBlock();

        const key = new BalancesKey({ tokenId, address: publisher });
        const balance = await appChain.query.runtime.Balances.balances.get(key);

        expect(balance?.toString()).toBe("100");

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

        const block = await appChain.produceBlock();
        const gameId = await appChain.query.runtime.GameToken.totalGameNumber.get();
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(gameId?.toString()).toBe("1");
        const publisherOfGame = await appChain.query.runtime.GameToken.publisher.get(
            UInt64.from(gameId || 1)
        );
        expect(publisherOfGame?.toString()).toBe(publisher.toString());

        const feeReceiverKey = await appChain.query.runtime.GameToken.feeReceiver.get();
        expect(feeReceiverKey?.toString()).toBe(feeReceiver2.toString());
        const feeReceiverBalanceKey = new BalancesKey({ tokenId, address: feeReceiver2 });
        const feeReceiverBalance =
            await appChain.query.runtime.Balances.balances.get(feeReceiverBalanceKey);

        expect(feeReceiverBalance?.toString()).toBe("100");
    });

    it("should buy game", async () => {
        appChain.setSigner(alicePrivateKey);
        const gameToken = appChain.runtime.resolve("GameToken");
        const buyGameTx = await appChain.transaction(alice, () => {
            gameToken.buyGame(UInt64.from(1));
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const aliceUserKey = new UserKey({ gameId: UInt64.from(1), address: alice });
        const aliceHasBoughtGame = await appChain.query.runtime.GameToken.users.get(aliceUserKey);
        const aliceBalanceKey = new BalancesKey({ tokenId, address: alice });
        const aliceBalance = await appChain.query.runtime.Balances.balances.get(aliceBalanceKey);
        const publisherBalanceKey = new BalancesKey({ tokenId, address: publisher });
        const publisherBalance =
            await appChain.query.runtime.Balances.balances.get(publisherBalanceKey);
        expect(aliceBalance?.toString()).toBe("900");
        expect(publisherBalance?.toString()).toBe("100");
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(aliceHasBoughtGame?.toString()).toBe("true");
    });

    it("should not buy game if already bought", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        const buyGameTx = await appChain.transaction(alice, () => {
            gameToken.buyGame(UInt64.from(1));
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const aliceUserKey = new UserKey({ gameId: UInt64.from(1), address: alice });
        const aliceHasBoughtGame = await appChain.query.runtime.GameToken.users.get(aliceUserKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(aliceHasBoughtGame?.toString()).toBe("true");
    });

    it("should not buy game if insufficient balance", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        appChain.setSigner(bobPrivateKey);
        const buyGameTx = await appChain.transaction(bob, () => {
            gameToken.buyGame(UInt64.from(1));
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const bobUserKey = new UserKey({ gameId: UInt64.from(1), address: bob });
        const bobHasBoughtGame = await appChain.query.runtime.GameToken.users.get(bobUserKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(bobHasBoughtGame?.toString()).toBe(undefined);
    });

    it("alice should be able to gift game to bob", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        appChain.setSigner(alicePrivateKey);
        const giftGameTx = await appChain.transaction(alice, () => {
            gameToken.giftGame(UInt64.from(1), bob);
        });
        await giftGameTx.sign();
        await giftGameTx.send();
        const block = await appChain.produceBlock();
        const bobUserKey = new UserKey({ gameId: UInt64.from(1), address: bob });
        const bobHasBoughtGame = await appChain.query.runtime.GameToken.users.get(bobUserKey);
        const aliceBalanceKey = new BalancesKey({ tokenId, address: alice });
        const aliceBalance = await appChain.query.runtime.Balances.balances.get(aliceBalanceKey);
        const publisherBalanceKey = new BalancesKey({ tokenId, address: publisher });
        const publisherBalance =
            await appChain.query.runtime.Balances.balances.get(publisherBalanceKey);
        expect(aliceBalance?.toString()).toBe("800");
        expect(publisherBalance?.toString()).toBe("200");
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(bobHasBoughtGame?.toString()).toBe("true");
    });

    it("should not gift game if already bought", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        const giftGameTx = await appChain.transaction(alice, () => {
            gameToken.giftGame(UInt64.from(1), bob);
        });
        await giftGameTx.sign();
        await giftGameTx.send();
        const block = await appChain.produceBlock();
        const bobUserKey = new UserKey({ gameId: UInt64.from(1), address: bob });
        const bobHasBoughtGame = await appChain.query.runtime.GameToken.users.get(bobUserKey);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(bobHasBoughtGame?.toString()).toBe("true");
    });
});
