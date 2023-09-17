import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import {generateSchemaAST} from './generateSchemaAST';
import type {GraphQLSchema} from 'graphql';
import type {TypescriptPluginConfig} from '@graphql-codegen/typescript';

export const plugin: PluginFunction = (schema, documents, config) => {
  const {graphqlSchema, ast} = generateSchemaAST({
    graphqlSchema: schema,
    config,
  });

  return 'test';
};

const getSchemaVisitor = (
  graphqlSchema: GraphQLSchema,
  config: TypescriptPluginConfig
) => {};
