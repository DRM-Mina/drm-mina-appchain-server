import { MerkleMap } from "./lib/merkleMap.js";
import { Field, Poseidon, PrivateKey } from "o1js";
import { MerkleTree } from "./lib/merkleTree.js";
import { Game, TreeModel, User } from "./schemas.js";

export const MINA_ADDRESS_REGEX = /^B62q[1-9A-HJ-NP-Za-km-z]{51}$/;

export async function saveTreeToMongo(map: MerkleMap, name: string) {
    const treeJson = map.tree.toJSON() as {
        height: number;
        nodes: { [key: string]: string };
        name?: string;
    };
    treeJson.name = name;

    await TreeModel.replaceOne({ name: name }, treeJson, { upsert: true });
}

export async function getTreeFromMongo(name: string): Promise<MerkleMap | null> {
    const tree = await TreeModel.findOne({ name: name });
    if (tree) {
        const treeObject = tree.toObject();
        // @ts-ignore
        delete treeObject._id;
        delete treeObject.name;
        const treeJson = treeObject as {
            height: number;
            nodes: { [key: string]: string };
        };
        const map = new MerkleMap();
        map.tree = MerkleTree.fromJSON(treeJson);

        return map;
    } else {
        console.log("No tree found with that name: ", name);
        return null;
    }
}
