import { GraphQLScalarType } from "graphql";

export const DataIdScalarType = new GraphQLScalarType({
    name: 'DataId',
    description: 'id of items or contents',
    serialize(value: any) {
        return JSON.stringify(value);
    },
    parseValue(value: any) {
        return JSON.parse(value);
    },
})
