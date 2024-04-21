import { TestingAppChain } from "@proto-kit/sdk";
import { GameToken } from "../src/GameToken";
import { PrivateKey } from "o1js";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { Balances } from "../src/balances";
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

    it("should buy game", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        const buyGameTx = await appChain.transaction(alice, () => {
            gameToken.buyGame();
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const aliceHasBoughtGame = await appChain.query.runtime.GameToken.users.get(alice);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(aliceHasBoughtGame?.toString()).toBe("true");
    });

    it("should not buy game if already bought", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        const buyGameTx = await appChain.transaction(alice, () => {
            gameToken.buyGame();
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const aliceHasBoughtGame = await appChain.query.runtime.GameToken.users.get(alice);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(aliceHasBoughtGame?.toString()).toBe("true");
    });

    it("should not buy game if insufficient balance", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        appChain.setSigner(bobPrivateKey);
        const buyGameTx = await appChain.transaction(bob, () => {
            gameToken.buyGame();
        });
        await buyGameTx.sign();
        await buyGameTx.send();
        const block = await appChain.produceBlock();
        const bobHasBoughtGame = await appChain.query.runtime.GameToken.users.get(bob);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(bobHasBoughtGame?.toString()).toBe(undefined);
    });

    it("should gift game to bob", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        appChain.setSigner(alicePrivateKey);
        const giftGameTx = await appChain.transaction(alice, () => {
            gameToken.giftGame(bob);
        });
        await giftGameTx.sign();
        await giftGameTx.send();
        const block = await appChain.produceBlock();
        const bobHasBoughtGame = await appChain.query.runtime.GameToken.users.get(bob);
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(bobHasBoughtGame?.toString()).toBe("true");
    });

    it("should not gift game if already bought", async () => {
        const gameToken = appChain.runtime.resolve("GameToken");
        const giftGameTx = await appChain.transaction(alice, () => {
            gameToken.giftGame(bob);
        });
        await giftGameTx.sign();
        await giftGameTx.send();
        const block = await appChain.produceBlock();
        const bobHasBoughtGame = await appChain.query.runtime.GameToken.users.get(bob);
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(bobHasBoughtGame?.toString()).toBe("true");
    });
});
