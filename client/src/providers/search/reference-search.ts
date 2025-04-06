import * as vscode from 'vscode';
import { BaseSearchProvider } from './base-search-provider';
import { Config } from '../../config';

export class ReferenceSearch extends BaseSearchProvider {
    protected registerProvider(): void {
        const provider = vscode.languages.registerReferenceProvider(Config.LANGUAGE_SELECTOR, {
            provideReferences: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position);
                const word = document.getText(wordRange);
                return this.findInDocument(document, new RegExp(word, 'gm'));
            },
        });
        this.context.subscriptions.push(provider);
    }
}