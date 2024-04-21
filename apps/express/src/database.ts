import { Field, MerkleMap } from "o1js";

const games = [
    {
        id: 1,
        name: "Barbarian",
        description:
            "Barbarian is a single-player action-adventure game where you play as a barbarian warrior.",
        creator: "Eren Kardas",
        cover: "images/barbarian.webp",
        price: 20,
        discount: 5,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 2,
        name: "Car Race",
        description:
            "Car Race is a fast-paced racing game where you compete against other players in various tracks.",
        creator: "Hokus Pokus Games",
        cover: "images/car-race.webp",
        price: 10,
        discount: 0,
        rating: 3.5,
        releaseDate: "2021-09-15",
        tags: ["Racing", "Sports"],
    },
    {
        id: 3,
        name: "Cyberpunk",
        description:
            "Cyberpunk is a futuristic open-world game where you navigate a dystopian city and uncover its secrets.",
        creator: "Cyborg Games",
        cover: "images/cyberpunk.webp",
        price: 60,
        discount: 20,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 4,
        name: "Doll House",
        description:
            "Doll House is a horror game where you explore a haunted dollhouse and solve puzzles to uncover its mysteries.",
        creator: "Ponchik Games",
        cover: "images/doll-house.webp",
        price: 30,
        discount: 10,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 5,
        name: "Medieval",
        description:
            "Medieval is a medieval-themed strategy game where you build and manage your own kingdom.",
        creator: "duldul osman",
        cover: "images/medieval.webp",
        price: 40,
        discount: 0,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 6,
        name: "Soul Hunting",
        description:
            "Soul Hunting is an action RPG where you hunt down powerful creatures to collect their souls and gain new abilities.",
        creator: "Soul Games",
        cover: "images/soul-hunting.webp",
        price: 50,
        discount: 30,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 7,
        name: "Super Plant",
        description:
            "Super Plant is a platformer game where you control a plant with special abilities to overcome obstacles and defeat enemies.",
        creator: "Super Games",
        cover: "images/super-plant.webp",
        price: 50,
        discount: 0,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 8,
        name: "Lost in Space",
        description:
            "Lost in Space is a sci-fi adventure game where you explore the vastness of space and encounter alien civilizations.",
        creator: "Space Games",
        cover: "images/lost-in-space.webp",
        price: 50,
        discount: 0,
        rating: 4.5,
        releaseDate: "2021-09-15",
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 9,
        name: "Murderer Chicken",
        description:
            "Murderer Chicken is a quirky puzzle game where you control a chicken on a mission to solve mysterious murders.",
        creator: "Chicken Wings",
        cover: "images/murderer-chicken.webp",
        price: 50,
        discount: 0,
        rating: 4.5,
        releaseDate: "2020-09-12",
        tags: ["Action", "Adventure", "RPG"],
    },
];

export interface Game {
    id: number;
    name: string;
    creator: string;
    cover: string;
    price: number;
    discount: number;
    rating: number;
    releaseDate: string;
    tags: string[];
}

class Database {
    games: Game[];
    merkleRoot: Field;
    merkleMap: MerkleMap;

    constructor() {
        this.games = games;
        this.merkleMap = new MerkleMap();
        this.merkleRoot = this.merkleMap.getRoot();
    }
}

export default Database;
