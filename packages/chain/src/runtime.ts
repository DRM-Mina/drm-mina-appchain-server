import { Balances } from "./balances";
import { ModulesConfig } from "@proto-kit/common";
import { GameToken } from "./GameToken";
import { DRM } from "./DRM";

export const modules = {
    Balances,
    GameToken,
    DRM,
};

export const config: ModulesConfig<typeof modules> = {
    Balances: {},
    GameToken: {},
    DRM: {},
};

export default {
    modules,
    config,
};
