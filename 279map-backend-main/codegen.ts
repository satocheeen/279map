
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
              "import { GeoProperties } from '../../types-common/common-types'",
            ]
          }
        },
      ],
      config: {
        skipTypename: true,
        scalars: {
          Geometry: 'Geometry',
          GeoProperties: 'GeoProperties',
        },
      }
    }
  },
  verbose: true,
};

export default config;
