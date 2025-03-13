import * as vscode from 'vscode';
import { Enum } from '../enum';

export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

export class EnumHoverProvider implements vscode.HoverProvider {
    constructor(private enumInstance: Enum) {}

    provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const wordRange = document.getWordRangeAtPosition(position, /\b[\w\.]+\b/);
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        const [enumName, elementName] = word.split('.');

        if (!elementName || !enumName) {
            return;
        }

        const enumInfo = this.enumInstance.enums.get(enumName);
        if (!enumInfo) {
            return;
        }

        const element = enumInfo.elements.find(e => e.name === elementName);
        if (!element) {
            return;
        }

        const contents = new vscode.MarkdownString();
        contents.appendMarkdown(`**${enumName}.${elementName}**\n\n`);
        contents.appendMarkdown(`**Type**: ${enumName}\n\n`);
        contents.appendMarkdown(`**Value**: ${element.value}`);

        return new vscode.Hover(contents);
    }

    registerProvider(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                LANGUAGE_SELECTOR,
                this
            )
        );
    }
}