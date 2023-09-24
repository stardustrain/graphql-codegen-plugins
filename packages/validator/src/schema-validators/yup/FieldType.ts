import type {NameNode, NamedTypeNode, TypeNode} from 'graphql';
import {Kind} from 'graphql';
import {isNil} from 'lodash';

import type {ValidatorPluginConfig} from '../../config';
import {
  isInput,
  isListType,
  isNamedType,
  isNonNullType,
} from '../../utils/graphql';
import type {Visitor} from '../../visitor/Visitor';

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
    visitor: Visitor;
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
    visitor: Visitor;
    typeNode: NamedTypeNode;
    parentType?: TypeNode;
  }) {
    const result = this.convertNameNode({visitor, node: typeNode.name});

    if (isNonNullType(parentType)) {
      const flag = visitor.shouldEmitAsNotAllowEmptyString(typeNode.name.value)
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

  private convertNameNode({visitor, node}: {visitor: Visitor; node: NameNode}) {
    const converter = visitor.getNameNodeConverter(node);

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
    visitor: Visitor;
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
