import {TsVisitor} from '@graphql-codegen/typescript';
import {specifiedScalarTypes} from 'graphql';
import type {
  FieldDefinitionNode,
  GraphQLSchema,
  NameNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {isNil} from 'lodash-es';

import type {ValidatorPluginConfig} from '../config';

export type ScalarDirection = 'input' | 'output' | 'both';

export class Visitor extends TsVisitor {
  constructor(
    private readonly scalarDirection: ScalarDirection,
    private readonly schema: GraphQLSchema,
    private readonly pluginConfig: ValidatorPluginConfig
  ) {
    super(schema, pluginConfig);
  }

  getTypeByName(name: string) {
    return this.schema.getType(name);
  }

  getNameNodeConverter(node: NameNode) {
    const graphqlNamedType = this.getTypeByName(node.value);
    const astNode = graphqlNamedType?.astNode;

    if (isNil(astNode)) {
      return undefined;
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

  public shouldEmitAsNotAllowEmptyString(name: string): boolean {
    const typ = this.getTypeByName(name);
    if (
      typ?.astNode?.kind !== 'ScalarTypeDefinition' &&
      !this.isSpecifiedScalarName(name)
    ) {
      return false;
    }
    const tsType = this.getScalarType(name);
    return tsType === 'string';
  }

  buildArgumentsSchemaBlock(
    node: ObjectTypeDefinitionNode,
    callback: (typeName: string, field: FieldDefinitionNode) => string
  ) {
    const fieldsWithArguments =
      node.fields?.filter(
        field => field.arguments && field.arguments.length > 0
      ) ?? [];
    if (fieldsWithArguments.length === 0) {
      return undefined;
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

  private isSpecifiedScalarName(scalarName: string) {
    return specifiedScalarTypes.some(({name}) => name === scalarName);
  }
}
