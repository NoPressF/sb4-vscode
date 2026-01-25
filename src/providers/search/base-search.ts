import { BaseProvider } from '@providers';
import { Singleton } from '@utils';
import * as vscode from 'vscode';

export abstract class BaseSearchProvider extends Singleton {
    public baseProvider: BaseProvider = BaseProvider.getInstance();

    public init(): void {
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