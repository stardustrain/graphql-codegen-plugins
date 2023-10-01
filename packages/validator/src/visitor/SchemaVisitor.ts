import type {ASTNode, ASTVisitFn} from 'graphql';

export type NewVisitor = Partial<{
  readonly [K in ASTNode['kind']]?: {
    leave?: ASTVisitFn<ASTNode>;
  };
}>;

export interface SchemaVisitor extends NewVisitor {
  buildImports: () => string[];
}
