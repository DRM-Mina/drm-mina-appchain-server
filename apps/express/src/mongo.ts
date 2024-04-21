import { MongoClient, ServerApiVersion } from "mongodb";

const uri =
    "mongodb+srv://kadircanbozkurt1905:wD2xRbwxDKjnUFlz@drmina.tirlqbn.mongodb.net/?retryWrites=true&w=majority&appName=DRMina";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function connectToMongo() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch {
        console.log("Error");
    }
}

await connectToMongo().catch(console.dir);
