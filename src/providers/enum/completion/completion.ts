import * as vscode from 'vscode';
import { Enum } from '../enum';
import { Singleton } from 'singleton';
import { Config } from 'config';

export class EnumCompletionProvider extends Singleton implements vscode.CompletionItemProvider {

    private context!: vscode.ExtensionContext;

    private enumInstance: Enum = Enum.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.registerProvider();
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const linePrefix = document.getText(new vscode.Range(position.line, 0, position.line, position.character));
        const enumUsageMatch = linePrefix.match(/(\w+)\.$/i);
        if (!enumUsageMatch) {
            return;
        }

        const enumName = enumUsageMatch[1];
        return this.getEnumValues(enumName);
    }

    private getEnumValues(enumName: string): vscode.CompletionItem[] {
        const enumInfo = this.enumInstance.getEnumElement(enumName);
        if (!enumInfo) {
            return [];
        }

        return enumInfo.elements.map(element => {
            const item = new vscode.CompletionItem(element.name, vscode.CompletionItemKind.EnumMember);
            item.detail = `${enumName}.${element.name}`;
            item.documentation = new vscode.MarkdownString(`**Type**: ${enumName}\n\n**Value**: ${element.value}`);
            return item;
        });
    }

    private registerProvider() {
        this.context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                Config.LANGUAGE_SELECTOR,
                this,
                '.'
            )
        );
    }
}