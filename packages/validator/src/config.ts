import type {TypeScriptPluginConfig} from '@graphql-codegen/typescript';

export interface ValidatorPluginConfig extends TypeScriptPluginConfig {
  validator?: 'yup';
  importFrom?: string;
  useTypeImports?: boolean;
}
