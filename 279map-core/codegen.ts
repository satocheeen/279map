
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost/graphql-schema",
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
