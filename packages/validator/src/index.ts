import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import type {GraphQLSchema} from 'graphql';
import {visit} from 'graphql';

import type {ValidatorPluginConfig} from './config';
import {generateSchemaAST} from './generateSchemaAST';
import {YupSchemaValidator} from './schema-validators/yup/YupSchemaValidator';

export const plugin: PluginFunction<ValidatorPluginConfig> = (
  schema,
  documents,
  config
) => {
  const {graphqlSchema, ast} = generateSchemaAST({
    graphqlSchema: schema,
    config,
  });

  const visitor = getSchemaVisitor(graphqlSchema, config);
  const result = visit(ast, visitor);

  return {
    prepend: visitor.buildImports(),
    content: result.definitions
      .filter(definition => typeof definition === 'string')
      .join('\n'),
  };
};

const getSchemaVisitor = (
  graphqlSchema: GraphQLSchema,
  config: ValidatorPluginConfig
) => {
  const validator = config.validator ?? 'yup';

  switch (validator) {
    case 'yup':
      return new YupSchemaValidator(graphqlSchema, config);
    default:
      throw new Error(`Unsupported validator: ${validator}`);
  }
};
