import * as vscode from 'vscode';
import { Search } from './search';
import { Singleton } from 'singleton';
import { Config } from 'config';

export class DefinitionSearch extends Singleton implements Search {

    private context!: vscode.ExtensionContext;

    public init(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerProvider();
    }
    
    private registerProvider(): void {
        const provider = vscode.languages.registerDefinitionProvider(Config.LANGUAGE_SELECTOR, {
            provideDefinition: (document, position) => {
                const wordRange = document.getWordRangeAtPosition(position, /(@?\w+)/);
                const symbol = document.getText(wordRange).replace('@', '');
                const definitionPos = this.find(document, symbol);
                return definitionPos ? [new vscode.Location(document.uri, definitionPos)] : [];
            },
        });

        this.context.subscriptions.push(provider);
    }

    private find(document: vscode.TextDocument, label: string): vscode.Position | undefined {
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