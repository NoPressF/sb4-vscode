import * as vscode from 'vscode';
import { DefinitionSearch } from './definition-search';
import { ReferenceSearch } from './reference-search';
import { OpcodesSearch } from './opcodes-search';

export abstract class Search {
    abstract registerProvider(context: vscode.ExtensionContext): void;
    abstract find(document: vscode.TextDocument, label: string): any;
}

export const RegisterSearchProviders = {
    register(context: vscode.ExtensionContext) {
        const definitionSearch = new DefinitionSearch();
        const referenceSearch = new ReferenceSearch();
        const opcodesSearch = new OpcodesSearch();

        definitionSearch.registerProvider(context);
        referenceSearch.registerProvider(context);
        opcodesSearch.create(context);
    }
};