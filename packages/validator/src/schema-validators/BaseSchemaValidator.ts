import type {
  FieldDefinitionNode,
  GraphQLSchema,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';

import type {ValidatorPluginConfig} from '../pluginConfig';
import type {SchemaVisitor} from '../visitor/SchemaVisitor';
import type {ScalarDirection} from '../visitor/Visitor';
import {Visitor} from '../visitor/Visitor';

export abstract class BaseSchemaValidator implements SchemaVisitor {
  protected importTypes: string[] = [];
  protected enumDeclarations: string[] = [];

  constructor(
    protected schema: GraphQLSchema,
    protected config: ValidatorPluginConfig
  ) {}
  createVisitor(scalarDirection: ScalarDirection) {
    return new Visitor(scalarDirection, this.schema, this.config);
  }

  buildImports(): string[] {
    if (this.shouldInsertImportPhrase()) {
      const importKeyword = this.config.useTypeImports ? 'type' : '';
      const importTypes = this.importTypes.join(', ');

      return [
        this.importValidationSchema(),
        `import ${importKeyword} { ${importTypes} } from '${this.config.importFrom}';`,
      ];
    }

    return [this.importValidationSchema()];
  }

  protected buildObjectTypeDefinitionArguments(
    node: ObjectTypeDefinitionNode,
    visitor: Visitor
  ) {
    return visitor.buildArgumentsSchemaBlock(node, (typeName, field) => {
      this.importTypes.push(typeName);
      return this.buildInputFields(field.arguments ?? [], visitor, typeName);
    });
  }

  /**
   * abstract methods
   */
  protected abstract importValidationSchema(): string;
  protected abstract buildInputFields(
    fields: readonly (FieldDefinitionNode | InputValueDefinitionNode)[],
    visitor: Visitor,
    name: string
  ): string;

  protected objectTypeDefinitionBuilder(
    callback: (node: ObjectTypeDefinitionNode) => string
  ) {
    return (node: ObjectTypeDefinitionNode) => {
      if (this.isRootField(node)) {
        return;
      }

      return callback(node);
    };
  }

  protected addTypeToImport(types: string) {
    this.importTypes.push(types);
  }

  protected addEnumDeclaration(declaration: string) {
    this.enumDeclarations.push(declaration);
  }

  private isRootField(node: ObjectTypeDefinitionNode) {
    return /^(Query|Mutation|Subscription)$/.test(node.name.value);
  }

  private shouldInsertImportPhrase() {
    return this.config.importFrom && this.importTypes.length > 0;
  }
}
