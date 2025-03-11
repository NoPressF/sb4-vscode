import * as vscode from 'vscode';
import { DefinitionSearch } from './definition-search';
import { ReferenceSearch } from './reference-search';

export abstract class Search {
    abstract registerProvider(context: vscode.ExtensionContext): void;
    abstract find(document: vscode.TextDocument, label: string): any;
}

export const RegisterSearchProviders = {
    register(context: vscode.ExtensionContext) {
        const definitionSearch = new DefinitionSearch();
        const referenceSearch = new ReferenceSearch();

        definitionSearch.registerProvider(context);
        referenceSearch.registerProvider(context);
    }
};