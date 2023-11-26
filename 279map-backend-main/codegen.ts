
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
            content: "import { DataId } from '279map-common'"
          }
        },
      ],
      config: {
        skipTypename: true,
        scalars: {
          DataId: 'DataId',
        },
      }
    }
  },
  verbose: true,
};

export default config;
