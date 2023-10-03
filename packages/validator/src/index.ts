import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import type {GraphQLSchema} from 'graphql';
import {visit} from 'graphql';

import {generateSchemaAST} from './generateSchemaAST';
import type {ValidatorPluginConfig} from './pluginConfig';
import {YupSchemaBuilder} from './validator-builder/yup/YupSchemaBuilder';

export const plugin: PluginFunction<ValidatorPluginConfig> = (
  schema,
  documents,
  config
) => {
  const {graphqlSchema, ast} = generateSchemaAST({
    graphqlSchema: schema,
    config,
  });

  const visitor = getSchemaBuilder(graphqlSchema, config);
  const result = visit(ast, visitor);

  return {
    prepend: visitor.buildImports(),
    content: result.definitions
      .filter(definition => typeof definition === 'string')
      .join('\n'),
  };
};

const getSchemaBuilder = (
  graphqlSchema: GraphQLSchema,
  config: ValidatorPluginConfig
) => {
  const validator = config.validator ?? 'yup';

  switch (validator) {
    case 'yup':
      return new YupSchemaBuilder(graphqlSchema, config);
    case 'zod':
      throw new Error('Not implemented yet');
    default:
      throw new Error(`Unsupported validator: ${validator}`);
  }
};
