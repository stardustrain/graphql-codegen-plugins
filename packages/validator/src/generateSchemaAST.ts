import {transformSchemaAST} from '@graphql-codegen/schema-ast';
import type {DocumentNode, GraphQLSchema} from 'graphql';
import {Kind, buildSchema, printSchema} from 'graphql';
import {pullAllBy, cloneDeep} from 'lodash';

import type {ValidatorPluginConfig} from './pluginConfig';
import {isGeneratedByIntrospection} from './utils/graphql';

type GenerateSchemaASTParams = {
  graphqlSchema: GraphQLSchema;
  config: ValidatorPluginConfig;
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
  const preDefinedDefinitions = clonedAST.definitions.filter(
    definition => definition.kind === Kind.ENUM_TYPE_DEFINITION
  );

  const postDefinedDefinitions = clonedAST.definitions.filter(
    definition => definition.kind === Kind.UNION_TYPE_DEFINITION
  );

  /**
   * @NOTE: Mutate ast.definitions array
   */
  pullAllBy(
    clonedAST.definitions,
    preDefinedDefinitions.concat(postDefinedDefinitions)
  );

  return {
    ...clonedAST,
    definitions: preDefinedDefinitions
      .concat(clonedAST.definitions)
      .concat(postDefinedDefinitions),
  };
}
