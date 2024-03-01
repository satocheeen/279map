
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
              "import { DataId, GeoProperties, GeocoderIdInfo, IconKey, DatasourceConfig } from '../../types-common/common-types'",
            ]
          }
        },
      ],
      config: {
        scalars: {
          DataId: 'DataId',
          DatasourceConfig: 'DatasourceConfig',
          Geometry: 'Geometry',
          IconKey: 'IconKey',
          GeoProperties: 'GeoProperties',
          GeocoderIdInfo: 'GeocoderIdInfo',
        },
      }
    },
  },
  verbose: true,
};

export default config;
