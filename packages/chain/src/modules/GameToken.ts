import "reflect-metadata";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { RuntimeModule, runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Bool, PublicKey, Struct } from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";

export class UserKey extends Struct({
    gameId: UInt64,
    address: PublicKey,
}) {
    public static from(gameId: UInt64, address: PublicKey) {
        return new UserKey({ gameId, address });
    }
}

@runtimeModule()
export class GameToken extends RuntimeModule<{}> {
    // Fee amount for creating a new game
    @state() public feeAmount = State.from<UInt64>(UInt64);

    // Receiver of the fee
    @state() public feeReceiver = State.from<PublicKey>(PublicKey);

    // Total number of games
    @state() public totalGameNumber = State.from<UInt64>(UInt64);

    // Mappping from game id to publisher of the game
    @state() public publisher = StateMap.from<UInt64, PublicKey>(UInt64, PublicKey);

    // Mapping from game id and user address to a does user own the game
    @state() public users = StateMap.from<UserKey, Bool>(UserKey, Bool);

    // Mapping from game id to price of the game
    @state() public gamePrice = StateMap.from<UInt64, UInt64>(UInt64, UInt64);

    // Mapping from game id to discount amount
    @state() public discount = StateMap.from<UInt64, UInt64>(UInt64, UInt64);

    // Mapping from game id to timeout interval in minutes
    @state() public timeoutInterval = StateMap.from<UInt64, UInt64>(UInt64, UInt64);

    // Mapping from game id to number of devices allowed
    @state() public number_of_devices_allowed = StateMap.from<UInt64, UInt64>(UInt64, UInt64);

    public constructor(@inject("Balances") private balances: Balances) {
        super();
    }

    /**
     * @param publisher public key of the publisher
     * @param price price of the game
     * @param discount discount amount for the game
     * @param timeoutInterval timeout interval for the new session to be valid in minutes
     * @param number_of_devices_allowed number of devices allowed for the game
     */
    @runtimeMethod()
    public createNewGame(
        publisher: PublicKey,
        price: UInt64,
        discount: UInt64,
        timeoutInterval: UInt64,
        number_of_devices_allowed: UInt64
    ): void {
        const sender = this.transaction.sender.value;
        const feeReceiver = this.feeReceiver.get().value;
        const tokenId = TokenId.from(0);

        assert(
            this.balances
                .getBalance(tokenId, sender)
                .greaterThanOrEqual(this.feeAmount.get().value),
            "Insufficient balance"
        );

        this.balances.transfer(
            tokenId,
            sender,
            feeReceiver,
            Balance.from(this.feeAmount.get().value)
        );

        assert(price.value.greaterThanOrEqual(0), "Price should be greater than or equal to 0");
        assert(
            price.value.greaterThanOrEqual(discount.value),
            "Discount should be less than or equal to the game price"
        );
        assert(
            timeoutInterval.value.greaterThanOrEqual(120),
            "Timeout interval should be greater than or equal to 120 minutes"
        );
        assert(
            number_of_devices_allowed.value.greaterThanOrEqual(1),
            "Number of devices allowed should be greater than or equal to 1"
        );
        assert(
            number_of_devices_allowed.value.lessThanOrEqual(4),
            "Number of devices allowed should be less than or equal to 4"
        );
        const totalGameNumber = this.totalGameNumber.get().orElse(UInt64.from(0));
        const gameId = UInt64.from(totalGameNumber.value.add(1));
        this.totalGameNumber.set(gameId);
        this.publisher.set(gameId, publisher);
        this.gamePrice.set(gameId, price);
        this.discount.set(gameId, discount);
        this.timeoutInterval.set(gameId, timeoutInterval);
        this.number_of_devices_allowed.set(gameId, number_of_devices_allowed);
    }

