import type {
  FieldDefinitionNode,
  GraphQLSchema,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';

import type {SchemaVisitor} from './SchemaVisitor';
import type {ScalarDirection} from './Visitor';
import {Visitor} from './Visitor';
import type {ValidatorPluginConfig} from '../config';

export abstract class BaseSchemaVisitor implements SchemaVisitor {
  protected importTypes: string[] = [];
  protected enumDeclarations: string[] = [];

  constructor(
    protected schema: GraphQLSchema,
    protected config: ValidatorPluginConfig
  ) {}

  abstract importValidationSchema(): string;
  abstract initialEmit(): string;
  protected abstract buildInputFields(
    fields: readonly (FieldDefinitionNode | InputValueDefinitionNode)[],
    visitor: Visitor,
    name: string
  ): string;
  protected buildObjectTypeDefinitionArguments(
    node: ObjectTypeDefinitionNode,
    visitor: Visitor
  ) {
    return visitor.buildArgumentsSchemaBlock(node, (typeName, field) => {
      this.importTypes.push(typeName);
      return this.buildInputFields(field.arguments ?? [], visitor, typeName);
    });
  }

  createVisitor(scalarDirection: ScalarDirection) {
    return new Visitor(scalarDirection, this.schema, this.config);
  }

  buildImports(): string[] {
    if (this.shouldInsertImportPhrase()) {
      const importKeyword = this.config.useTypeImports ? 'type' : '';
      const importTypes = this.importTypes.join(', ');

      return [
        this.importValidationSchema(),
        `import ${importKeyword} { ${importTypes} from '${this.config.importFrom}';`,
      ];
    }

    return [this.importValidationSchema()];
  }

  private shouldInsertImportPhrase() {
    return this.config.importFrom && this.importTypes.length > 0;
  }
}
