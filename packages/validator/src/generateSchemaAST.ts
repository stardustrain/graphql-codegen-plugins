import type {GraphQLSchema} from 'graphql';
import {transformSchemaAST} from '@graphql-codegen/schema-ast';
import type {TypeScriptPluginConfig} from '@graphql-codegen/typescript';
import {isGeneratedByIntrospection} from './utils/graphql';
import {buildSchema, printSchema} from 'graphql';

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
