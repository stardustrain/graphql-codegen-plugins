import type {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './plugin-tests/schema.graphql',
  generates: {
    './plugin-tests/output.ts': {
      plugins: ['../../dist/index.js'],
      config: {
        validator: 'yup',
        useTypeImports: true,
        importFrom: './types.ts',
        sort: true,
      },
    },
  },
};

export default config;
