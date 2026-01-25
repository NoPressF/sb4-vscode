import { CONFIG, Singleton } from '@utils';
import * as vscode from 'vscode';
import { CompletionItemKind } from 'vscode';
import { BaseProvider } from '../base';
import { EnumProvider } from './enum';

export class EnumCompletionProvider extends Singleton {
	private enum: EnumProvider = EnumProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public register() {
		const provider: vscode.CompletionItemProvider = {
			provideCompletionItems: (doc, pos, _token, _context) => {
				const enums = this.enum.get();

				const lineText = doc.lineAt(pos.line).text;
				const textBeforeCursor = lineText.slice(0, pos.character);

				const enumMatch = textBeforeCursor.match(/(\w+)\.$/);
				if (enumMatch) {
					const enumName = enumMatch[1];

					const members = enums.get(enumName);
					if (!members) {
						return [];
					}

					return members.map((member, idx) => {
						const item = new vscode.CompletionItem(
							member.name,
							CompletionItemKind.EnumMember
						);

						item.detail = `(Enum member) ${enumName}.${member.name} = ${String(member.value)}`;
						item.sortText = String(idx).padStart(6, '0');

						return item;
					});
				}

				return [...enums.keys()].map(enumName => {
					const item = new vscode.CompletionItem(
						enumName,
						CompletionItemKind.Enum
					);
					item.detail = 'Enum';
					return item;
				});
			}
		};

		this.baseProvider.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(CONFIG.LANGUAGE_SELECTOR, provider, '.'));
	}
}