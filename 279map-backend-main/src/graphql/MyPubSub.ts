import { PubSub } from "graphql-subscriptions";
import { Subscription, SubscriptionResolver, SubscriptionResolvers } from "./__generated__/types";

type PickSubscriptionArgs<T> = T extends SubscriptionResolver<any, any, any, any, infer TArgs> ? TArgs : any;
type SubscriptionArgs<T extends keyof Subscription> = PickSubscriptionArgs<Required<SubscriptionResolvers>[T]>;

export default class MyPubSub {
    #pubsub: PubSub;

    constructor() {
        this.#pubsub = new PubSub();
    }

    asyncIterator<T extends keyof Subscription>(name: T, args: SubscriptionArgs<T>) {
        const triggerName = getTriggerName(name, args)
        return this.#pubsub.asyncIterator(triggerName);
    }

    publish<T extends keyof Subscription>(name: T, args: SubscriptionArgs<T>, payload: Subscription[T]) {
        const triggerName = getTriggerName(name, args)
        this.#pubsub.publish(triggerName, payload);
    }
}

function getTriggerName(name: string, args: any) {
    const argsStr = serializeArgs(args)
    return `${name}_${argsStr}`;
}

function serializeArgs(args: any) {
    if (typeof args === 'string') {
        return args;
    }
    if (typeof args === 'number') {
        return args + '';
    }
    if (typeof args === 'object') {
        // sort key
        const keys = Object.keys(args).sort();
        const newObj = {} as any;
        keys.forEach(key => {
            newObj[key] = args[key];
        });
        return JSON.stringify(newObj);
    }
    return ''
}