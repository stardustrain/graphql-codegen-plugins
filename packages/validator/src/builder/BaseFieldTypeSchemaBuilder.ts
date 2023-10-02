import type {NamedTypeNode, NameNode, TypeNode} from 'graphql';
import {isNil} from 'lodash';

import type {ValidatorPluginConfig} from '../pluginConfig';
import {isListType, isNamedType, isNonNullType} from '../utils/graphql';
import type {VisitorHelper} from '../utils/VisitorHelper';

export abstract class BaseFieldTypeSchemaBuilder {
  private readonly validatorPluginConfig: ValidatorPluginConfig;

  constructor({config}: {config: ValidatorPluginConfig}) {
    this.validatorPluginConfig = config;
  }

  build({
    visitor,
    typeNode,
    parentType,
  }: {
    visitor: VisitorHelper;
    typeNode: TypeNode;
    parentType?: TypeNode;
  }): string {
    if (isNamedType(typeNode)) {
      return this.generateNameNodeSchema({visitor, typeNode, parentType});
    }

    if (isListType(typeNode)) {
      const result = this.build({
        visitor,
        typeNode: typeNode.type,
        parentType: typeNode,
      });

      return this.generateListTypeNodeSchema({
        typeNode,
        parentType,
        buildResult: result,
      });
    }

    if (isNonNullType(typeNode)) {
      const result = this.build({
        visitor,
        typeNode: typeNode.type,
        parentType: typeNode,
      });

      return this.generateNonNullTypeNodeSchema({
        typeNode: typeNode.type,
        buildResult: result,
      });
    }

    throw new Error('generateYupSchema: unknown type');
  }

  protected convertNameNode({
    visitor,
    node,
  }: {
    visitor: VisitorHelper;
    node: NameNode;
  }) {
    const converter = visitor.makeNameNodeConverter(node);

    if (isNil(converter)) {
      return this.generatePrimitiveType({
        visitor,
        scalarName: node.value,
      });
    }

    return `${converter.convertName()}Schema`;
  }

  protected generatePrimitiveType({
    visitor,
    scalarName,
  }: {
    visitor: VisitorHelper;
    scalarName: string;
  }): string {
    const tsType = visitor.getScalarType(scalarName);

    switch (tsType) {
      case 'string':
        return this.stringTypeSchema;
      case 'number':
        return this.numberTypeSchema;
      case 'boolean':
        return this.booleanTypeSchema;
      default:
        throw new Error('generatePrimitiveTypeYupSchema: unhandled type name');
    }
  }

  protected abstract get stringTypeSchema(): string;
  protected abstract get numberTypeSchema(): string;
  protected abstract get booleanTypeSchema(): string;
  protected abstract generateNameNodeSchema({
    visitor,
    typeNode,
    parentType,
  }: {
    visitor: VisitorHelper;
    typeNode: NamedTypeNode;
    parentType?: TypeNode;
  }): string;
  protected abstract generateListTypeNodeSchema({
    typeNode,
    parentType,
    buildResult,
  }: {
    typeNode: TypeNode;
    parentType?: TypeNode;
    buildResult: string;
  }): string;
  protected abstract generateNonNullTypeNodeSchema({
    typeNode,
    buildResult,
  }: {
    typeNode: TypeNode;
    buildResult: string;
  }): string;
}
