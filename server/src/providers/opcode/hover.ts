import { CommandType, Singleton } from '@shared';
import { Hover, MarkupKind } from 'vscode-languageserver';
import { getDottedWordRangeAtPosition } from '../../../src/utils';
import { BaseProvider } from '../base';
import { OpcodeProvider } from './opcode';

export class OpcodeHoverProvider extends Singleton {
	private opcode: OpcodeProvider = OpcodeProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public init() {
		this.connect();
	}

	private connect() {
		this.baseProvider.connection.onHover((params): Hover | undefined => {
			const doc = this.baseProvider.documents.get(params.textDocument.uri);
			if (!doc) {
				return;
			}

			const wordRange = getDottedWordRangeAtPosition(doc, params.position);
			if (!wordRange) {
				return;
			}

			const opcodes = this.opcode.get();
			const word = doc.getText(wordRange);

			const opcodeInfo = opcodes.get(word);
			if (!opcodeInfo) {
				return;
			}

			const element = opcodeInfo.find(cmd => cmd.name === word);
			if (!element) {
				return;
			}

			const format = (element.format?.[CommandType.OPCODE] ?? '').replace(/<[^>]+>/g, '');

			return {
				contents: { kind: MarkupKind.Markdown, value: `${format}\n\n${element.shortDesc}` }
			};
		});
	}
}