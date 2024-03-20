
import type { CodegenConfig } from '@graphql-codegen/cli';

// 279map-backend-main配下のtypes.tsを元に必要な型を生成する
const config: CodegenConfig = {
  overwrite: true,
  schema: "../src/graphql/types.gql",
  generates: {
    "src/graphql/__generated__/types.ts": {
      plugins: [
        "typescript", 
        {
          add: {
            content: [
              "import { Geometry } from 'geojson'",
              "import { DataId, GeoProperties, GeocoderIdInfo, IconKey, ItemDatasourceConfig, ContentDatasourceConfig, ContentValueMap } from '../../types-common/common-types'",
            ]
          }
        },
      ],
      config: {
        skipTypename: true,
        scalars: {
          DataId: 'DataId',
          ItemDatasourceConfig: 'ItemDatasourceConfig',
          ContentDatasourceConfig: 'ContentDatasourceConfig',
          Geometry: 'Geometry',
          IconKey: 'IconKey',
          GeoProperties: 'GeoProperties',
          GeocoderIdInfo: 'GeocoderIdInfo',
          ContentValueMap: 'ContentValueMap',
        },
      }
    }
  }
};

export default config;
