
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
              "import { GeoProperties, GeocoderIdInfo, IconKey } from '../../types-common/common-types'",
            ]
          }
        },
      ],
      config: {
        scalars: {
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
