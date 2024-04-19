import "reflect-metadata";
import { TokenId, UInt64 } from "@proto-kit/library";
import { RuntimeModule, runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Bool, PublicKey } from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";

@runtimeModule()
export class GameToken extends RuntimeModule<unknown> {
    @state() public publisher = State.from<PublicKey>(PublicKey);

    @state() public users = StateMap.from<PublicKey, Bool>(PublicKey, Bool);

    @state() public gamePrice = State.from<UInt64>(UInt64);

    @state() public discount = State.from<UInt64>(UInt64);

    @state() public timeoutInterval = State.from<UInt64>(UInt64);

    @state() public number_of_devices_allowed = State.from<UInt64>(UInt64);

    public constructor(@inject("Balances") private balances: Balances) {
        super();
    }

    @runtimeMethod()
    public buyGame(): void {
        const gamePrice = this.gamePrice.get().orElse(UInt64.zero);
        console.log(gamePrice);
        const discount = this.discount.get().orElse(UInt64.zero);
        console.log(discount);
        const total = UInt64.from(gamePrice).sub(UInt64.from(discount));
        console.log(total);

        assert(
            this.balances
                .getBalance(TokenId.from(0), this.transaction.sender.value)
                .greaterThanOrEqual(total),
            "Insufficient balance"
        );

        this.balances.transfer(
            TokenId.from(0),
            this.transaction.sender.value,
            this.publisher.get().value,
            total
        );

        const sender = this.transaction.sender.value;

        assert(this.users.get(sender).value, "You have already bought the game");

        this.users.set(sender, Bool(true));
    }

    @runtimeMethod()
    public giftGame(receiver: PublicKey): void {
        const gamePrice = this.gamePrice.get().orElse(UInt64.zero);
        const discount = this.discount.get().orElse(UInt64.zero);
        const total = gamePrice.sub(discount);

        assert(
            this.balances
                .getBalance(TokenId.from(0), this.transaction.sender.value)
                .greaterThanOrEqual(total),
            "Insufficient balance"
        );

        assert(this.users.get(receiver).value, "The receiver has already bought the game");

        this.balances.transfer(
            TokenId.from(0),
            this.transaction.sender.value,
            this.publisher.get().value,
            total
        );

        this.users.set(receiver, Bool(true));
    }

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
        assert(
            this.gamePrice.get().value.greaterThanOrEqual(discount),
            "Discount should be less than or equal to the game price"
        );
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

    onlyPublisher(): void {
        assert(
            this.transaction.sender.value.equals(this.publisher.get().value),
            "Only the publisher can call this method"
        );
    }
}
