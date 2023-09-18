import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import type {GraphQLSchema} from 'graphql';

import type {ValidatorPluginConfig} from './config';
import {generateSchemaAST} from './generateSchemaAST';

export const plugin: PluginFunction<ValidatorPluginConfig> = (
  schema,
  documents,
  config
) => {
  const {graphqlSchema, ast} = generateSchemaAST({
    graphqlSchema: schema,
    config,
  });

  return 'test';
};

const getSchemaVisitor = (
  graphqlSchema: GraphQLSchema,
  config: ValidatorPluginConfig
) => {};
