export declare type BroadcastItemParam = {
    mapId: string;
    operation: 'insert' | 'update' | 'delete';
    itemIdList: string[];
};
export declare function callBroadcast(param: BroadcastItemParam): Promise<any>;
