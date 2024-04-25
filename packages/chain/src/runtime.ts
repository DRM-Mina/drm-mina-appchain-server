import { Balances } from "./modules/balances";
import { ModulesConfig } from "@proto-kit/common";
import { GameToken } from "./modules/GameToken";
import { DRM } from "./modules/DRM";

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
