import {DeclarationBlock, indent} from '@graphql-codegen/visitor-plugin-common';

export class EnumDeclarationBuilder {
  build(enumName: string, enumValues: string[]) {
    return new DeclarationBlock({})
      .export()
      .asKind('const enum')
      .withName(`${enumName}`)
      .withContent(
        [
          '{',
          enumValues.map(value => indent(`${value} = '${value}',`)).join('\n'),
          '}',
        ].join('\n')
      ).string;
  }
}
