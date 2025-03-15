import * as vscode from 'vscode';
import { DefinitionSearch } from './definition-search';
import { ReferenceSearch } from './reference-search';
import { OpcodesSearch } from './opcodes-search';

export abstract class Search {
    public abstract init(context: vscode.ExtensionContext): void;
}

export const RegisterSearchProviders = {
    register(context: vscode.ExtensionContext) {
        const definitionSearch = DefinitionSearch.getInstance();
        const referenceSearch = ReferenceSearch.getInstance();
        const opcodesSearch = OpcodesSearch.getInstance();

        definitionSearch.init(context);
        referenceSearch.init(context);
        opcodesSearch.init(context);
    }
};