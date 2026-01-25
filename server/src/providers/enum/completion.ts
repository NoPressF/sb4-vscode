import { Singleton } from '@shared';
import { CompletionItem, CompletionItemKind, CompletionParams, Position, Range } from 'vscode-languageserver';
import { BaseProvider } from '../base';
import { EnumProvider } from './enum';

export class EnumCompletionProvider extends Singleton {
	private enum: EnumProvider = EnumProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public getResult(params: CompletionParams) {
		const doc = this.baseProvider.documents.get(params.textDocument.uri);
		if (!doc) {
			return [];
		}

		const enums = this.enum.get();

		const line = params.position.line;
		const range = Range.create(Position.create(line, 0), Position.create(line + 1, 0));
		const lineText = doc.getText(range);
		const textBeforeCursor = lineText.slice(0, params.position.character);

		const enumMatch = textBeforeCursor.match(/(\w+)\.$/);
		if (enumMatch) {
			const enumName = enumMatch[1];

			const members = enums.get(enumName);
			if (!members) {
				return [];
			}

			return members.map((member, idx) => ({
				label: member.name,
				kind: CompletionItemKind.EnumMember,
				detail: `(Enum member) ${enumName}.${member.name} = ${String(member.value)}`,
				sortText: String(idx).padStart(6, '0'),
				data: { type: 'enumMember', enumName, memberName: member.name }
			}));
		}

		const out: CompletionItem[] = [];
		for (const [enumName] of enums) {
			out.push({
				label: enumName,
				kind: CompletionItemKind.Enum,
				detail: "Enum",
				data: { type: 'enum', enumName }
			});
		}

		return out;
	}
}