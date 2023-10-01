import {DeclarationBlock, indent} from '@graphql-codegen/visitor-plugin-common';
import {
  type EnumTypeDefinitionNode,
  type FieldDefinitionNode,
  type GraphQLSchema,
  type InputObjectTypeDefinitionNode,
  type InputValueDefinitionNode,
} from 'graphql';
import {isNil} from 'lodash';

import {FieldType} from './FieldType';
import type {ValidatorPluginConfig} from '../../config';
import {isNonNullType} from '../../utils/graphql';
import type {Visitor} from '../../visitor/Visitor';
import {BaseSchemaValidator} from '../BaseSchemaValidator';

export class YupSchemaValidator extends BaseSchemaValidator {
  private readonly fieldType: FieldType;

  constructor(schema: GraphQLSchema, config: ValidatorPluginConfig) {
    super(schema, config);
    this.fieldType = new FieldType({config});
  }

  override importValidationSchema(): string {
    return "import * as yup from 'yup';";
  }

  initialEmit(): string {
    return `\n${this.enumDeclarations.join('\n')}`;
  }

  get InputObjectTypeDefinition() {
    return {
      leave: (node: InputObjectTypeDefinitionNode) => {
        const visitor = this.createVisitor('input');
        const name = visitor.convertName(node.name.value);
        this.addTypeToImport(name);
        return this.buildInputFields(node.fields ?? [], visitor, name);
      },
    };
  }

  get ObjectTypeDefinition() {
    return {
      leave: this.objectTypeDefinitionBuilder(node => {
        const visitor = this.createVisitor('output');
        const name = visitor.convertName(node.name.value);
        this.addTypeToImport(name);

        const argumentBlocks = this.buildObjectTypeDefinitionArguments(
          node,
          visitor
        );
        const appendArguments = argumentBlocks ? `\n${argumentBlocks}` : '';

        const shape = node.fields
          ?.map(field => {
            const fieldSchema = this.generateFieldYupSchema({
              visitor,
              field,
            });

            return isNonNullType(field.type)
              ? fieldSchema
              : `${fieldSchema}.optional()`;
          })
          .join(',\n');

        return (
          new DeclarationBlock({})
            .export()
            .asKind('const')
            .withName(`${name}Schema: yup.ObjectSchema<${name}>`)
            .withContent(
              [
                'yup.object({',
                indent(
                  `__typename: yup.string<'${node.name.value}'>().optional(),`
                ),
                shape,
                '})',
              ].join('\n')
            ).string + appendArguments
        );
      }),
    };
  }

  get EnumTypeDefinition() {
    return {
      leave: (node: EnumTypeDefinitionNode) => {
        const visitor = this.createVisitor('output');
        const name = visitor.convertName(node.name.value);
        this.addEnumDeclaration(name);
        const enumName = visitor.getNameNodeConverter(node.name)?.convertName();
        const enumValues = node.values?.map(value => value.name.value);

        if (isNil(enumName) || isNil(enumValues)) {
          return '';
        }

        return [
          new DeclarationBlock({})
            .export()
            .asKind('const enum')
            .withName(`${enumName}`)
            .withContent(
              [
                '{',
                enumValues
                  .map(value => indent(`${value} = '${value}',`))
                  .join('\n'),
                '}',
              ].join('\n')
            ).string,
          new DeclarationBlock({})
            .export()
            .asKind('const')
            .withName(`${enumName}Schema`)
            .withContent(
              [
                'yup',
                indent(`.mixed<${enumName}>()`),
                indent('.required()'),
                indent(
                  `.oneOf([${enumValues
                    .map(value => `${enumName}.${value}`)
                    .join(', ')}])`
                ),
              ].join('\n')
            ).string,
        ].join('\n');
      },
    };
  }

  protected override buildInputFields(
    fields: readonly (FieldDefinitionNode | InputValueDefinitionNode)[],
    visitor: Visitor,
    name: string
  ): string {
    const shape = fields.map(field => {
      const schema = this.generateFieldYupSchema({visitor, field});
      return isNonNullType(field.type) ? `${schema}` : `${schema}.optional()`;
    });

    return new DeclarationBlock({})
      .export()
      .asKind('const')
      .withName(`${name}Schema: yup.ObjectSchema<${name}>`)
      .withContent(['yup.object({', shape.join(',\n'), '})'].join('\n')).string;
  }

  private generateFieldYupSchema({
    visitor,
    field,
  }: {
    visitor: Visitor;
    field: InputValueDefinitionNode | FieldDefinitionNode;
  }) {
    const result = this.fieldType.generateYupSchema({
      visitor,
      typeNode: field.type,
    });

    return indent(
      `${field.name.value}: ${this.fieldType.maybeLazy(field.type, result)}`
    );
  }
}
