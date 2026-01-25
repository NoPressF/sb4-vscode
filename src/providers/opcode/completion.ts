import { CONFIG, Singleton } from '@utils';
import * as vscode from 'vscode';
import { CompletionItemKind } from 'vscode';
import { BaseProvider } from '../base';
import { OpcodeProvider } from './opcode';

export class OpcodeCompletionProvider extends Singleton {
	private opcode: OpcodeProvider = OpcodeProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public register() {
		const provider: vscode.CompletionItemProvider = {
			provideCompletionItems: (_doc, _pos, _token, _context) => {
				const opcodes = this.opcode.get();

				return [...opcodes.keys()].map(opcodeName => {
					const item = new vscode.CompletionItem(
						opcodeName,
						CompletionItemKind.Function
					);
					item.detail = `(Opcode) ${opcodeName}`;
					return item;
				});
			}
		};

		this.baseProvider.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(CONFIG.LANGUAGE_SELECTOR, provider, '.'));
	}
}