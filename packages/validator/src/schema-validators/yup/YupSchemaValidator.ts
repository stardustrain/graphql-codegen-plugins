import {DeclarationBlock, indent} from '@graphql-codegen/visitor-plugin-common';
import {
  type FieldDefinitionNode,
  type InputObjectTypeDefinitionNode,
  type InputValueDefinitionNode,
  type TypeNode,
  type ObjectTypeDefinitionNode,
  type GraphQLSchema,
} from 'graphql';

import {FieldType} from './FieldType';
import type {ValidatorPluginConfig} from '../../config';
import {isInput, isNamedType, isNonNullType} from '../../utils/graphql';
import type {Visitor} from '../../visitor/Visitor';
import {BaseSchemaValidator} from '../BaseSchemaValidator';

const INDENT_COUNT = 2;

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

        return new DeclarationBlock({})
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
          ).string;
      }),
    };
  }

  protected override buildInputFields(
    fields: readonly (FieldDefinitionNode | InputValueDefinitionNode)[],
    visitor: Visitor,
    name: string
  ): string {
    throw new Error('Method not implemented.');
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
