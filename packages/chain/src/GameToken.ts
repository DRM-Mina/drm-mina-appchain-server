import "reflect-metadata";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { RuntimeModule, runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Bool, PublicKey } from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";

@runtimeModule()
export class GameToken extends RuntimeModule<{}> {
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
        const gamePrice = this.gamePrice.get().orElse(UInt64.from(10));
        const discount = this.discount.get().orElse(UInt64.from(5));
        const total = UInt64.from(gamePrice.value).sub(UInt64.from(discount.value));
        const sender = this.transaction.sender.value;
        const tokenId = TokenId.from(0);

        assert(
            this.balances.getBalance(tokenId, sender).greaterThanOrEqual(total),
            "Insufficient balance"
        );
        const publisher = this.publisher
            .get()
            .orElse(
                PublicKey.fromBase58("B62qmTxTUE4xbiUC1EtEHVxDFP7KZ6mJbj8VKRSsYDK2m8WBvKy1PvG")
            );

        this.balances.transfer(tokenId, sender, publisher, Balance.from(total));

        assert(
            this.users.get(sender).value.equals(Bool(false)),
            "You have already bought the game"
        );

        this.users.set(sender, Bool(true));
    }

    @runtimeMethod()
    public giftGame(receiver: PublicKey): void {
        const gamePrice = this.gamePrice.get().orElse(UInt64.from(10));
        const discount = this.discount.get().orElse(UInt64.from(5));
        const total = UInt64.from(gamePrice.value).sub(UInt64.from(discount.value));
        const sender = this.transaction.sender.value;
        const tokenId = TokenId.from(0);

        assert(
            this.balances.getBalance(tokenId, sender).greaterThanOrEqual(total),
            "Insufficient balance"
        );
        const publisher = this.publisher
            .get()
            .orElse(
                PublicKey.fromBase58("B62qmTxTUE4xbiUC1EtEHVxDFP7KZ6mJbj8VKRSsYDK2m8WBvKy1PvG")
            );

        this.balances.transfer(tokenId, sender, publisher, Balance.from(total));
        assert(
            this.users.get(receiver).value.equals(Bool(false)),
            "The receiver has already bought the game"
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
        this.onlyPublisher();
        this.gamePrice.set(price);
    }

    /**
     * Set the discount amount for the game.
     * Only the publisher can call this method.
     * @param discount Discount amount for the game in nanoMina.
     */
    @runtimeMethod()
    public setDiscount(discount: UInt64): void {
        this.onlyPublisher();
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
        this.onlyPublisher();
        this.timeoutInterval.set(interval);
    }

    /**
     * Set the number of devices allowed for the game.
     * Only the publisher can call this method.
     * @param number Number of devices allowed for the game.
     */
    @runtimeMethod()
    public setNumberOfDevicesAllowed(number: UInt64): void {
        this.onlyPublisher();
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
