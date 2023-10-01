import {transformSchemaAST} from '@graphql-codegen/schema-ast';
import type {TypeScriptPluginConfig} from '@graphql-codegen/typescript';
import type {DocumentNode, GraphQLSchema} from 'graphql';
import {Kind, buildSchema, printSchema} from 'graphql';
import {pullAllBy, cloneDeep} from 'lodash';

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

  const sortedAST = sortASTNodes(ast);

  return {
    graphqlSchema: _schema,
    ast: sortedAST,
  };
};
function sortASTNodes(ast: DocumentNode) {
  const clonedAST = cloneDeep(ast);
  const enumDefinitions = clonedAST.definitions.filter(
    definition => definition.kind === Kind.ENUM_TYPE_DEFINITION
  );

  /**
   * @NOTE: Mutate ast.definitions array
   */
  pullAllBy(clonedAST.definitions, enumDefinitions);
  return {
    ...clonedAST,
    definitions: [...enumDefinitions, ...clonedAST.definitions],
  };
}
