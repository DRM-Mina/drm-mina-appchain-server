import mongoose from "mongoose";

const Schema = mongoose.Schema;

const gameSchema = new mongoose.Schema(
    {
        gameId: { type: Number, index: true },
        name: String,
        description: String,
        creator: String,
        cover: String,
        price: Number,
        discount: Number,
        rating: Number,
        releaseDate: String,
        tags: [String],
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

const TreeSchema = new Schema(
    {
        name: { type: String, unique: true },
        height: { type: Number, required: true },
        nodes: { type: Object, of: String },
    },
    { versionKey: false }
);

export const User = mongoose.model("User", UserSchema);
export const Game = mongoose.model("Game", gameSchema);
export const TreeModel = mongoose.model("Tree", TreeSchema);
