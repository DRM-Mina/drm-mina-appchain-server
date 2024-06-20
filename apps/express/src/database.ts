const games = [
    {
        id: 1,
        name: "Warrior: The Diamond Forest",
        description:
            "Embark on an epic adventure in 'Warrior: The Diamond Forest,' a thrilling pixelated action game that takes you deep into the heart of a mysterious and dark forest. You play as a brave warrior equipped with a sharp blade and a sturdy shield, facing off against menacing creatures that lurk in the shadows.",
        creator: "Eren Kardas",
        imageFolder: "diamond",
        imageCount: 3,
        tags: ["Action", "Adventure", "Survival"],
    },
    {
        id: 2,
        name: "KindaSus",
        description:
            "As the captain of this high-tech spaceship, your mission is to navigate through the cosmos, using your ship's mechanical arms to grab and collect the floating imposters. Each character you collect brings you closer to completing your mission, but be prepared for challenges along the way.",
        creator: "Shap Shup Games",
        imageFolder: "kindasus",
        imageCount: 3,
        tags: ["Simulation", "Puzzle"],
    },
    {
        id: 3,
        name: "Barbarian",
        description:
            "Barbarian is a single-player action-adventure game where you play as a barbarian warrior.",
        creator: "Eren Kardas",
        imageFolder: "barbarian",
        imageCount: 0,
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 4,
        name: "Car Race",
        description:
            "Car Race is a fast-paced racing game where you compete against other players in various tracks.",
        creator: "Hokus Pokus Games",
        imageFolder: "car-race",
        imageCount: 0,
        tags: ["Racing", "Sports"],
    },
    {
        id: 5,
        name: "Cyberpunk",
        description:
            "Cyberpunk is a futuristic open-world game where you navigate a dystopian city and unimageFolder its secrets.",
        creator: "Cyborg Games",
        imageFolder: "cyberpunk",
        imageCount: 0,
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 6,
        name: "Medieval",
        description:
            "Medieval is a medieval-themed strategy game where you build and manage your own kingdom.",
        creator: "duldul osman",
        imageFolder: "medieval",
        imageCount: 0,
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 7,
        name: "Soul Hunting",
        description:
            "Soul Hunting is an action RPG where you hunt down powerful creatures to collect their souls and gain new abilities.",
        creator: "Soul Games",
        imageFolder: "soul-hunting",
        imageCount: 0,
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 8,
        name: "Lost in Space",
        description:
            "Lost in Space is a sci-fi adventure game where you explore the vastness of space and encounter alien civilizations.",
        creator: "Space Games",
        imageFolder: "lost-in-space",
        imageCount: 0,
        tags: ["Action", "Adventure", "RPG"],
    },
    {
        id: 9,
        name: "Murderer Chicken",
        description:
            "Murderer Chicken is a quirky puzzle game where you control a chicken on a mission to solve mysterious murders.",
        creator: "Chicken Wings",
        imageFolder: "murderer-chicken",
        imageCount: 0,
        tags: ["Action", "Adventure", "RPG"],
    },
];

export interface Game {
    id: number;
    name: string;
    creator: string;
    imageFolder: string;
    imageCount: number;
    tags: string[];
}

class Database {
    games: Game[];
    constructor() {
        this.games = games;
    }
}

export default Database;
