import { MINA_ADDRESS_REGEX } from "./utils.js";
import { Game, User } from "./schemas.js";
import mongoose from "mongoose";
import logger from "./logger";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import serveStatic from "serve-static";
import { client } from "drm-mina-chain/dist/src/index.js";
import { JsonProof, PrivateKey, UInt64 } from "o1js";
import { DeviceSessionProof } from "drm-mina-chain/dist/src/index.js";
import AWS from "aws-sdk";

dotenv.config();

const senderKey = PrivateKey.random();
const sender = senderKey.toPublicKey();
let nonce = 0;

const s3 = new AWS.S3({
    // @ts-ignore
    endpoint: new AWS.Endpoint(process.env.CF_ENDPOINT),
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
    signatureVersion: "v4",
});

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
    try {
        const games = await Game.find({});
        logger.info("Game Data Sended.");
        res.json(games);
    } catch (err) {
        logger.error(err);
        res.status(500).send({ message: "Error retrieving game data" });
    }
});

app.post("/wishlist/:publicKey", async (req, res) => {
    const { publicKey } = req.params;
    const { gameId } = req.body;

    if (!gameId) {
        res.status(400).send({ message: "Game ID not provided" });
        return;
    }

    if (!publicKey) {
        res.status(400).send({ message: "Public key not provided" });
        return;
    }

    if (!MINA_ADDRESS_REGEX.test(publicKey)) {
        res.status(400).send({ message: "Invalid public key" });
        return;
    }

    try {
        const user = await User.findOne({ publicKey });

        if (user) {
            if (user.wishlistedGames.includes(gameId)) {
                await User.updateOne({ publicKey }, { $pull: { wishlistedGames: gameId } });
                res.status(200).send({ message: "Game removed from wishlist" });
                logger.info("Game " + gameId + " removed from wishlist user" + publicKey + ".");
            } else {
                await User.updateOne({ publicKey }, { $addToSet: { wishlistedGames: gameId } });
                res.status(200).send({ message: "Game added to wishlist" });
                logger.info("Game " + gameId + " added to wishlist user" + publicKey + ".");
            }
        } else {
            await User.create({ publicKey, wishlistedGames: [gameId] });
            logger.info("User " + publicKey + " created.");
            res.status(200).send({ message: "Game added to wishlist" });
            logger.info("Game " + gameId + " added to wishlist user" + publicKey + ".");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error when adding game to wishlist" });
    }
});

app.get("/wishlist/:publicKey", async (req, res) => {
    const { publicKey } = req.params;

    if (!publicKey) {
        res.status(400).send({ message: "Public key not provided" });
        return;
    }

    if (!MINA_ADDRESS_REGEX.test(publicKey)) {
        res.status(400).send({ message: "Invalid public key" });
        return;
    }

    try {
        const user = await User.findOne({ publicKey });
        logger.info("Wishlist Sended user" + publicKey + ".");
        res.json(user ? user.wishlistedGames : []);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error retrieving wishlist" });
    }
});

app.post("/slot-names/:publicKey", async (req, res) => {
    const { publicKey } = req.params;
    const { gameId } = req.body;
    const { slotNames } = req.body;

    if (!gameId) {
        res.status(400).send({ message: "Game ID not provided" });
        return;
    }

    const gameIdNumber = Number(gameId);
    if (isNaN(gameIdNumber)) {
        res.status(400).send({ message: "Game ID must be a number" });
        return;
    }

    if (gameIdNumber < 0 || gameIdNumber > 30) {
        res.status(400).send({ message: "Invalid game ID" });
        return;
    }

    if (!publicKey) {
        res.status(400).send({ message: "Public key not provided" });
        return;
    }

    if (!MINA_ADDRESS_REGEX.test(publicKey)) {
        res.status(400).send({ message: "Invalid public key" });
        return;
    }

    const gameIdstr = String(gameIdNumber);

    if (slotNames) {
        if (!Array.isArray(slotNames)) {
            res.status(400).send({ message: "Slot names must be an array" });
            return;
        }

        if (slotNames.length > 4 || slotNames.length < 1) {
            res.status(400).send({ message: "Slot names must be between 1 and 4" });
            return;
        }

        if (slotNames.some((slotName) => typeof slotName !== "string")) {
            res.status(400).send({ message: "Slot names must be strings" });
            return;
        }

        try {
            const user = await User.findOne({ publicKey });
            if (user) {
                user.slots.set(gameIdstr, {
                    slots: user.slots.get(gameIdstr)?.slots || [],
                    slotNames: slotNames,
                });
                await user.save();
                res.status(200).send({ message: "Slots saved" });
                logger.info("Slots Saved user" + publicKey + ".");
            } else {
                res.status(404).send({ message: "User not found" });
                return;
            }
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Error saving slots" });
        }
    } else {
        try {
            const user = await User.findOne({ publicKey });
            if (user) {
                logger.info("Slots Sended user" + publicKey + ".");
                res.json(
                    user && user.slots.get(gameIdstr)?.slotNames
                        ? user.slots.get(gameIdstr)?.slotNames
                        : ["Slot 1", "Slot 2", "Slot 3", "Slot 4"]
                );
            } else {
                res.status(404).send({ message: "User not found" });
                return;
            }
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Error retrieving slots" });
        }
    }
});

app.post("/submit-session", async (req, res) => {
    const { proof } = req.body;

    if (!proof) {
        res.status(400).send({ message: "Proof not provided" });
        return;
    }

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

        res.status(200).send({ message: "Session submitted" });
    } catch (err) {
        logger.error(err);
        res.status(500).send({ message: "Error submitting session" });
    }
});

// TODO: Add limit rate
app.post("/get-signed-url", async (req, res) => {
    const { fileName } = req.body;

    if (!fileName) {
        res.status(400).send({ message: "File name not provided" });
        return;
    }

    try {
        const params = {
            Bucket: process.env.CF_BUCKET,
            Key: fileName,
            Expires: 600,
        };
        const url = s3.getSignedUrl("getObject", params);
        logger.info("Signed URL generated: " + url);
        res.status(201).send({ url });
    } catch (err) {
        logger.error(err);
        res.status(506).send({ message: "Error generating signed url" });
    }
});

app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});
