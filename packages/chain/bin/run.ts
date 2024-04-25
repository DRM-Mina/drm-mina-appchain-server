#!/usr/bin/env node --experimental-specifier-resolution=node --experimental-vm-modules --experimental-wasm-modules --experimental-wasm-threads

import { ManualBlockTrigger } from "@proto-kit/sequencer";
import appChain from "../src/chain.config";
import { exit } from "process";

await appChain.start();
const trigger = appChain.sequencer.resolveOrFail("BlockTrigger", ManualBlockTrigger);
let counter = 0;
setInterval(async () => {
    console.log("Block: ", counter++);
    try {
        await trigger.produceUnproven();
    } catch (e) {
        console.error("Run err", e);
    }
}, 10000);
