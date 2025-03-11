import * as vscode from 'vscode';
import { Search } from './search';

export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

export class DefinitionSearch implements Search {
    registerProvider(context: vscode.ExtensionContext): void {
        const provider = vscode.languages.registerDefinitionProvider(LANGUAGE_SELECTOR, {
            provideDefinition: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position, /(@?\w+)/);
                const symbol = document.getText(wordRange).replace('@', '');
                const definitionPos = this.find(document, symbol);
                return definitionPos ? [new vscode.Location(document.uri, definitionPos)] : [];
            },
        });
    
        context.subscriptions.push(provider);
    }

    find(document: vscode.TextDocument, label: string): vscode.Position | undefined {
        const regex = new RegExp(`^:${label}\\b`, 'gm');
        const text = document.getText();
    
        let match;
        while ((match = regex.exec(text)) !== null) {
            const line = document.lineAt(document.positionAt(match.index).line);
            const labelPosition = line.text.indexOf(`:${label}`);
            
            return new vscode.Position(line.lineNumber, labelPosition);
        }
    
        return undefined;
    }
}