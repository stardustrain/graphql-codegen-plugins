import type {NamedTypeNode, TypeNode} from 'graphql';
import {Kind} from 'graphql';

import {maybeLazy} from './utils';
import {BaseFieldTypeSchemaBuilder} from '../../builder/BaseFieldTypeSchemaBuilder';
import type {ValidatorPluginConfig} from '../../pluginConfig';
import {isNonNullType} from '../../utils/graphql';
import type {VisitorHelper} from '../../utils/VisitorHelper';

export class YupFieldTypeSchemaBuilder extends BaseFieldTypeSchemaBuilder {
  constructor({config}: {config: ValidatorPluginConfig}) {
    super({config});
  }

  protected get stringTypeSchema(): string {
    return 'yup.string().defined()';
  }
  protected get numberTypeSchema(): string {
    return 'yup.number().defined()';
  }
  protected get booleanTypeSchema(): string {
    return 'yup.boolean().defined()';
  }

  protected override generateNameNodeSchema({
    visitor,
    typeNode,
    parentType,
  }: {
    visitor: VisitorHelper;
    typeNode: NamedTypeNode;
    parentType?: TypeNode | undefined;
  }): string {
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

  protected override generateListTypeNodeSchema({
    typeNode,
    parentType,
    buildResult,
  }: {
    typeNode: TypeNode;
    parentType?: TypeNode | undefined;
    buildResult: string;
  }): string {
    return `yup.array(${maybeLazy(typeNode, buildResult)}).defined()${
      isNonNullType(parentType) ? '' : '.nullable()'
    }`;
  }

  protected override generateNonNullTypeNodeSchema({
    typeNode,
    buildResult,
  }: {
    typeNode: TypeNode;
    buildResult: string;
  }): string {
    return maybeLazy(typeNode, buildResult);
  }
}
