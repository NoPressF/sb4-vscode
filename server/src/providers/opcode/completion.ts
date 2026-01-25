import { Singleton } from '@shared';
import { CompletionItem, CompletionItemKind, CompletionParams } from 'vscode-languageserver';
import { BaseProvider } from '../base';
import { OpcodeProvider } from './opcode';

export class OpcodeCompletionProvider extends Singleton {
	private opcode: OpcodeProvider = OpcodeProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public getResult(params: CompletionParams) {
		const doc = this.baseProvider.documents.get(params.textDocument.uri);
		if (!doc) {
			return [];
		}

		const opcodes = this.opcode.get();

		const out: CompletionItem[] = [];
		for (const [opcodeName] of opcodes) {
			out.push({
				label: opcodeName,
				kind: CompletionItemKind.Function,
				detail: `(Opcode) ${opcodeName}`,
				data: { type: 'opcode', opcodeName }
			});
		}

		return out;
	}
}