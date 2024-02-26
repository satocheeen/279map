
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "src/graphql/*.gql",
  generates: {
    "src/graphql/__generated__/types.ts": {
      plugins: [
        "typescript", "typescript-resolvers", 
        {
          add: {
            content: [
              "import { Geometry } from 'geojson'",
              "import { DataId, GeoProperties, GeocoderIdInfo, IconKey, DatasourceConfig } from '../../types-common/common-types'",
            ]
          }
        },
      ],
      config: {
        skipTypename: true,
        scalars: {
          DataId: 'DataId',
          Geometry: 'Geometry',
          IconKey: 'IconKey',
          GeoProperties: 'GeoProperties',
          GeocoderIdInfo: 'GeocoderIdInfo',
        },
      }
    }
  },
  verbose: true,
};

export default config;
