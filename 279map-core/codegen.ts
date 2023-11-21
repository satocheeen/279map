
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // schema: "http://localhost/graphql",
  schema: "../279map-backend-main/src/graphql/*.graphql",
  documents: "src/**/*.{ts,tsx,graphql}",
  generates: {
    "src/graphql/generated/": {
      preset: "client",
      plugins: []
    },
  },
  verbose: true,
};

export default config;
