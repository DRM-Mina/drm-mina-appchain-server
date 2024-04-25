import mongoose from "mongoose";
import Database from "./database.js";
import { Game, TreeModel } from "./schemas.js";
import dotenv from "dotenv";
import { MerkleMap } from "./lib/merkleMap.js";
dotenv.config();

const db = new Database();
//@ts-ignore
mongoose.connect(
    "mongodb+srv://kadircanbozkurt1905:wD2xRbwxDKjnUFlz@drmina.tirlqbn.mongodb.net/?retryWrites=true&w=majority&appName=DRMina"
);
const mongoDb = mongoose.connection;
mongoDb.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoDb.once("open", function () {
    // we're connected!
    console.log("Connected successfully to MongoDB Atlas!");
});

async function insertOrUpdateGames() {
    try {
        for (const game of db.games) {
            await Game.updateOne({ gameId: game.id }, { $set: game }, { upsert: true });
        }
        console.log("Games have been successfully added or updated in the database");
    } catch (error) {
        console.error("Error inserting or updating games in the database:", error);
    }
}

async function initTrees() {
    const deviceTree = new MerkleMap();
    const deviceTreeJson = deviceTree.tree.toJSON() as {
        height: number;
        nodes: { [key: string]: string };
        name?: string;
    };
    deviceTreeJson.name = "deviceTree";

    await TreeModel.replaceOne({ name: "deviceTree" }, deviceTreeJson, { upsert: true });

    const sessionTree = new MerkleMap();
    const sessionTreeJson = sessionTree.tree.toJSON() as {
        height: number;
        nodes: { [key: string]: string };
        name?: string;
    };

    sessionTreeJson.name = "sessionTree";

    await TreeModel.replaceOne({ name: "sessionTree" }, sessionTreeJson, { upsert: true });
}

insertOrUpdateGames();
// initTrees();
