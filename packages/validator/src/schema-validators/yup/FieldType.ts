import type {NameNode, NamedTypeNode, TypeNode} from 'graphql';
import {Kind} from 'graphql';
import {isNil} from 'lodash';

import type {ValidatorPluginConfig} from '../../pluginConfig';
import {
  isInput,
  isListType,
  isNamedType,
  isNonNullType,
} from '../../utils/graphql';
import type {VisitorHelper} from '../../utils/VisitorHelper';

export class FieldType {
  private readonly validatorPluginConfig: ValidatorPluginConfig;

  constructor({config}: {config: ValidatorPluginConfig}) {
    this.validatorPluginConfig = config;
  }

  generateYupSchema({
    visitor,
    typeNode,
    parentType,
  }: {
    visitor: VisitorHelper;
    typeNode: TypeNode;
    parentType?: TypeNode;
  }): string {
    if (isNamedType(typeNode)) {
      return this.generateNameNodeYupSchema({visitor, typeNode, parentType});
    }

    if (isListType(typeNode)) {
      const result = this.generateYupSchema({
        visitor,
        typeNode: typeNode.type,
        parentType: typeNode,
      });

      return `yup.array(${this.maybeLazy(typeNode.type, result)}).defined()${
        isNonNullType(parentType) ? '' : '.nullable()'
      }`;
    }

    if (isNonNullType(typeNode)) {
      const result = this.generateYupSchema({
        visitor,
        typeNode: typeNode.type,
        parentType: typeNode,
      });

      return this.maybeLazy(typeNode.type, result);
    }

    throw new Error('generateYupSchema: unknown type');
  }

  maybeLazy(typeNode: TypeNode, schema: string) {
    if (isNamedType(typeNode) && isInput(typeNode.name.value)) {
      return `yup.lazy(() => ${schema})`;
    }

    return schema;
  }

  private generateNameNodeYupSchema({
    visitor,
    typeNode,
    parentType,
  }: {
    visitor: VisitorHelper;
    typeNode: NamedTypeNode;
    parentType?: TypeNode;
  }) {
    const result = this.convertNameNode({visitor, node: typeNode.name});

    if (isNonNullType(parentType)) {
      const flag = visitor.shouldPreventEmptyString(typeNode.name.value)
        ? 'required'
        : 'nonNullable';
      return `${result}.${flag}()`;
    }

    const type = visitor.getTypeByName(typeNode.name.value);

    if (type?.astNode?.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
      return result;
    }

    return `${result}.nullable()`;
  }

  private convertNameNode({
    visitor,
    node,
  }: {
    visitor: VisitorHelper;
    node: NameNode;
  }) {
    const converter = visitor.makeNameNodeConverter(node);

    if (isNil(converter)) {
      return this.generatePrimitiveTypeYupSchema({
        visitor,
        scalarName: node.value,
      });
    }

    return `${converter.convertName()}Schema`;
  }

  private generatePrimitiveTypeYupSchema({
    visitor,
    scalarName,
  }: {
    visitor: VisitorHelper;
    scalarName: string;
  }): string {
    if (this.validatorPluginConfig.scalarSchemas?.[scalarName]) {
      return `${this.validatorPluginConfig.scalarSchemas[scalarName]}.defined()`;
    }

    const tsType = visitor.getScalarType(scalarName);

    switch (tsType) {
      case 'string':
        return 'yup.string().defined()';
      case 'number':
        return 'yup.number().defined()';
      case 'boolean':
        return 'yup.boolean().defined()';
      default:
        throw new Error('generatePrimitiveTypeYupSchema: unhandled type name');
    }
  }
}
