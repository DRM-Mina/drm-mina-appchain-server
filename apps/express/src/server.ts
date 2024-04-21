import { MINA_ADDRESS_REGEX } from "./utils.js";
import { Game, User } from "./schemas.js";
import mongoose from "mongoose";
import logger from "./logger";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import serveStatic from "serve-static";
dotenv.config();

//@ts-ignore
mongoose.connect(process.env.MONGO);
const mongoDb = mongoose.connection;
mongoDb.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
});

mongoDb.once("open", function () {
    logger.info("Connected successfully to MongoDB");
});

const app = express();
const port = 3152;

app.use(cors());
app.use(express.json());
app.use(serveStatic("public"));

app.get("/game-data", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const games = await Game.find({});
    logger.info("Game Data Sended.");
    res.json(games);
});

app.post("/wishlist/:publicKey", async (req, res) => {
    const { publicKey } = req.params;
    const { gameId } = req.body;

    try {
        const user = await User.findOne({ publicKey });

        if (user) {
            if (user.wishlistedGames.includes(gameId)) {
                await User.updateOne({ publicKey }, { $pull: { wishlistedGames: gameId } });
                res.status(201).send({ message: "Game removed from wishlist" });
                logger.info("Game " + gameId + " removed from wishlist user" + publicKey + ".");
            } else {
                await User.updateOne({ publicKey }, { $addToSet: { wishlistedGames: gameId } });
                res.status(202).send({ message: "Game added to wishlist" });
                logger.info("Game " + gameId + " added to wishlist user" + publicKey + ".");
            }
        } else {
            if (MINA_ADDRESS_REGEX.test(publicKey)) {
                await User.create({ publicKey, wishlistedGames: [gameId] });
                res.status(201).send({ message: "Game added to wishlist" });
                logger.info("Game " + gameId + " added to wishlist user" + publicKey + ".");
            } else {
                res.status(405).send({ message: "Invalid public key" });
            }
        }
    } catch (err) {
        console.error(err);
        res.status(501).send({ message: "Error when adding game to wishlist" });
    }
});

app.get("/wishlist/:publicKey", async (req, res) => {
    const { publicKey } = req.params;

    try {
        const user = await User.findOne({ publicKey });
        logger.info("Wishlist Sended user" + publicKey + ".");
        res.json(user ? user.wishlistedGames : []);
    } catch (err) {
        console.error(err);
        res.status(502).send({ message: "Error retrieving wishlist" });
    }
});

app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});

// import express, { Express, Request, Response } from "express";
// import { client } from "chain";
// import { PrivateKey, UInt64 } from "o1js";
// import { TokenId, Balance, BalancesKey } from "@proto-kit/library";

// const server = express();
// const serverKey = PrivateKey.random();
// const serverPubKey = serverKey.toPublicKey();
// await client.start();

// server.get("/", async (req, res) => {
//     res.send("Hello World!");
// });

// server.get("/add", async (req, res) => {
//     const balances = client.runtime.resolve("Balances");
//     const tx = await client.transaction(serverPubKey, () => {
//         balances.addBalance(TokenId.from(0), serverPubKey, Balance.from(1000));
//     });
//     tx.transaction = tx.transaction?.sign(serverKey);
//     await tx.send();
//     res.send("done");
// });
// server.get("/getBalance", async (req, res) => {
//     const key = new BalancesKey({
//         tokenId: TokenId.from(0),
//         address: serverPubKey,
//     });
//     const balance = await client.query.runtime.Balances.balances.get(key);
//     res.send("Balance: " + balance);
// });

// server.listen(3000, () => {
//     console.log("Server is running on http://localhost:3000");
// });

// app.get("/device-tree-leaf/:key", async (req, res) => {
//     const { key } = req.params;
//     const leaf = deviceTree?.get(Field(key));
//     if (leaf) {
//         console.log("Device Tree Leaf Sended.");
//         res.json(leaf);
//     } else {
//         res.status(404).send({ message: "Leaf not found" });
//     }
// });

// app.get("/session-tree-leaf/:key", async (req, res) => {
//     const { key } = req.params;
//     const leaf = sessionTree?.get(Field(key));
//     if (leaf) {
//         console.log("Session Tree Leaf Sended.");
//         res.json(leaf);
//     } else {
//         res.status(404).send({ message: "Leaf not found" });
//     }
// });

// app.get("/device-tree-witness/:key", async (req, res) => {
//     const { key } = req.params;
//     const witness = deviceTree?.getWitness(Field(key));
//     if (witness) {
//         console.log("Device Tree Witness Sended.");
//         res.json(witness);
//     } else {
//         res.status(404).send({ message: "Witness not found" });
//     }
// });

// app.get("/session-tree-witness/:key", async (req, res) => {
//     const { key } = req.params;
//     const witness = sessionTree?.getWitness(Field(key));
//     if (witness) {
//         console.log("Session Tree Witness Sended.");
//         res.json(witness);
//     } else {
//         res.status(404).send({ message: "Witness not found" });
//     }
// });

// app.post("/device-tree-leaf", async (req, res) => {
//     const { key, value } = req.body;
//     deviceTree?.set(Field(key), Field(value));
//     // @ts-ignore
//     await saveTreeToMongo(deviceTree, "deviceTree");
//     console.log("Device Tree Leaf Set.");
//     res.status(201).send({ message: "Leaf set" });
// });

// app.post("/session-tree-leaf", async (req, res) => {
//     const { key, value } = req.body;
//     sessionTree?.set(Field(key), Field(value));
//     // @ts-ignore
//     await saveTreeToMongo(sessionTree, "sessionTree");
//     console.log("Session Tree Leaf Set.");
//     res.status(201).send({ message: "Leaf set" });
// });
