import { TestingAppChain } from "@proto-kit/sdk";
import { GameToken } from "../src/GameToken";
import { PrivateKey } from "o1js";
import { TokenId, UInt64 } from "@proto-kit/library";
import { Balances } from "../src/balances";

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

    beforeAll(async () => {
        await appChain.start();
        appChain.setSigner(alicePrivateKey);
        const balances = appChain.runtime.resolve("Balances");
        const balanceTx = await appChain.transaction(alice, () => {
            balances.addBalance(TokenId.from(0), alice, UInt64.from(1000));
        });

        await balanceTx.sign();
        await balanceTx.send();

        await appChain.produceBlock();
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
        expect(aliceHasBoughtGame?.value).toBe(true);
    });
});
