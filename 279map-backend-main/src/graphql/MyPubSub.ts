import { PubSub } from "graphql-subscriptions";
import { Subscription } from "./__generated__/types";

export default class MyPubSub {
    #pubsub: PubSub;

    constructor() {
        this.#pubsub = new PubSub();
    }

    asyncIterator<T1 extends keyof Subscription>(name: T1) {
        return this.#pubsub.asyncIterator(name);
    }

    publish<T1 extends keyof Subscription, T2 = Subscription[T1]>(name: T1, payload: T2) {
        this.#pubsub.publish(name, payload);
    }
}