import { MINA_ADDRESS_REGEX } from "./utils.js";
import { Game, User } from "./schemas.js";
import mongoose from "mongoose";
import logger from "./logger";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import serveStatic from "serve-static";
import { client } from "chain/dist/src/index.js";
import { JsonProof, PrivateKey, UInt64 } from "o1js";
import { DeviceSessionProof } from "chain/dist/src/index.js";

dotenv.config();

const senderKey = PrivateKey.random();
const sender = senderKey.toPublicKey();
let nonce = 0;

//@ts-ignore
mongoose.connect(process.env.MONGO);
const mongoDb = mongoose.connection;
mongoDb.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
});

mongoDb.once("open", function () {
    logger.info("Connected successfully to MongoDB");
});

(async () => {
    await client.start();
    console.log("Client started");
})();

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

app.post("/slot-names/:publicKey", async (req, res) => {
    const { publicKey } = req.params;
    const { gameId } = req.body;
    const { slotNames } = req.body;

    console.log(slotNames);

    const gameIdstr = String(gameId);

    if (slotNames) {
        try {
            const user = await User.findOne({ publicKey });
            if (user) {
                user.slots.set(gameIdstr, {
                    slots: user.slots.get(gameIdstr)?.slots || [],
                    slotNames: slotNames,
                });
                await user.save();
                res.status(201).send({ message: "Slots saved" });
                logger.info("Slots Saved user" + publicKey + ".");
            }
        } catch (err) {
            console.error(err);
            res.status(503).send({ message: "Error saving slots" });
        }
    } else {
        try {
            const user = await User.findOne({ publicKey });
            logger.info("Slots Sended user" + publicKey + ".");
            res.json(
                user && user.slots.get(gameIdstr)?.slotNames
                    ? user.slots.get(gameIdstr)?.slotNames
                    : ["Slot 1", "Slot 2", "Slot 3", "Slot 4"]
            );
            console.log(user!.slots.get(gameIdstr)?.slotNames);
        } catch (err) {
            console.error(err);
            res.status(504).send({ message: "Error retrieving slots" });
        }
    }
});

app.post("/submit-session", async (req, res) => {
    const { proof } = req.body;
    logger.info("Session received");

    try {
        const sessionProof = DeviceSessionProof.fromJSON(JSON.parse(proof) as JsonProof);
        const drm = client.runtime.resolve("DRM");
        const tx = await client.transaction(sender, () => {
            drm.createSession(sessionProof);
        });

        tx.transaction!.nonce = UInt64.from(nonce);
        tx.transaction = tx.transaction?.sign(senderKey);
        await tx.send();

        logger.info("Session submitted: " + sessionProof.publicOutput.newSessionKey.toString());

        nonce++;

        res.status(201).send({ message: "Session submitted" });
    } catch (err) {
        logger.error(err);
        res.status(505).send({ message: "Error submitting session" });
    }
});

app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});
