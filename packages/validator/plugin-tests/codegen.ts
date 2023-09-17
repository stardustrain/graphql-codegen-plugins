import type {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './plugin-tests/schema.graphql',
  generates: {
    './plugin-tests/output.ts': {
      plugins: ['../../dist/index.js'],
    },
  },
};

export default config;
