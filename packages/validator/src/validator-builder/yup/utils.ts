import type {TypeNode} from 'graphql';

import {isInput, isNamedType} from '../../utils/graphql';

export const maybeLazy = (typeNode: TypeNode, schema: string) => {
  if (isNamedType(typeNode) && isInput(typeNode.name.value)) {
    return `yup.lazy(() => ${schema})`;
  }

  return schema;
};
