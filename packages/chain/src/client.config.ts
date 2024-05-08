import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules);

appChain.configurePartial({
    Runtime: runtime.config,
    GraphqlClient: {
        url: "https://drmmina_chain.kadircan.org/graphql",
    },
});

export const client = appChain;
