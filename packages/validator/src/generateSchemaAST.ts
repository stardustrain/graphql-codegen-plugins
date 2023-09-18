import {transformSchemaAST} from '@graphql-codegen/schema-ast';
import type {TypeScriptPluginConfig} from '@graphql-codegen/typescript';
import type {GraphQLSchema} from 'graphql';
import {buildSchema, printSchema} from 'graphql';

import {isGeneratedByIntrospection} from './utils/graphql';

type GenerateSchemaASTParams = {
  graphqlSchema: GraphQLSchema;
  config: TypeScriptPluginConfig;
};

export const generateSchemaAST = ({
  graphqlSchema,
  config,
}: GenerateSchemaASTParams) => {
  const {schema, ast} = transformSchemaAST(graphqlSchema, config);
  const _schema = isGeneratedByIntrospection(schema)
    ? buildSchema(printSchema(schema))
    : schema;

  return {
    graphqlSchema: _schema,
    ast,
  };
};
