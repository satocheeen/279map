import { GraphQLScalarType, GraphQLInterfaceType } from "graphql";
import { DataId } from '279map-common';

export const DataIdScalarType = new GraphQLScalarType({
    name: 'DataId',
    description: 'id of items or contents',
    serialize(value: any) {
        return value;
    },
    parseValue(value: any) {
        if (typeof value === 'string') {
            return JSON.parse(value) as DataId;
        } else if (typeof value === 'object') {
            if ('dataSourceId' in value && 'id' in value) {
                return value;
            }
        }
        throw 'parse error';
    },
    parseLiteral(value) {
        console.log('parse literal', value)
        return value;
    }
})
