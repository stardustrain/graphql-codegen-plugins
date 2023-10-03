import type {
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  GraphQLSchema,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
  UnionTypeDefinitionNode,
} from 'graphql';

import type {BaseFieldTypeSchemaBuilder} from '../builder/BaseFieldTypeSchemaBuilder';
import {EnumDeclarationBuilder} from '../builder/EnumDeclarationBuilder';
import type {ValidatorPluginConfig} from '../pluginConfig';
import type {ScalarDirection} from '../utils/VisitorHelper';
import {VisitorHelper} from '../utils/VisitorHelper';

export abstract class BaseBuilder {
  protected importTypes: string[] = [];
  protected readonly schema: GraphQLSchema;
  protected readonly config: ValidatorPluginConfig;
  protected readonly schemaBuilder: BaseFieldTypeSchemaBuilder;
  protected readonly enumDeclarationBuilder: EnumDeclarationBuilder;

  constructor({
    schema,
    config,
    schemaBuilder,
  }: {
    schema: GraphQLSchema;
    config: ValidatorPluginConfig;
    schemaBuilder: BaseFieldTypeSchemaBuilder;
  }) {
    this.schema = schema;
    this.config = config;
    this.schemaBuilder = schemaBuilder;
    this.enumDeclarationBuilder = new EnumDeclarationBuilder();
  }

  createVisitor(scalarDirection: ScalarDirection) {
    return new VisitorHelper(scalarDirection, this.schema, this.config);
  }

  buildImports(): string[] {
    if (this.shouldInsertImportTypes()) {
      const importKeyword = this.config.useTypeImports ? 'type' : '';
      const importTypes = this.importTypes.join(', ');

      return [
        this.importValidationLibraryPhrase(),
        `import ${importKeyword} { ${importTypes} } from '${this.config.importFrom}';`,
      ];
    }

    return [this.importValidationLibraryPhrase()];
  }

  protected buildObjectTypeDefinitionArguments(
    node: ObjectTypeDefinitionNode,
    visitor: VisitorHelper
  ) {
    return visitor.buildFieldArgumentsSchemaBlock(node, (typeName, field) => {
      this.importTypes.push(typeName);
      return this.buildInputFields(field.arguments ?? [], visitor, typeName);
    });
  }

  get ObjectTypeDefinition() {
    return {
      leave: (node: ObjectTypeDefinitionNode) => {
        if (this.isRootField(node)) {
          return;
        }

        return this.buildObjectTypeDefinition(node);
      },
    };
  }

  get InputObjectTypeDefinition() {
    return {
      leave: (node: InputObjectTypeDefinitionNode) => {
        const visitor = this.createVisitor('input');
        const name = visitor.convertName(node.name.value);
        this.addTypeForImport(name);
        return this.buildInputFields(node.fields ?? [], visitor, name);
      },
    };
  }

  get EnumTypeDefinition() {
    return {
      leave: (node: EnumTypeDefinitionNode) => {
        return this.buildEnumTypeDefinition(node);
      },
    };
  }

  get UnionTypeDefinition() {
    return {
      leave: (node: UnionTypeDefinitionNode) => {
        return this.buildUnionTypeDefinition(node);
      },
    };
  }

  /**
   * abstract methods
   */
  protected abstract importValidationLibraryPhrase(): string;
  protected abstract buildInputFields(
    fields: readonly (FieldDefinitionNode | InputValueDefinitionNode)[],
    visitor: VisitorHelper,
    name: string
  ): string;

  protected abstract buildObjectTypeDefinition(
    node: ObjectTypeDefinitionNode
  ): string;

  protected abstract buildEnumTypeDefinition(
    node: EnumTypeDefinitionNode
  ): string;

  protected abstract buildUnionTypeDefinition(
    node: UnionTypeDefinitionNode
  ): string;

  protected addTypeForImport(types: string) {
    this.importTypes.push(types);
  }

  private isRootField(node: ObjectTypeDefinitionNode) {
    return /^(Query|Mutation|Subscription)$/.test(node.name.value);
  }

  private shouldInsertImportTypes() {
    return this.config.importFrom && this.importTypes.length > 0;
  }
}
