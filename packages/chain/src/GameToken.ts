import { UInt64 } from "@proto-kit/library";
import { RuntimeModule, runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Bool, PublicKey } from "o1js";

@runtimeModule()
export class GameToken extends RuntimeModule<{}> {
    @state() public publisher = State.from<PublicKey>(PublicKey);

    @state() public users = StateMap.from<PublicKey, Bool>(PublicKey, Bool);

    @state() public gamePrice = State.from<UInt64>(UInt64);

    @state() public discount = State.from<UInt64>(UInt64);

    @state() public timeoutInterval = State.from<UInt64>(UInt64);

    @state() public number_of_devices_allowed = State.from<UInt64>(UInt64);

    @runtimeMethod()
    public buyGame(address: PublicKey): void {
        const gamePrice = this.gamePrice.get();
        const discount = this.discount.get();
        const total = gamePrice.value.sub(discount.value);

        // Add buy logic here

        this.users.set(address, Bool(true));
    }

    // TODO add sender check for publisher

    /**
     * Set the price of the game.
     * Only the publisher can call this method.
     * @param price Price of the game in nanoMina.
     */
    @runtimeMethod()
    public setGamePrice(price: UInt64): void {
        this.gamePrice.set(price);
    }

    /**
     * Set the discount amount for the game.
     * Only the publisher can call this method.
     * @param discount Discount amount for the game in nanoMina.
     */
    @runtimeMethod()
    public setDiscount(discount: UInt64): void {
        this.discount.set(discount);
    }

    /**
     * Set the timeout interval for the proof to be valid.
     * Only the publisher can call this method.
     * @param interval Timeout interval for the proof to be valid.
     */
    @runtimeMethod()
    public setTimeoutInterval(interval: UInt64): void {
        this.timeoutInterval.set(interval);
    }

    /**
     * Set the number of devices allowed for the game.
     * Only the publisher can call this method.
     * @param number Number of devices allowed for the game.
     */
    @runtimeMethod()
    public setNumberOfDevicesAllowed(number: UInt64): void {
        assert(
            number.value.lessThanOrEqual(4),
            "Number of devices allowed should be less than or equal to 4"
        );
        this.number_of_devices_allowed.set(number);
    }
}
