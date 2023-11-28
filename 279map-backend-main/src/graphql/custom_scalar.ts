import { GraphQLScalarType, GraphQLInterfaceType } from "graphql";
import { DataId } from '279map-common';
import { Geometry } from 'geojson';

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
        return value;
    }
})

export const GeometryScalarType = new GraphQLScalarType({
    name: 'Geometry',
    description: 'GeoJSON Geometry',
    serialize(value: any) {
        return value;
    },
    parseValue(value: any) {
        if (typeof value === 'string') {
            return JSON.parse(value) as Geometry;
        } else if (typeof value === 'object') {
            return value as Geometry;
        }
        throw 'parse error';
    },
    parseLiteral(value) {
        return value;
    }
})