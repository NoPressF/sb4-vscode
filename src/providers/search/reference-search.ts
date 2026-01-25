import { CONFIG } from '@utils';
import * as vscode from 'vscode';
import { BaseSearchProvider } from './base-search';

export class ReferenceSearch extends BaseSearchProvider {
    protected registerProvider(): void {
        const provider = vscode.languages.registerReferenceProvider(CONFIG.LANGUAGE_SELECTOR, {
            provideReferences: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position);
                const word = document.getText(wordRange);
                return this.findInDocument(document, new RegExp(word, 'gm'));
            },
        });
        
        this.baseProvider.context.subscriptions.push(provider);
    }
}