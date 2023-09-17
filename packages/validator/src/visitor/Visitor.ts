import type {GraphQLSchema, NameNode} from 'graphql';
import type {TypeScriptPluginConfig} from '@graphql-codegen/typescript';
import {isNil} from 'lodash-es';

import {TsVisitor} from '@graphql-codegen/typescript';

export type ScalarDirection = 'input' | 'output' | 'both';

export class Visitor extends TsVisitor {
  constructor(
    private readonly scalarDirection: ScalarDirection,
    private readonly schema: GraphQLSchema,
    private pluginConfig: TypeScriptPluginConfig
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
}
