import * as vscode from 'vscode';
import { Search } from './search';
import { Singleton } from 'singleton';
import { Config } from 'config';

export class ReferenceSearch extends Singleton implements Search {
    private context!: vscode.ExtensionContext;
    
    public init(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerProvider();
    }

    private registerProvider() {
        const provider = vscode.languages.registerReferenceProvider(Config.LANGUAGE_SELECTOR, {
            provideReferences: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position);
                const word = document.getText(wordRange);
                const references = this.find(document, word);
                return references;
            }
        });

        this.context.subscriptions.push(provider);
    }

    private find(document: vscode.TextDocument, label: string): vscode.Location[] {
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