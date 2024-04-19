import express, { Express, Request, Response } from "express";
import { client } from "chain";
import { PrivateKey, UInt64 } from "o1js";
import { TokenId, Balance, BalancesKey } from "@proto-kit/library";

const server = express();
const serverKey = PrivateKey.random();
const serverPubKey = serverKey.toPublicKey();
await client.start();

server.get("/", async (req, res) => {
    res.send("Hello World!");
});

server.get("/add", async (req, res) => {
    const balances = client.runtime.resolve("Balances");
    const tx = await client.transaction(serverPubKey, () => {
        balances.addBalance(TokenId.from(0), serverPubKey, Balance.from(1000));
    });
    tx.transaction = tx.transaction?.sign(serverKey);
    await tx.send();
    res.send("done");
});
server.get("/getBalance", async (req, res) => {
    const key = new BalancesKey({
        tokenId: TokenId.from(0),
        address: serverPubKey,
    });
    const balance = await client.query.runtime.Balances.balances.get(key);
    res.send("Balance: " + balance);
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
