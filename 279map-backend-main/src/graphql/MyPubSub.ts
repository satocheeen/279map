import { PubSub } from "graphql-subscriptions";
import { Subscription, SubscriptionResolver, SubscriptionResolvers } from "./__generated__/types";

type PickSubscriptionArgs<T> = T extends SubscriptionResolver<any, any, any, any, infer TArgs> ? TArgs : any;
export type SubscriptionArgs<T extends keyof Subscription> = PickSubscriptionArgs<Required<SubscriptionResolvers>[T]>;

export default class MyPubSub {
    #pubsub: PubSub;

    constructor() {
        this.#pubsub = new PubSub();
    }

    /**
     * subscription用iteratorを生成して返す
     * @param name 
     * @param args
     * @returns 
     */
    asyncIterator<T extends keyof Subscription>(name: T, args: SubscriptionArgs<T>) {
        const triggerName = getTriggerName(name, args);
        return this.#pubsub.asyncIterator(triggerName);
    }

    publish<T extends keyof Subscription>(name: T, args: SubscriptionArgs<T>, payload: Subscription[T]) {
        const triggerName = getTriggerName(name, args)
        console.log('publish', triggerName);
        this.#pubsub.publish(triggerName, payload);
    }
}

function getTriggerName(name: string, args: any) {
    const argsStr = serializeArgs(args)
    if (argsStr.length === 0) return name;
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
        if (keys.length === 0) return '';
        const newObj = {} as any;
        keys.forEach(key => {
            newObj[key] = args[key];
        });
        return JSON.stringify(newObj);
    }
    return ''
}