import {TsVisitor} from '@graphql-codegen/typescript';
import type {
  FieldDefinitionNode,
  GraphQLNamedType,
  GraphQLSchema,
  NameNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {specifiedScalarTypes} from 'graphql';
import {isEmpty, isNil} from 'lodash';

import type {ValidatorPluginConfig} from '../pluginConfig';

export type ScalarDirection = 'input' | 'output' | 'both';

export class VisitorHelper extends TsVisitor {
  constructor(
    private readonly scalarDirection: ScalarDirection,
    private readonly schema: GraphQLSchema,
    pluginConfig: ValidatorPluginConfig
  ) {
    super(schema, pluginConfig);
  }

  getTypeByName(name: string) {
    return this.schema.getType(name);
  }

  makeNameNodeConverter(node: NameNode) {
    const graphqlNamedType = this.getTypeByName(node.value);
    const astNode = graphqlNamedType?.astNode;

    if (this.isPrimitiveType(astNode)) {
      return null;
    }

    return {
      targetKind: astNode.kind,
      convertName: () => this.convertName(astNode.name.value),
    };
  }

  getScalarType(scalarName: string) {
    if (this.scalarDirection === 'both') {
      return null;
    }

    return this.scalars[scalarName][this.scalarDirection];
  }

  buildFieldArgumentsSchemaBlock(
    node: ObjectTypeDefinitionNode,
    callback: (typeName: string, field: FieldDefinitionNode) => string
  ) {
    const fieldsWithArguments =
      node.fields?.filter(
        field => field.arguments && field.arguments.length > 0
      ) ?? [];

    if (isEmpty(fieldsWithArguments)) {
      return null;
    }

    return fieldsWithArguments
      .map(field => {
        const name =
          node.name.value +
          (this.config.addUnderscoreToArgsType ? '_' : '') +
          this.convertName(field, {
            useTypesPrefix: false,
            useTypesSuffix: false,
          }) +
          'Args';

        return callback(name, field);
      })
      .join('\n');
  }

  shouldPreventEmptyString(name: string): boolean {
    const nameNodeType = this.getTypeByName(name);

    if (
      nameNodeType?.astNode?.kind !== 'ScalarTypeDefinition' &&
      !this.isSpecifiedScalarName(name)
    ) {
      return false;
    }

    const tsType = this.getScalarType(name);
    return tsType === 'string';
  }

  private isPrimitiveType(
    astNode?: GraphQLNamedType['astNode']
  ): astNode is undefined | null {
    return isNil(astNode);
  }

  private isSpecifiedScalarName(scalarName: string) {
    return specifiedScalarTypes.some(({name}) => name === scalarName);
  }
}
