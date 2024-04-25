import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { State } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";

@runtimeModule()
export class Balances extends BaseBalances<{}> {
    @state() public totalCirculation = State.from<Balance>(Balance);

    @runtimeMethod()
    public addBalance(tokenId: TokenId, address: PublicKey, amount: Balance): void {
        const newTotalCirculation = Balance.from(this.totalCirculation.get().value).add(amount);
        this.totalCirculation.set(newTotalCirculation);

        this.mint(tokenId, address, amount);
    }
}
