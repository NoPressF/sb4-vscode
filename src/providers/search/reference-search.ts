import * as vscode from 'vscode';
import { Search } from './search';

export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

export class ReferenceSearch implements Search {
    registerProvider(context: vscode.ExtensionContext) {
        const provider = vscode.languages.registerReferenceProvider(LANGUAGE_SELECTOR, {
            provideReferences: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position);
                const word = document.getText(wordRange);
                const references = this.find(document, word);
                return references;
            }
        });

        context.subscriptions.push(provider);
    }

    find(document: vscode.TextDocument, label: string): vscode.Location[] {
        const regex = new RegExp(label, 'gm');
        const text = document.getText();
        const locations = [];

        let match;
        while ((match = regex.exec(text)) !== null) {
            const line = document.lineAt(document.positionAt(match.index).line);
            const labelPosition = line.text.indexOf(label);

            locations.push(new vscode.Location(document.uri, new vscode.Position(line.lineNumber, labelPosition)));
        }

        return locations;
    }
}