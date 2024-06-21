import mongoose from "mongoose";

const Schema = mongoose.Schema;

const gameSchema = new mongoose.Schema(
    {
        gameId: { type: Number, index: true },
        name: String,
        description: String,
        creator: String,
        imageFolder: String,
        imageCount: Number,
        tags: [String],
        downloadable: Boolean,
    },
    { versionKey: false }
);

const UserSchema = new Schema(
    {
        publicKey: {
            type: String,
            unique: true,
            required: true,
        },
        wishlistedGames: [Number],
        slots: {
            type: Map,
            of: {
                slotNames: {
                    type: [String],
                    default: ["Slot 1", "Slot 2", "Slot 3", "Slot 4"],
                },
                slots: {
                    type: [String],
                    default: ["", "", "", ""],
                },
            },
            default: () => ({}),
        },
    },
    { versionKey: false }
);

export const User = mongoose.model("User", UserSchema);
export const Game = mongoose.model("Game", gameSchema);
