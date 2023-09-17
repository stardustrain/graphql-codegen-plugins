import type {GraphQLSchema} from 'graphql';
import type {SchemaVisitor} from './SchemaVisitor';
import {Visitor} from './Visitor';
import type {ScalarDirection} from './Visitor';

export abstract class BaseSchemaVisitor implements SchemaVisitor {
  constructor(protected schema: GraphQLSchema) {}

  createVisitor(scalarDirection: ScalarDirection) {
    return new Visitor(scalarDirection, this.schema, this.config);
  }
}
