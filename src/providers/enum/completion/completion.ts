import * as vscode from 'vscode';
import { Enum } from '../enum';

export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

export class EnumCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private enumInstance: Enum, context: vscode.ExtensionContext) {
        this.enumInstance.loadEnums(context);
    }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const linePrefix = document.getText(new vscode.Range(position.line, 0, position.line, position.character));
        const enumUsageMatch = linePrefix.match(/(\w+)\.$/i);
        if (!enumUsageMatch) return;

        const enumName = enumUsageMatch[1];
        return this.getEnumValues(enumName);
    }

    private getEnumValues(enumName: string): vscode.CompletionItem[] {
        const enumInfo = this.enumInstance.enums.get(enumName);
        if (!enumInfo) return [];

        return enumInfo.elements.map(element => {
            const item = new vscode.CompletionItem(element.name, vscode.CompletionItemKind.EnumMember);
            item.detail = `${enumName}.${element.name}`;
            item.documentation = new vscode.MarkdownString(`**Type**: ${enumName}\n\n**Value**: ${element.value}`);
            return item;
        });
    }

    registerProvider(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                LANGUAGE_SELECTOR,
                this,
                '.'
            )
        );
    }
}