    /**
     * Buy a game with the given game id and transfer the price to the publisher
     * @param gameId game id
     */
    @runtimeMethod()
    public buyGame(gameId: UInt64): void {
        assert(
            gameId.value.lessThanOrEqual(this.totalGameNumber.get().value.value),
            "Game does not exist"
        );

        const gamePrice = this.gamePrice.get(UInt64.from(gameId)).orElse(UInt64.from(0));
        const discount = this.discount.get(UInt64.from(gameId)).orElse(UInt64.from(0));
        const total = UInt64.from(gamePrice.value).sub(UInt64.from(discount.value));
        const sender = this.transaction.sender.value;
        const tokenId = TokenId.from(0);

        assert(
            this.balances.getBalance(tokenId, sender).greaterThanOrEqual(total),
            "Insufficient balance"
        );
        const publisher = this.publisher
            .get(UInt64.from(gameId))
            .orElse(
                PublicKey.fromBase58("B62qmTxTUE4xbiUC1EtEHVxDFP7KZ6mJbj8VKRSsYDK2m8WBvKy1PvG")
            );

        this.balances.transfer(tokenId, sender, publisher, Balance.from(total));

        const userKey = UserKey.from(UInt64.from(gameId), sender);

        assert(
            this.users.get(userKey).value.equals(Bool(false)),
            "You have already bought the game"
        );

        this.users.set(userKey, Bool(true));
    }

    /**
     * Buy a game with the given game id and transfer the price to the publisher for the receiver
     * @param gameId game id
     * @param receiver public key of the receiver
     */
    @runtimeMethod()
    public giftGame(gameId: UInt64, receiver: PublicKey): void {
        assert(
            gameId.value.lessThanOrEqual(this.totalGameNumber.get().value.value),
            "Game does not exist"
        );
        const gamePrice = this.gamePrice.get(UInt64.from(gameId)).orElse(UInt64.from(10));
        const discount = this.discount.get(UInt64.from(gameId)).orElse(UInt64.from(5));
        const total = UInt64.from(gamePrice.value).sub(UInt64.from(discount.value));
        const sender = this.transaction.sender.value;
        const tokenId = TokenId.from(0);

        assert(
            this.balances.getBalance(tokenId, sender).greaterThanOrEqual(total),
            "Insufficient balance"
        );
        const publisher = this.publisher
            .get(UInt64.from(gameId))
            .orElse(
                PublicKey.fromBase58("B62qmTxTUE4xbiUC1EtEHVxDFP7KZ6mJbj8VKRSsYDK2m8WBvKy1PvG")
            );

        const userKey = UserKey.from(UInt64.from(gameId), receiver);

        this.balances.transfer(tokenId, sender, publisher, Balance.from(total));
        assert(
            this.users.get(userKey).value.equals(Bool(false)),
            "The receiver has already bought the game"
        );

        this.users.set(userKey, Bool(true));
    }

    /**
     * Set the fee receiver.
     * @param receiver Public key of the receiver.
     */
    @runtimeMethod()
    public setFeeAmount(amount: UInt64): void {
        assert(
            this.transaction.sender.value.equals(this.feeReceiver.get().value),
            "Only the feeReceiver can call this method"
        );
        this.feeAmount.set(UInt64.from(amount));
    }

    /**
     * Set the price of the game.
     * @param price Price of the game in nanoMina.
     */
    @runtimeMethod()
    public setGamePrice(gameId: UInt64, price: UInt64): void {
        this.onlyPublisher(gameId);
        this.gamePrice.set(UInt64.from(gameId), UInt64.from(price));
    }

    /**
     * Set the discount amount for the game.
     * @param discount Discount amount for the game in nanoMina.
     */
    @runtimeMethod()
    public setDiscount(gameId: UInt64, discount: UInt64): void {
        this.onlyPublisher(gameId);
        assert(
            this.gamePrice.get(UInt64.from(gameId)).value.greaterThanOrEqual(discount),
            "Discount should be less than or equal to the game price"
        );
        this.discount.set(UInt64.from(gameId), UInt64.from(discount));
    }

    /**
     * Set the timeout interval for the proof to be valid.
     * @param interval Timeout interval for the proof to be valid.
     */
    @runtimeMethod()
    public setTimeoutInterval(gameId: UInt64, interval: UInt64): void {
        this.onlyPublisher(gameId);
        this.timeoutInterval.set(UInt64.from(gameId), UInt64.from(interval));
    }

    /**
     * Set the number of devices allowed for the game.
     * @param number Number of devices allowed for the game.
     */
    @runtimeMethod()
    public setNumberOfDevicesAllowed(gameId: UInt64, number: UInt64): void {
        this.onlyPublisher(gameId);
        assert(
            number.value.lessThanOrEqual(4),
            "Number of devices allowed should be less than or equal to 4"
        );
        this.number_of_devices_allowed.set(UInt64.from(gameId), UInt64.from(number));
    }

    onlyPublisher(gameId: UInt64): void {
        assert(
            this.transaction.sender.value.equals(this.publisher.get(UInt64.from(gameId)).value),
            "Only the publisher can call this method"
        );
    }
}
