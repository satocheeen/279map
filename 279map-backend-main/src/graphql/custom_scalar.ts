import { GraphQLScalarType } from "graphql";
import { Geometry } from 'geojson';
import { DataId } from "./__generated__/types";
import { GeoProperties } from "../types-common/common-types";

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
    // parseLiteral(value) {
    //     return value;
    // }
})

export const GeoPropertiesScalarType = new GraphQLScalarType({
    name: 'Geometry',
    description: 'GeoProperti',
    serialize(value: any) {
        return value;
    },
    parseValue(value: any) {
        if (typeof value === 'string') {
            return JSON.parse(value) as GeoProperties;
        } else if (typeof value === 'object') {
            return value as GeoProperties;
        }
        throw 'parse error';
    },
    // parseLiteral(value) {
    //     return value;
    // }
})

export const JsonScalarType = new GraphQLScalarType({
    name: 'JSON',
    description: 'json',
    serialize(value: any) {
        return value;
    },
    parseValue(value: any) {
        if (typeof value === 'string') {
            return JSON.parse(value);
        } else if (typeof value === 'object') {
            return value;
        }
        throw 'parse error';
    },
    parseLiteral(value) {
        return value;
    }
})