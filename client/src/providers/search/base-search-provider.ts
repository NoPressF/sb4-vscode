import * as vscode from 'vscode';
import { Singleton } from '../../../../src/singleton';

export abstract class BaseSearchProvider extends Singleton {
    protected context!: vscode.ExtensionContext;

    public init(context: vscode.ExtensionContext): void {
        this.context = context;
        this.registerProvider();
    }

    protected abstract registerProvider(): void;

    protected findInDocument(document: vscode.TextDocument, pattern: RegExp): vscode.Location[] {
        const text = document.getText();
        const locations: vscode.Location[] = [];
        let match;

        while ((match = pattern.exec(text)) !== null) {
            const position = document.positionAt(match.index);
            const line = document.lineAt(position.line);
            locations.push(new vscode.Location(document.uri, line.range.start));
        }

        return locations;
    }
}