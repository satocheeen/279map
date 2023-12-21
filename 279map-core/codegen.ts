
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
              "import { DataId, GeocoderId } from '279map-common'",
              "import { Geometry } from 'geojson'",
            ]
          }
        },
      ],
      config: {
        scalars: {
          DataId: 'DataId',
          Geometry: 'Geometry',
        },
      }
    },
  },
  verbose: true,
};

export default config;
