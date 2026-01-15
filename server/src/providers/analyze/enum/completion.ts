import { Enum } from './enum';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';
import { Singleton } from '@shared';

export class EnumCompletionProvider extends Singleton {
	private enum: Enum = Enum.getInstance();

	public init() {
		this.connect();
	}

	private connect() {
		this.enum.connection.onCompletion((params): CompletionItem[] => {
			const doc = this.enum.documents.get(params.textDocument.uri);
			if (!doc) {
				return [];
			}

			const enums = Enum.getInstance().getEnums();

			const pos = params.position;
			const text = doc.getText();
			const offset = doc.offsetAt(pos);

			const charBefore = text[offset - 1];

			if (charBefore === '.') {
				let i = offset - 2;
				while (i >= 0 && /\s/.test(text[i])) { i--; }
				let end = i + 1;
				while (i >= 0 && /[A-Za-z0-9_]/.test(text[i])) { i--; }
				const enumName = text.slice(i + 1, end);

				const items = enums.get(enumName);
				if (!items) {
					return [];
				}

				return items.map((m, idx) => ({
					label: m.name,
					kind: CompletionItemKind.EnumMember,
					detail: `(Enum member) ${enumName}.${m.name} = ${String(m.value)}`,
					sortText: String(idx).padStart(6, '0'),
					data: { type: 'enumMember', enumName, memberName: m.name }
				}));
			}

			let s = offset, e = offset;
			while (s > 0 && /[A-Za-z0-9_]/.test(text[s - 1])) { s--; }
			while (e < text.length && /[A-Za-z0-9_]/.test(text[e])) { e++; }
			const typed = text.slice(s, e).toLowerCase();

			const out: CompletionItem[] = [];
			for (const [enumName] of enums) {
				if (!typed || enumName.toLowerCase().includes(typed)) {
					out.push({
						label: enumName,
						kind: CompletionItemKind.Enum,
						detail: "Enum",
						data: { type: 'enum', enumName }
					});
				}
			}

			return out;
		});
	}
}