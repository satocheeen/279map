
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
            ]
          }
        },
      ],
      config: {
        skipTypename: true,
        scalars: {
          Geometry: 'Geometry',
        },
      }
    }
  },
  verbose: true,
};

export default config;
