import * as vscode from 'vscode';
import { DefinitionSearch } from './definition-search';
import { ReferenceSearch } from './reference-search';
import { OpcodesSearch } from './opcodes/opcodes-search';

export const registerSearchProviders = (context: vscode.ExtensionContext) => {
  DefinitionSearch.getInstance().init(context);
  ReferenceSearch.getInstance().init(context);
  OpcodesSearch.getInstance().init(context);
};