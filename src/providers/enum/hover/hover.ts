import * as vscode from 'vscode';
import { Enum } from '../enum';
import { Singleton } from 'singleton';

export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

export class EnumHoverProvider extends Singleton implements vscode.HoverProvider {

    private context!: vscode.ExtensionContext;

    private enumInstance: Enum = Enum.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.registerProvider();
    } 

    public provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const wordRange = document.getWordRangeAtPosition(position, /\b[\w\.]+\b/);
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        const [enumName, elementName] = word.split('.');

        if (!elementName || !enumName) {
            return;
        }

        const enumInfo = this.enumInstance.getEnumElement(enumName);
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

    private registerProvider() {
        this.context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                LANGUAGE_SELECTOR,
                this
            )
        );
    }
}