import type {GraphQLSchema} from 'graphql';
import {isSpecifiedScalarType} from 'graphql';

export const isGeneratedByIntrospection = (schema: GraphQLSchema): boolean =>
  Object.entries(schema.getTypeMap())
    .filter(
      ([name, type]) => !name.startsWith('__') && !isSpecifiedScalarType(type)
    )
    .every(([, type]) => type.astNode === undefined);
