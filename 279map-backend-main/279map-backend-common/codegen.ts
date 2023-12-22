
import type { CodegenConfig } from '@graphql-codegen/cli';

// 279map-backend-main配下のtypes.tsを元に必要な型を生成する
const config: CodegenConfig = {
  overwrite: true,
  schema: "../src/graphql/types.gql",
  generates: {
    "src/graphql/__generated__/types.ts": {
      plugins: [
        "typescript", 
        {
          add: {
            content: [
              "import { DataId } from '279map-common'",
            ]
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
  }
};

export default config;
