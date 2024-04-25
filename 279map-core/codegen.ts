
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // schema: "http://localhost/graphql",
  schema: "../279map-backend-main/src/graphql/*.gql",
  documents: "src/**/*.{ts,tsx,graphql,gql}",
  generates: {
    "src/graphql/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false
      },
      plugins: [
        {
          add: {
            content: [
              "import { Geometry } from 'geojson'",
              "import { DataId, GeoProperties, GeocoderIdInfo, IconKey, ItemDatasourceConfig, ContentDatasourceConfig, ContentValueMap, MapKind, IconDefine } from '../../types-common/common-types'",
            ]
          }
        },
      ],
      config: {
        scalars: {
          DataId: 'DataId',
          ItemDatasourceConfig: 'ItemDatasourceConfig',
          ContentDatasourceConfig: 'ContentDatasourceConfig',
          Geometry: 'Geometry',
          IconKey: 'IconKey',
          GeoProperties: 'GeoProperties',
          GeocoderIdInfo: 'GeocoderIdInfo',
          ContentValueMap: 'ContentValueMap',
          IconDefine: 'IconDefine',
          MapKind: 'MapKind'
        },
      }
    },
  },
  verbose: true,
};

export default config;
