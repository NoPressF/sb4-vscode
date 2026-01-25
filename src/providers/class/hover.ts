import { CommandType, CONFIG, getDottedWordRangeAtPosition, Singleton } from '@utils';
import * as vscode from 'vscode';
import { BaseProvider } from '../base';
import { ClassProvider } from './class';

export class ClassHoverProvider extends Singleton {
	private class: ClassProvider = ClassProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public register() {
		const provider: vscode.HoverProvider = {
			provideHover: (doc, pos, _token) => {
				const wordRange = getDottedWordRangeAtPosition(doc, pos);
				if (!wordRange) {
					return;
				}

				const word = doc.getText(wordRange);
				const [className, memberName] = word.split('.');

				if (!memberName || !className) {
					return;
				}

				const classInfo = this.class.getMember(className);
				if (!classInfo) {
					return;
				}

				const element = classInfo.find(cmd => cmd.member === memberName);
				if (!element) {
					return;
				}

				const format = (element.format?.[CommandType.CLASS_MEMBER] ?? '');

				const markdown = new vscode.MarkdownString();
				markdown.appendMarkdown(`${format}\n\n${element.shortDesc}`);

				return new vscode.Hover(markdown, wordRange);
			}
		};

		this.baseProvider.context.subscriptions.push(vscode.languages.registerHoverProvider(CONFIG.LANGUAGE_SELECTOR, provider));
	}
}