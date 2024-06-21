import { PrivateKey, UInt64 } from "o1js";
import { games } from "./mock.js";
import { client } from "../src/index.js";
import { UInt64 as PUInt64 } from "@proto-kit/library";

const startGames = async () => {
    const publisherKey = PrivateKey.random();
    const publisher = publisherKey.toPublicKey();
    await client.start();

    console.log(publisher.toBase58());

    const gameToken = client.runtime.resolve("GameToken");
    for (let i = 0; i < games.length; i++) {
        console.log("Creating game: ", games[i].gameid.toString());
        const game = games[i];
        const tx = await client.transaction(publisher, () => {
            gameToken.createNewGame(
                publisher,
                game.price,
                game.discount,
                game.timeoutInterval,
                game.number_of_devices_allowed
            );
        });

        tx.transaction!.nonce = UInt64.from(i);
        tx.transaction = tx.transaction?.sign(publisherKey);
        await tx.send();
    }

    const tx = await client.transaction(publisher, () => {
        gameToken.initFeeReceiver(publisher);
    });

    tx.transaction!.nonce = UInt64.from(games.length);
    tx.transaction = tx.transaction?.sign(publisherKey);
    await tx.send();

    console.log("Fee receiver initialized: ", publisher.toBase58());

    const tx2 = await client.transaction(publisher, () => {
        gameToken.setFeeAmount(PUInt64.from(100));
    });

    tx2.transaction!.nonce = UInt64.from(games.length + 1);
    tx2.transaction = tx2.transaction?.sign(publisherKey);
    await tx2.send();
};

await startGames();
