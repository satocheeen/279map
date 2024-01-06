import { PubSub } from "graphql-subscriptions";
import { Subscription, SubscriptionResolver, SubscriptionResolvers } from "./__generated__/types";
import { getLogger } from "log4js";

type PickSubscriptionArgs<T> = T extends SubscriptionResolver<any, any, any, any, infer TArgs> ? TArgs : any;
export type SubscriptionArgs<T extends keyof Subscription> = PickSubscriptionArgs<Required<SubscriptionResolvers>[T]>;

const logger = getLogger('api');
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
        logger.debug('subscribe', triggerName);
        return this.#pubsub.asyncIterator(triggerName);
    }

    publish<T extends keyof Subscription>(name: T, args: SubscriptionArgs<T>, payload: Subscription[T]) {
        const triggerName = getTriggerName(name, args)
        logger.debug('publish', triggerName, payload);
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
        const newObj = sortObject(args);
        return JSON.stringify(newObj);
    }
    return ''
}

// https://gist.github.com/ninapavlich/1697bcc107052f5b884a794d307845fe
function sortObject(object: any) {
    //Thanks > http://whitfin.io/sorting-object-recursively-node-jsjavascript/
    if (!object) {
      return object;
    }
  
    const isArray = object instanceof Array;
    var sortedObj = {} as any;
    if (isArray) {
      sortedObj = object.map((item) => sortObject(item));
    } else {
      var keys = Object.keys(object);
      keys.sort(function(key1, key2) {
        (key1 = key1.toLowerCase()), (key2 = key2.toLowerCase());
        if (key1 < key2) return -1;
        if (key1 > key2) return 1;
        return 0;
      });
  
      for (let index in keys) {
        const key = keys[index];
        if (typeof object[key] == 'object') {
          sortedObj[key] = sortObject(object[key]);
        } else {
          sortedObj[key] = object[key];
        }
      }
    }
  
    return sortedObj;
  }