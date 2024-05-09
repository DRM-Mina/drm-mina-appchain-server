import mongoose from "mongoose";
import Database from "./database.js";
import { Game } from "./schemas.js";
import dotenv from "dotenv";
dotenv.config();

const db = new Database();
//@ts-ignore
mongoose.connect(process.env.MONGO);
const mongoDb = mongoose.connection;
mongoDb.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoDb.once("open", function () {
    console.log("Connected successfully to MongoDB Atlas!");
});

async function insertOrUpdateGames() {
    try {
        for (const game of db.games) {
            await Game.updateOne({ gameId: game.id }, { $set: game }, { upsert: true });
        }
        console.log("Games have been successfully added or updated in the database");
        return;
    } catch (error) {
        console.error("Error inserting or updating games in the database:", error);
    }
}

await insertOrUpdateGames();
