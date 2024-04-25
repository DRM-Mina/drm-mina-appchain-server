import { PrivateKey, UInt64 } from "o1js";
import { games } from "./mock.js";
import { client } from "../src";

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
        console.log("Signing transaction", i);
        tx.transaction?.sign(publisherKey);
        console.log("Sending transaction", i);
        await tx.send();
        console.log("Sent transaction", i);
    }
};

await startGames();
