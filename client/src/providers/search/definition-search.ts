import * as vscode from 'vscode';
import { BaseSearchProvider } from './base-search-provider';
import { Config } from '../../config';

export class DefinitionSearch extends BaseSearchProvider {
    protected registerProvider(): void {
        const provider = vscode.languages.registerDefinitionProvider(Config.LANGUAGE_SELECTOR, {
            provideDefinition: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position, /(@?\w+)/);
                const symbol = document.getText(wordRange).replace('@', '');
                const definitionPattern = new RegExp(`^:${symbol}\\b`, 'gm');
                return this.findInDocument(document, definitionPattern);
            },
        });
        this.context.subscriptions.push(provider);
    }
}