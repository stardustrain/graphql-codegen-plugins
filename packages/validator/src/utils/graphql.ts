import type {
  GraphQLSchema,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  TypeNode,
} from 'graphql';
import {isSpecifiedScalarType} from 'graphql';

export const isGeneratedByIntrospection = (schema: GraphQLSchema): boolean =>
  Object.entries(schema.getTypeMap())
    .filter(
      ([name, type]) => !name.startsWith('__') && !isSpecifiedScalarType(type)
    )
    .every(([, type]) => type.astNode === undefined);

export const isListType = (typeNode?: TypeNode): typeNode is ListTypeNode =>
  typeNode?.kind === 'ListType';
export const isNonNullType = (
  typeNode?: TypeNode
): typeNode is NonNullTypeNode => typeNode?.kind === 'NonNullType';
export const isNamedType = (typeNode?: TypeNode): typeNode is NamedTypeNode =>
  typeNode?.kind === 'NamedType';
export const isInput = (kind: string) => kind.includes('Input');
