import * as vscode from 'vscode';
import { DefinitionSearch } from './definition-search';
import { OpcodesSearch } from './opcodes-search';
import { ReferenceSearch } from './reference-search';

export const registerSearchProviders = (context: vscode.ExtensionContext) => {
  DefinitionSearch.getInstance().init(context);
  ReferenceSearch.getInstance().init(context);
  OpcodesSearch.getInstance().init(context);
};