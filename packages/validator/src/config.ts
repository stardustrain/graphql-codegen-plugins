import type {TypeScriptPluginConfig} from '@graphql-codegen/typescript';

export interface ValidatorPluginConfig extends TypeScriptPluginConfig {
  /**
   * @default yup
   */
  validator?: 'yup' | 'zod';
  importFrom?: string;
  useTypeImports?: boolean;
  scalarSchemas?: {
    [name: string]: string;
  };
}
