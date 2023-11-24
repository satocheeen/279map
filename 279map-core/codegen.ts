
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // schema: "http://localhost/graphql",
  schema: "../279map-backend-main/src/graphql/*.gql",
  documents: "src/**/*.{ts,tsx,graphql,gql}",
  generates: {
    "src/graphql/generated/": {
      preset: "client",
      plugins: [
        {
          add: {
            content: "import { DataId } from '279map-common'"
          }
        },
      ],
      config: {
        scalars: {
          DataId: 'DataId',
        },
      }
    },
  },
  verbose: true,
};

export default config;
