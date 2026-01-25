import { CONFIG, getDottedWordRangeAtPosition, Singleton } from '@utils';
import * as vscode from 'vscode';
import { BaseProvider } from '../base';
import { EnumProvider } from './enum';

export class EnumHoverProvider extends Singleton {
	private enum: EnumProvider = EnumProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public register() {
		const provider: vscode.HoverProvider = {
			provideHover: (doc, pos, _token) => {
				const wordRange = getDottedWordRangeAtPosition(doc, pos);
				if (!wordRange) {
					return;
				}

				const word = doc.getText(wordRange);
				const [enumName, memberName] = word.split('.');

				if (!memberName || !enumName) {
					return;
				}

				const enumInfo = this.enum.getElement(enumName);
				if (!enumInfo) {
					return;
				}

				const member = enumInfo.find(e => e.name === memberName);
				if (!member) {
					return;
				}

				const markdown = new vscode.MarkdownString();
				markdown.appendMarkdown(`${enumName}.${memberName}\n\n`);
				markdown.appendMarkdown(`Value: \`${member.value}\``);

				markdown.isTrusted = true;

				return new vscode.Hover(markdown, wordRange);
			}
		};

		this.baseProvider.context.subscriptions.push(vscode.languages.registerHoverProvider(CONFIG.LANGUAGE_SELECTOR, provider));
	};
}