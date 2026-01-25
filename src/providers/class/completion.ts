import { CONFIG, Singleton } from '@utils';
import * as vscode from 'vscode';
import { CompletionItemKind } from 'vscode';
import { BaseProvider } from '../base';
import { ClassProvider } from './class';

export class ClassCompletionProvider extends Singleton {
	private class: ClassProvider = ClassProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public register() {
		const provider: vscode.CompletionItemProvider = {
			provideCompletionItems: (doc, pos, _token, _context) => {

				const classesMembers = this.class.get();

				const lineText = doc.lineAt(pos.line).text;
				const textBeforeCursor = lineText.slice(0, pos.character);

				const classMatch = textBeforeCursor.match(/(\w+)\.$/);

				if (classMatch) {
					const className = classMatch[1];

					const members = classesMembers.get(className);
					if (!members) {
						return [];
					}

					return members.map((command, idx) => {
						const item = new vscode.CompletionItem(
							command.member!,
							CompletionItemKind.Method
						);

						item.detail = `(Class member) ${className}.${command.member}`;
						item.sortText = String(idx).padStart(6, '0');

						return item;
					});
				}

				return [...classesMembers.keys()].map(className => {
					const item = new vscode.CompletionItem(
						className,
						CompletionItemKind.Class
					);
					item.detail = 'Class';
					return item;
				});
			}
		};

		this.baseProvider.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(CONFIG.LANGUAGE_SELECTOR, provider, '.'));
	}
}