import {DeclarationBlock, indent} from '@graphql-codegen/visitor-plugin-common';
import type {
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  GraphQLSchema,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {isNil} from 'lodash';

import {maybeLazy} from './utils';
import {YupFieldTypeSchemaBuilder} from './YupFieldTypeSchemaBuilder';
import {EnumDeclarationBuilder} from '../../builder/EnumDeclarationBuilder';
import type {ValidatorPluginConfig} from '../../pluginConfig';
import {isNonNullType} from '../../utils/graphql';
import type {VisitorHelper} from '../../utils/VisitorHelper';
import {BaseBuilder} from '../BaseBuilder';

export class YupSchemaValidator extends BaseBuilder {
  private readonly enumDeclarationBuilder: EnumDeclarationBuilder;

  constructor(schema: GraphQLSchema, config: ValidatorPluginConfig) {
    super({
      schema,
      config,
      schemaBuilder: new YupFieldTypeSchemaBuilder({config}),
    });
    this.enumDeclarationBuilder = new EnumDeclarationBuilder();
  }

  override importValidationLibraryPhrase(): string {
    return "import * as yup from 'yup';";
  }

  protected override buildInputFields(
    fields: readonly (InputValueDefinitionNode | FieldDefinitionNode)[],
    visitor: VisitorHelper,
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

  protected override buildObjectTypeDefinition(
    node: ObjectTypeDefinitionNode
  ): string {
    const visitor = this.createVisitor('output');
    const name = visitor.convertName(node.name.value);
    this.addTypeForImport(name);

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
  }

  protected override buildEnumTypeDefinition(
    node: EnumTypeDefinitionNode
  ): string {
    const visitor = this.createVisitor('output');
    const enumName = visitor.makeNameNodeConverter(node.name)?.convertName();
    const enumValues = node.values?.map(value => value.name.value);

    if (isNil(enumName) || isNil(enumValues)) {
      return '';
    }

    return [
      this.enumDeclarationBuilder.build(enumName, enumValues),
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
  }

  protected override buildUnionTypeDefinition(): string {
    return '// Yup has not supported union type.';
  }

  private generateFieldYupSchema({
    visitor,
    field,
  }: {
    visitor: VisitorHelper;
    field: InputValueDefinitionNode | FieldDefinitionNode;
  }) {
    const result = this.schemaBuilder.build({
      visitor,
      typeNode: field.type,
    });

    return indent(`${field.name.value}: ${maybeLazy(field.type, result)}`);
  }
}
