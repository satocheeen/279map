import { PubSub } from "graphql-subscriptions";
import { MapKind, Subscription, SubscriptionResolver, SubscriptionResolvers } from "./__generated__/types";

type PickSubscriptionArgs<T> = T extends SubscriptionResolver<any, any, any, any, infer TArgs> ? TArgs : any;
export type SubscriptionArgs<T extends keyof Subscription> = PickSubscriptionArgs<Required<SubscriptionResolvers>[T]>;

export default class MyPubSub {
    #pubsub: PubSub;

    constructor() {
        this.#pubsub = new PubSub();
    }

    /**
     * 指定の地図（種別指定なし）に対するsubscription用iteratorを生成して返す
     * @param name 
     * @param targetMap 
     * @returns 
     */
    asyncIteratorOfMap<T extends keyof Subscription>(name: T, mapId: string) {
        const triggerName = getTriggerName(name, { mapId });
        return this.#pubsub.asyncIterator(triggerName);
    }

    /**
     * 指定の地図（種別指定あり）に対するsubscription用iteratorを生成して返す
     * @param name 
     * @param targetMap 
     * @returns 
     */
    asyncIteratorOfTheMapKind<T extends keyof Subscription>(name: T, targetMap: { mapId: string, mapKind: MapKind }) {
        const triggerName = getTriggerName(name, targetMap);
        return this.#pubsub.asyncIterator(triggerName);
    }

    asyncIterator<T extends keyof Subscription>(name: T) {
        return this.#pubsub.asyncIterator(name);
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